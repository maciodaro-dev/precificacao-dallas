"""Unidades de análise a partir do Census TIGER/Line 2025.
Área de estudo: região metropolitana Dallas-Fort Worth-Arlington, pelos 11 condados da delimitação do Census (OMB, 2023).
Gera data/unidades.csv e data/unidades.geojson. IDs fixos: U-<place GEOID>-<ISD GEOID>; não incorporado: U-ETJ-<county FIPS>-<ISD GEOID>.
Regras:
- Cidade: todo município incorporado (classe C do Census) com território nos 11 condados (pelo menos 10 acres de terra dentro deles,
  para descartar sobras de desenho na divisa). A cidade entra inteira, mesmo que parte dela fique em condado vizinho.
- Lado: "dallas" ou "fort_worth", pela divisão metropolitana (OMB, 2023) do condado predominante. Serve só para recortar a exibição.
- Fatia cidade x ISD entra se tiver >= 5% da área de terra da cidade ou >= 1.000 acres de terra.
- Não incorporado: condado x ISD, >= 1.000 acres de terra fora de qualquer cidade.
- Corpos d'água com mais de ~10 acres são descontados da área."""
import sys, pathlib, warnings
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
import geopandas as gpd, pandas as pd
from comum import DATA, CACHE, baixar
warnings.filterwarnings("ignore")
ANO = 2025; BASE = f"https://www2.census.gov/geo/tiger/TIGER{ANO}"
T = CACHE / "tiger"
CONDADOS = {"48085": "Collin", "48113": "Dallas", "48121": "Denton", "48139": "Ellis", "48231": "Hunt", "48251": "Johnson",
            "48257": "Kaufman", "48367": "Parker", "48397": "Rockwall", "48439": "Tarrant", "48497": "Wise"}
LADO_FW = {"48251", "48367", "48439", "48497"}  # Fort Worth-Arlington-Grapevine; os outros 7 são Dallas-Plano-Irving
CRS = 2276  # NAD83 / Texas North Central (ft)
AC = 43560.0

def ler(sub, nome):
    return gpd.read_file(f"zip://{baixar(f'{BASE}/{sub}/{nome}', T / nome)}")

def main():
    pl = ler("PLACE", f"tl_{ANO}_48_place.zip").to_crs(CRS)
    sd = ler("UNSD", f"tl_{ANO}_48_unsd.zip").to_crs(CRS)
    co = ler("COUNTY", f"tl_{ANO}_us_county.zip"); co = co[co.STATEFP == "48"].to_crs(CRS)
    agua = pd.concat([ler("AREAWATER", f"tl_{ANO}_{c}_areawater.zip") for c in CONDADOS]).to_crs(CRS)
    agua = agua[agua.AWATER > 40000]
    agua_u = agua.union_all()
    area = co[co.GEOID.isin(CONDADOS)]; area_u = area.union_all()

    inc = pl[pl.CLASSFP.str.startswith("C")].copy()
    cand = inc[inc.intersects(area_u)].copy()
    cand["geometry"] = cand.geometry.difference(agua_u)
    cand["terra_cidade"] = cand.area / AC
    cand["dentro"] = cand.geometry.intersection(area_u).area / AC
    sel = cand[(cand.terra_cidade > 0) & (cand.dentro >= 10)].copy()
    # nomes repetidos entre condados recebem o condado no nome, para não confundir
    sdx = sd[["GEOID", "NAME", "geometry"]].rename(columns={"GEOID": "isd_id", "NAME": "isd_nome"})
    x = gpd.overlay(sel[["GEOID", "NAME", "terra_cidade", "geometry"]], sdx, how="intersection", keep_geom_type=True)
    x["acres_terra"] = x.area / AC; x["pct_cidade"] = 100 * x.acres_terra / x.terra_cidade
    fica = (x.pct_cidade >= 5) | (x.acres_terra >= 1000)
    desc = x[~fica]; x = x[fica].copy()
    x["unidade_id"] = "U-" + x.GEOID + "-" + x.isd_id; x["tipo"] = "cidade_isd"
    x = x.rename(columns={"GEOID": "place_geoid", "NAME": "cidade"})

    inc_u = inc[inc.intersects(area_u)].union_all()
    ce = area[["GEOID", "NAME", "geometry"]].copy()
    ce["geometry"] = ce.geometry.difference(inc_u).difference(agua_u)
    e = gpd.overlay(ce.rename(columns={"GEOID": "cfips", "NAME": "cnome"}), sdx, how="intersection", keep_geom_type=True)
    e["acres_terra"] = e.area / AC; e = e[e.acres_terra >= 1000].copy()
    e["unidade_id"] = "U-ETJ-" + e.cfips + "-" + e.isd_id; e["tipo"] = "nao_incorporado"
    e["cidade"] = "Não incorporado – " + e.cnome; e["place_geoid"] = ""; e["pct_cidade"] = None

    u = gpd.GeoDataFrame(pd.concat([x, e], ignore_index=True), geometry="geometry", crs=CRS)
    u["isd_nome"] = u.isd_nome.str.replace(" Independent School District", " ISD").str.replace(" Consolidated ISD", " CISD").str.replace(" Municipal School District", " MSD")
    y = gpd.overlay(u[["unidade_id", "acres_terra", "geometry"]], co[["GEOID", "NAME", "geometry"]].rename(columns={"GEOID": "cfips", "NAME": "cnome"}), how="intersection", keep_geom_type=True)
    y["p"] = 100 * (y.area / AC) / y.acres_terra; y = y[y.p >= 1].sort_values("p", ascending=False)
    g = y.groupby("unidade_id")
    u["condado_fips"] = u.unidade_id.map(g.cfips.first()); u["condado"] = u.unidade_id.map(g.cnome.first())
    u["condados_pct"] = u.unidade_id.map(g.apply(lambda d: "; ".join(f"{r.cnome} {r.p:.0f}%" for r in d.itertuples())))
    # cidade com o mesmo nome em condados diferentes: acrescenta o condado
    rep = u[u.tipo == "cidade_isd"].groupby("cidade").place_geoid.nunique(); rep = set(rep[rep > 1].index)
    u["cidade"] = [f"{c} ({k})" if c in rep else c for c, k in zip(u.cidade, u.condado)]
    u["nome"] = u.cidade + " × " + u.isd_nome
    rp = u.geometry.representative_point().to_crs(4326); u["lon"] = rp.x.round(5); u["lat"] = rp.y.round(5)
    u["acres_terra"] = u.acres_terra.round(0); u["pct_cidade"] = u.pct_cidade.astype(float).round(1)
    # cidade com a maior parte fora dos 11 condados (ex.: Mineral Wells): vale o condado da DFW em que ela tem mais área
    dfw = y[y.cfips.isin(CONDADOS)].groupby("unidade_id").cfips.first()
    u["lado"] = ["fort_worth" if dfw.get(i) in LADO_FW else "dallas" for i in u.unidade_id]
    u["fonte"] = f"Census TIGER/Line {ANO}"; u = u.sort_values(["tipo", "nome"])
    cols = ["unidade_id", "nome", "tipo", "cidade", "place_geoid", "isd_id", "isd_nome", "condado", "condado_fips", "condados_pct", "lado", "acres_terra", "pct_cidade", "lat", "lon", "fonte"]
    u[cols].to_csv(DATA / "unidades.csv", index=False)
    gj = u[["unidade_id", "nome", "tipo", "geometry"]].copy(); gj["geometry"] = gj.geometry.simplify(250)
    gj = gj.to_crs(4326); gj.to_file(DATA / "unidades.geojson", driver="GeoJSON", COORDINATE_PRECISION=4)
    desc.assign(isd=desc.isd_nome)[["NAME", "isd", "pct_cidade", "acres_terra"]].round(1).to_csv(DATA / "manual" / "fatias_descartadas.csv", index=False)
    print(u.tipo.value_counts().to_dict(), "cidades:", x.cidade.nunique(), "fatias descartadas:", len(desc), "por condado:", u.groupby("condado").size().to_dict())

if __name__ == "__main__":
    main()
