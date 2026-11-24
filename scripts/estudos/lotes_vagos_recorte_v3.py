"""Exemplo de recorte, versão 3 (regras aprovadas pelo usuário em 2026-11-24). Exploratório: não altera a base.
Região = setor censitário ∩ cidade ∩ ISD. Pedaço pequeno (menos de 80 acres, ou menos de 10% do setor na cidade E menos de 320 acres) vai para o vizinho da mesma
cidade e ISD; sem vizinho, fica como "fatia pequena". Região com mais de 2.500 acres e 50 ou mais terrenos vagos é cortada por vias principais, ferrovias e água
(alvo de 640 a 2.500 acres); grade só onde não houver via que sirva. Nome: cidade + loteamento mais comum entre todos os lotes; senão via principal; senão posição."""
import geopandas as gpd, pandas as pd, numpy as np, json, re, warnings, collections; warnings.filterwarnings("ignore")
from shapely.geometry import box
from shapely.ops import unary_union
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
R = "/home/user/precificacao-dallas"; ACRE = 43560.0; L = "/tmp/claude-0/-home-user/f959c78c-3ec9-5e44-b75d-70e4cae9db8d/scratchpad/lotes/"
un = gpd.read_file(f"{R}/data/unidades.geojson").to_crs(2276); un["cidade"] = un["nome"].str.split(" × ").str[0]; un["isd"] = un["nome"].str.split(" × ").str[1]
tr = gpd.read_file(f"{R}/cache/tiger/tl_2025_48_tract.zip")[["GEOID", "geometry"]].to_crs(2276)
vias = gpd.read_file(f"{R}/cache/tiger/tl_2025_48_prisecroads.zip")[["FULLNAME", "MTFCC", "geometry"]].to_crs(2276)
trilhos = gpd.read_file(f"{R}/cache/tiger/tl_2025_us_rails.zip", bbox=(-98.2, 32.0, -95.8, 33.6))[["geometry"]].to_crs(2276)
renda = {}
for l in open(f"{R}/cache/acs/2024-b19013.dat", encoding="latin-1"):
    p = l.rstrip("\n").split("|")
    if p[0].startswith("1400000US48"):
        try: renda[p[0][9:]] = (float(p[1]), float(p[2]))
        except ValueError: pass
RUIM = re.compile(r"(CITY OF|TOWN OF|UNPLATTED|ABSTRACT|\bABST\b|\bABS\b|SURVEY|\bSUR\b|UNASSIGNED|\bISD\b|COUNTY|^\d|RAILROAD|\bRR\b|HIGHWAY|R\.?O\.?W)", re.I)
def loteamento(s):
    s = (s or "").upper()
    if RUIM.search(s): return ""
    s = re.sub(r"[,(].*", "", s); s = re.sub(r"\b(PHASE|PH|SEC|SECTION|ADDN|ADDITION|ADDN|ADD|UNIT|BLK|BLOCK|LOT|LT|INSTALLMENT|INST|REPLAT|AMENDED|REVISED|NO|VILLAGE \d+|TRACT)\b.*", "", s)
    s = re.sub(r"[^A-Z' ]", " ", s); s = re.sub(r"\b(THE|AT|OF)$", "", re.sub(r"\s+", " ", s).strip()).strip()
    return s.title() if len(s) >= 4 else ""
def cadastro(cid):
    P = []
    for arq, campo in ({"Frisco": [("frisco_collin", "legalAbsSubName"), ("frisco_denton", "abstractSubdivisionDescription")], "Mansfield": [("mansfield_tarrant", "LegalDescription"), ("mansfield_johnson", None)]})[cid]:
        for r in json.load(open(f"{R}/cache/cadastro/{arq}.json")):
            s = (r.get(campo) or "") if campo else ""
            if campo == "LegalDescription": s = re.split(r"\s+Block\b|\s+Lot\b|\s+Tract\b", s)[0]
            P.append((r["lon"], r["lat"], loteamento(s), arq, r.get("PTDLand")))
    d = pd.DataFrame(P, columns=["lon", "lat", "sub", "fonte", "ptd"]); return gpd.GeoDataFrame(d, geometry=gpd.points_from_xy(d.lon, d.lat), crs=4326).to_crs(2276)
def vagos(cid, cad):
    v = gpd.read_file(f"{L}{cid}.gpkg").to_crs(2276)[["geometry"]]
    if cid == "Mansfield": v = pd.concat([v, cad[(cad.fonte == "mansfield_johnson") & (cad.ptd == "C1")][["geometry"]]])   # parte no condado de Johnson (sem limpeza)
    return gpd.GeoDataFrame(v, crs=2276)
def recortar(cid, vag, cad):
    lim = un[un.cidade == cid]; partes = lim[["isd", "geometry"]]
    p = gpd.overlay(tr, partes, how="intersection", keep_geom_type=True); p["acres"] = p.area / ACRE; p = p[p.acres > 0.5].reset_index(drop=True)
    tot = p.groupby("GEOID").acres.transform("sum"); p["rid"] = range(len(p)); p["fatia"] = False; n0 = len(p); unidos = 0
    for i in p.sort_values("acres").index:
        a = p.at[i, "acres"]
        if not (a < 80 or (a < 0.10 * tot[i] and a < 320)): continue
        ac_reg = p.groupby("rid").acres.sum()
        viz = p[(p.isd == p.at[i, "isd"]) & (p.rid != p.at[i, "rid"]) & p.geometry.intersects(p.at[i, "geometry"].buffer(30))]
        viz = viz[viz.rid.map(ac_reg) >= 80]
        if not len(viz): p.at[i, "fatia"] = True; continue
        divisa = viz.geometry.apply(lambda g: g.buffer(30).intersection(p.at[i, "geometry"].buffer(30)).area); p.at[i, "rid"] = viz.loc[divisa.idxmax(), "rid"]; unidos += 1
    reg = p.dissolve(by="rid", aggfunc={"acres": "sum", "isd": "first", "GEOID": lambda s: sorted(set(s), key=lambda g: -p[p.GEOID == g].acres.sum())[0], "fatia": "all"}).reset_index()
    reg["lotes"] = gpd.sjoin(vag, reg[["rid", "geometry"]], predicate="within").groupby("rid").size().reindex(reg.rid).fillna(0).astype(int).values
    # ---- franja: cortar por vias principais, ferrovias (e água já está fora dos limites de terra)
    caixa = box(*lim.total_bounds).buffer(3000); linhas = pd.concat([vias[vias.intersects(caixa)][["geometry"]], trilhos[trilhos.intersects(caixa)][["geometry"]]])
    faca = unary_union(list(linhas.geometry)).buffer(20); novas = []; cortadas = grade = 0
    for r in reg.itertuples():
        if r.acres <= 2500 or r.lotes < 50: novas.append(dict(isd=r.isd, GEOID=r.GEOID, geometry=r.geometry, fatia=r.fatia, corte="")); continue
        ped = gpd.GeoDataFrame(geometry=[g for g in getattr(r.geometry.difference(faca), "geoms", [r.geometry.difference(faca)]) if g.area / ACRE > 1], crs=2276); ped["k"] = range(len(ped)); ped["ac"] = ped.area / ACRE
        while len(ped) > 1 and ped.ac.min() < 640:      # pedaço abaixo do alvo volta para o vizinho com a maior divisa
            i = ped.ac.idxmin(); g = ped.at[i, "geometry"]; o = ped.drop(i); d = o.geometry.apply(lambda x: x.buffer(60).intersection(g.buffer(60)).area)
            if d.max() <= 0: break
            j = d.idxmax(); ped.at[j, "geometry"] = unary_union([ped.at[j, "geometry"], g.buffer(25)]).buffer(-5).intersection(r.geometry); ped = ped.drop(i); ped["ac"] = ped.area / ACRE
        if len(ped) > 1:
            cortadas += 1
            for g in ped.geometry: novas.append(dict(isd=r.isd, GEOID=r.GEOID, geometry=g, fatia=False, corte="vias"))
        else:
            grade += 1; x0, y0, x1, y1 = r.geometry.bounds; lado = 5280 * 1.5
            for gx in np.arange(np.floor(x0 / lado) * lado, x1, lado):
                for gy in np.arange(np.floor(y0 / lado) * lado, y1, lado):
                    g = r.geometry.intersection(box(gx, gy, gx + lado, gy + lado))
                    if not g.is_empty and g.area / ACRE > 20: novas.append(dict(isd=r.isd, GEOID=r.GEOID, geometry=g, fatia=False, corte="grade (sem via que sirva)"))
    f = gpd.GeoDataFrame(novas, crs=2276); f["acres"] = f.area / ACRE; f["rid"] = range(len(f))
    f["lotes"] = gpd.sjoin(vag, f[["rid", "geometry"]], predicate="within").groupby("rid").size().reindex(f.rid).fillna(0).astype(int).values
    return f, n0, unidos, len(reg), cortadas, grade
def nomear(cid, f, cad):
    c = un[un.cidade == cid].union_all().centroid; j = gpd.sjoin(cad, f[["rid", "geometry"]], predicate="within"); base = {}; origem = {}
    def posicao(g, ref):
        dx, dy = g.centroid.x - ref.x, g.centroid.y - ref.y
        if (dx * dx + dy * dy) ** .5 < 2600: return "centro"
        ns = "norte" if dy > 0 else "sul"; lo = "leste" if dx > 0 else "oeste"
        return ns if abs(dy) > 2 * abs(dx) else lo if abs(dx) > 2 * abs(dy) else {"norteleste": "nordeste", "norteoeste": "noroeste", "sulleste": "sudeste", "suloeste": "sudoeste"}[ns + lo]
    for r in f.itertuples():
        s = j[j.rid == r.rid]["sub"]; n = len(s); s = s[s != ""].value_counts()
        if len(s) and s.iloc[0] >= 30 and s.iloc[0] >= 0.15 * n: base[r.rid] = s.index[0]; origem[r.rid] = "loteamento"; continue
        v = vias[vias.intersects(r.geometry.buffer(150)) & vias.FULLNAME.notna()]
        if len(v): v = v.assign(comp=v.geometry.intersection(r.geometry.buffer(150)).length).groupby("FULLNAME").comp.sum(); base[r.rid] = v.idxmax(); origem[r.rid] = "via principal"; continue
        base[r.rid] = posicao(r.geometry, c); origem[r.rid] = "posição"
    f["base"] = f.rid.map(base); f["origem_nome"] = f.rid.map(origem); nomes = {}
    for b, g in f.groupby("base"):
        if len(g) == 1: nomes[g.rid.iloc[0]] = f"{cid} · {b}"; continue
        ref = g.union_all().centroid; usados = collections.Counter()
        for r in g.itertuples():
            pos = posicao(r.geometry, ref); usados[pos] += 1; nomes[r.rid] = f"{cid} · {b}, {pos}" if usados[pos] == 1 else f"{cid} · {b}, {pos} ({'perto de ' + str(vias.iloc[vias.distance(r.geometry.centroid).idxmin() if False else vias.distance(r.geometry.centroid).values.argmin()].FULLNAME)})"
    f["nome"] = f.rid.map(nomes); return f, j
fig, ax = plt.subplots(1, 2, figsize=(18, 10)); out = []
for k, cid in enumerate(["Frisco", "Mansfield"]):
    cad = cadastro(cid); vag = vagos(cid, cad); f, n0, unidos, n1, cortadas, grade = recortar(cid, vag, cad); f, j = nomear(cid, f, cad)
    # loteamento dividido por mais de uma região? (só entre as regiões que vieram de um corte)
    jj = j[j["sub"] != ""].merge(f[["rid", "corte", "GEOID", "isd"]], on="rid"); jj = jj[jj.corte != ""]; div = 0
    for (s, geo, isd), g in jj.groupby(["sub", "GEOID", "isd"]):
        if len(g) >= 30 and (g.rid.value_counts(normalize=True) >= 0.15).sum() > 1: div += 1
    f["renda_est"] = f.GEOID.map(lambda g: renda.get(g, (None, None))[0]); f["renda_moe"] = f.GEOID.map(lambda g: renda.get(g, (None, None))[1])
    tr_ac = tr.set_index("GEOID").area / ACRE; f["setor_inteiro"] = f.acres < 0.95 * f.GEOID.map(tr_ac)
    baixa = int(((f.renda_moe / f.renda_est) > 0.20).sum()); semr = int(f.renda_est.isna().sum())
    out += [f"\n### {cid}\n", f"- Pedaços (setor × cidade × ISD): {n0}. Unidos ao vizinho: {unidos}. Fatias pequenas sem vizinho da mesma cidade e ISD (ocultas por padrão): {int(f.fatia.sum())}.",
            f"- Regiões antes do corte de franja: {n1}. Cortadas por vias principais e ferrovias: {cortadas}. Cortadas por grade, por não haver via que sirva: {grade}.",
            f"- **Regiões finais: {len(f)}** ({int((f.lotes >= 10).sum())} com 10 ou mais terrenos vagos; {int((f.lotes == 0).sum())} sem nenhum). Acres: mediana {f.acres.median():,.0f}, máximo {f.acres.max():,.0f}.".replace(",", "."),
            f"- Loteamentos divididos entre duas regiões pelo corte: {div}.", f"- Nome: {dict(f.origem_nome.value_counts())}.",
            f"- Renda: {baixa} regiões com confiança baixa (margem de erro acima de 20%); {semr} sem renda publicada para o setor; {int(f.setor_inteiro.sum())} são pedaço de um setor e mostram \"renda do setor inteiro\".", "",
            "| Região | ISD | Acres | Terrenos vagos | Nome veio de | Corte | Renda do setor (± margem) |", "|---|---|--:|--:|---|---|---|"]
    for r in f.sort_values("lotes", ascending=False).head(14).itertuples():
        out.append(f"| {r.nome} | {r.isd} | {r.acres:,.0f} | {r.lotes} | {r.origem_nome} | {r.corte} | {'sem dado' if pd.isna(r.renda_est) else f'${r.renda_est:,.0f} ± {100 * r.renda_moe / r.renda_est:.0f}%'}{' (setor inteiro)' if r.setor_inteiro else ''} |".replace(",", "."))
    a = ax[k]; f.plot(ax=a, column="rid", categorical=True, cmap="tab20", alpha=0.35, edgecolor="#333", linewidth=0.7)
    caixa = box(*un[un.cidade == cid].total_bounds); vias[vias.intersects(caixa)].clip(caixa).plot(ax=a, color="#8F3F49", linewidth=1.3); trilhos[trilhos.intersects(caixa)].clip(caixa).plot(ax=a, color="#555", linewidth=0.9, linestyle="--")
    vag.plot(ax=a, color="#17253C", markersize=2.5)
    for r in f[f.lotes >= 20].itertuples(): a.annotate(r.nome.split(" · ")[1][:26], (r.geometry.representative_point().x, r.geometry.representative_point().y), fontsize=6.5, ha="center", bbox=dict(boxstyle="round,pad=0.15", fc="white", ec="none", alpha=0.75))
    a.set_title(f"{cid}: {len(f)} regiões. Linhas bordô = vias principais; tracejado = ferrovia; pontos = terrenos vagos", fontsize=10.5); a.set_axis_off(); print(cid, n0, unidos, n1, cortadas, grade, len(f), div, baixa)
plt.tight_layout(); plt.savefig(f"{R}/docs/recorte_regioes_exemplo_v3.png", dpi=105); open(f"{L}recorte3.md", "w").write("\n".join(out))
