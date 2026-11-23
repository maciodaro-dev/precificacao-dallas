"""Unidades de análise a partir do Census TIGER/Line 2025.
Gera data/unidades.csv e data/unidades.geojson. IDs fixos: U-<place GEOID>-<ISD GEOID>; ETJ: U-ETJ-<county FIPS>-<ISD GEOID>.
Regra: fatia cidade x ISD entra se tiver >= 5% da área de terra da cidade ou >= 1.000 acres de terra.
ETJ / não incorporado: condado x ISD, só ISDs que atendem cidades da lista, >= 1.000 acres de terra."""
import sys, json, pathlib, warnings
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
import geopandas as gpd, pandas as pd
from comum import DATA, CACHE, baixar
warnings.filterwarnings("ignore")
ANO = 2025; BASE = f"https://www2.census.gov/geo/tiger/TIGER{ANO}"
T = CACHE / "tiger"
CIDADES = json.load(open(DATA / "manual" / "cidades.json", encoding="utf-8"))
CONDADOS_ETJ = {"48085": "Collin", "48121": "Denton", "48113": "Dallas", "48397": "Rockwall", "48257": "Kaufman", "48139": "Ellis"}
CONDADOS_AGUA = ["085", "113", "121", "139", "231", "257", "397", "439"]
CRS = 2276  # NAD83 / Texas North Central (ft)
AC = 43560.0

def ler(sub, nome):
    return gpd.read_file(f"zip://{baixar(f'{BASE}/{sub}/{nome}', T / nome)}")

pl = ler("PLACE", f"tl_{ANO}_48_place.zip").to_crs(CRS)
sd = ler("UNSD", f"tl_{ANO}_48_unsd.zip").to_crs(CRS)
co = ler("COUNTY", f"tl_{ANO}_us_county.zip"); co = co[co.STATEFP == "48"].to_crs(CRS)
agua = pd.concat([ler("AREAWATER", f"tl_{ANO}_48{c}_areawater.zip") for c in CONDADOS_AGUA]).to_crs(CRS)
agua = agua[agua.AWATER > 40000]  # corpos d'água > ~10 acres
agua_u = agua.union_all()

area7 = co[co.GEOID.isin(list(CONDADOS_ETJ) + ["48439", "48231"])]
cand = pl[pl.intersects(area7.union_all())]
sel = cand[cand.NAME.isin(CIDADES)].copy()
falt = sorted(set(CIDADES) - set(sel.NAME)); assert not falt, falt
assert sel.NAME.is_unique
sel["geometry"] = sel.geometry.difference(agua_u)
sel["terra_cidade"] = sel.area / AC
sdx = sd[["GEOID", "NAME", "geometry"]].rename(columns={"GEOID": "isd_id", "NAME": "isd_nome"})
x = gpd.overlay(sel[["GEOID", "NAME", "terra_cidade", "geometry"]], sdx, how="intersection", keep_geom_type=True)
x["acres_terra"] = x.area / AC; x["pct_cidade"] = 100 * x.acres_terra / x.terra_cidade
desc = x[~((x.pct_cidade >= 5) | (x.acres_terra >= 1000))]
x = x[(x.pct_cidade >= 5) | (x.acres_terra >= 1000)].copy()
x["unidade_id"] = "U-" + x.GEOID + "-" + x.isd_id; x["tipo"] = "cidade_isd"
x = x.rename(columns={"GEOID": "place_geoid", "NAME": "cidade"})

# ETJ / não incorporado: condado menos todos os lugares incorporados (CLASSFP C*), menos água
inc = pl[pl.CLASSFP.str.startswith("C")].union_all()
isds = set(x.isd_id)
ce = co[co.GEOID.isin(CONDADOS_ETJ)][["GEOID", "NAME", "geometry"]].copy()
ce["geometry"] = ce.geometry.difference(inc).difference(agua_u)
e = gpd.overlay(ce.rename(columns={"GEOID": "cfips", "NAME": "cnome"}), sdx[sdx.isd_id.isin(isds)], how="intersection", keep_geom_type=True)
e["acres_terra"] = e.area / AC; e = e[e.acres_terra >= 1000].copy()
e["unidade_id"] = "U-ETJ-" + e.cfips + "-" + e.isd_id; e["tipo"] = "nao_incorporado"
e["cidade"] = "Não incorporado – " + e.cnome; e["place_geoid"] = ""; e["pct_cidade"] = None

u = pd.concat([x, e], ignore_index=True)
u = gpd.GeoDataFrame(u, geometry="geometry", crs=CRS)
u["isd_nome"] = u.isd_nome.str.replace(" Independent School District", " ISD")
u["nome"] = u.cidade + " × " + u.isd_nome
# condados por unidade
y = gpd.overlay(u[["unidade_id", "acres_terra", "geometry"]], co[["GEOID", "NAME", "geometry"]].rename(columns={"GEOID": "cfips", "NAME": "cnome"}), how="intersection", keep_geom_type=True)
y["p"] = 100 * (y.area / AC) / y.acres_terra; y = y[y.p >= 1].sort_values("p", ascending=False)
g = y.groupby("unidade_id")
u["condado_fips"] = u.unidade_id.map(g.cfips.first()); u["condado"] = u.unidade_id.map(g.cnome.first())
u["condados_pct"] = u.unidade_id.map(g.apply(lambda d: "; ".join(f"{r.cnome} {r.p:.0f}%" for r in d.itertuples())))
rp = u.geometry.representative_point().to_crs(4326); u["lon"] = rp.x.round(5); u["lat"] = rp.y.round(5)
u["acres_terra"] = u.acres_terra.round(0); u["pct_cidade"] = u.pct_cidade.astype(float).round(1)
u["fonte"] = f"Census TIGER/Line {ANO}"; u = u.sort_values(["tipo", "nome"])
cols = ["unidade_id", "nome", "tipo", "cidade", "place_geoid", "isd_id", "isd_nome", "condado", "condado_fips", "condados_pct", "acres_terra", "pct_cidade", "lat", "lon", "fonte"]
u[cols].to_csv(DATA / "unidades.csv", index=False)
gj = u[["unidade_id", "nome", "tipo", "geometry"]].copy(); gj["geometry"] = gj.geometry.simplify(150).to_crs(4326) if False else gj.geometry.simplify(150)
gj = gj.to_crs(4326); gj.to_file(DATA / "unidades.geojson", driver="GeoJSON", COORDINATE_PRECISION=5)
desc.assign(isd=desc.isd_nome)[["NAME", "isd", "pct_cidade", "acres_terra"]].round(1).to_csv(DATA / "manual" / "fatias_descartadas.csv", index=False)
print(u.tipo.value_counts().to_dict(), "cidades:", x.cidade.nunique(), "descartadas:", len(desc))
