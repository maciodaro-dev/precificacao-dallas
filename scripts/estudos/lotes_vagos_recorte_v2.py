"""Exemplo de recorte, versão 2: região = setor censitário cortado pelos limites de cidade e de ISD; pedaços pequenos unidos ao vizinho da mesma cidade e ISD;
nome reconhecível; setores grandes nas franjas subdivididos. Exploratório."""
import geopandas as gpd, pandas as pd, numpy as np, re, warnings, sys; warnings.filterwarnings("ignore")
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
R = "/home/user/precificacao-dallas"; ACRE = 43560.0
PEQUENO_ACRES, PEQUENO_PCT, GRANDE_ACRES, CELULA_PES = 80, 0.10, 2500, 5280 * 1.5
un = gpd.read_file(f"{R}/data/unidades.geojson").to_crs(2276); un["cidade"] = un["nome"].str.split(" × ").str[0]; un["isd"] = un["nome"].str.split(" × ").str[1]
tr = gpd.read_file(f"{R}/cache/tiger/tl_2025_48_tract.zip")[["GEOID", "geometry"]].to_crs(2276)
def limpa_nome(s):
    s = re.sub(r"\b(PHASE|PH|SEC|SECTION|ADDN|ADDITION|ADDN,|UNIT|BLK|BLOCK|LOT|THE|INSTALLMENT|REPLAT|AMENDED)\b.*", "", s.upper()); s = re.sub(r"[^A-Z' ]", " ", s); s = re.sub(r"\s+", " ", s).strip()
    return s.title() if len(s) >= 4 and "Survey" not in s.title() and "Abstract" not in s.title() else ""
def recortar(cid):
    partes = un[un.cidade == cid][["unidade_id", "isd", "geometry"]]
    p = gpd.overlay(tr, partes, how="intersection", keep_geom_type=True); p["acres"] = p.area / ACRE; p = p[p.acres > 0.5].reset_index(drop=True)
    tot = p.groupby("GEOID").acres.transform("sum"); p["rid"] = range(len(p)); n0 = len(p)
    # 1) pedaço pequeno (menos de 80 acres, ou menos de 10% do setor dentro da cidade) vai para o vizinho da mesma cidade e ISD com a maior divisa em comum
    unidos = 0
    for i in p.sort_values("acres").index:
        if not (p.at[i, "acres"] < PEQUENO_ACRES or p.at[i, "acres"] < PEQUENO_PCT * tot[i]): continue
        viz = p[(p.isd == p.at[i, "isd"]) & (p.rid != p.at[i, "rid"]) & p.geometry.intersects(p.at[i, "geometry"].buffer(30))]
        viz = viz[viz.rid.map(p.groupby("rid").acres.sum()) >= PEQUENO_ACRES] if len(viz) else viz
        if not len(viz): continue
        divisa = viz.geometry.apply(lambda g: g.buffer(30).intersection(p.at[i, "geometry"].buffer(30)).area); p.at[i, "rid"] = viz.loc[divisa.idxmax(), "rid"]; unidos += 1
    reg = p.dissolve(by="rid", aggfunc={"acres": "sum", "isd": "first", "GEOID": lambda s: ", ".join(sorted(set(s)))}).reset_index()
    # 2) franja: região com mais de 2.500 acres é cortada numa grade de 1,5 milha (proposta)
    novas = []
    for r in reg.itertuples():
        if r.acres <= GRANDE_ACRES: novas.append(dict(isd=r.isd, GEOID=r.GEOID, geometry=r.geometry, franja=False)); continue
        x0, y0, x1, y1 = r.geometry.bounds
        for gx in np.arange(np.floor(x0 / CELULA_PES) * CELULA_PES, x1, CELULA_PES):
            for gy in np.arange(np.floor(y0 / CELULA_PES) * CELULA_PES, y1, CELULA_PES):
                from shapely.geometry import box
                g = r.geometry.intersection(box(gx, gy, gx + CELULA_PES, gy + CELULA_PES))
                if not g.is_empty and g.area / ACRE > 20: novas.append(dict(isd=r.isd, GEOID=r.GEOID, geometry=g, franja=True))
    reg2 = gpd.GeoDataFrame(novas, crs=2276); reg2["acres"] = reg2.area / ACRE; reg2["rid"] = range(len(reg2))
    return reg2, n0, unidos, len(reg), int((reg.acres > GRANDE_ACRES).sum())
def nomear(cid, reg, lotes):
    c = un[un.cidade == cid].union_all().centroid; j = gpd.sjoin(lotes, reg[["rid", "geometry"]], how="left", predicate="within")
    nomes, usados = {}, {}
    for r in reg.itertuples():
        subs = j[j.rid == r.rid]["sub"].map(limpa_nome); subs = subs[subs != ""]
        dx, dy = r.geometry.centroid.x - c.x, r.geometry.centroid.y - c.y; d = (("norte" if dy > 0 else "sul") if abs(dy) > abs(dx) * 0.5 else "") + ("" if abs(dx) < abs(dy) * 0.5 else ("leste" if dx > 0 else "oeste"))
        d = {"norteleste": "nordeste", "norteoeste": "noroeste", "sulleste": "sudeste", "suloeste": "sudoeste"}.get(d, d) if (dx * dx + dy * dy) ** .5 > 5280 else "centro"
        base = f"{cid} · {subs.mode().iloc[0]}" if len(subs) >= 5 else f"{cid} · {d}"
        usados[base] = usados.get(base, 0) + 1; nomes[r.rid] = base if usados[base] == 1 else f"{base} ({usados[base]})"
    reg["nome"] = reg.rid.map(nomes); reg["lotes"] = reg.rid.map(j.groupby("rid").size()).fillna(0).astype(int); return reg
fig, ax = plt.subplots(1, 2, figsize=(17, 9)); out = []
for k, cid in enumerate(["Frisco", "Mansfield"]):
    lotes = gpd.read_file(f"{cid}.gpkg").to_crs(2276); reg, n0, unidos, n1, grandes = recortar(cid); reg = nomear(cid, reg, lotes)
    out.append(f"\n### {cid}\n\n- Setor × cidade × ISD: {n0} pedaços. Unidos ao vizinho por serem pequenos: {unidos}. Regiões depois da união: {n1}. Dessas, {grandes} tinham mais de {GRANDE_ACRES:,} acres e foram cortadas em células de 1,5 milha.\n- **Regiões finais: {len(reg)}** (mediana de {reg.acres.median():,.0f} acres; {int((reg.lotes >= 10).sum())} com 10 ou mais terrenos vagos; {int((reg.lotes == 0).sum())} sem nenhum).\n\n| Região | ISD | Acres | Terrenos vagos | Franja subdividida |\n|---|---|--:|--:|:-:|".replace(",", "."))
    for r in reg.sort_values("lotes", ascending=False).head(12).itertuples(): out.append(f"| {r.nome} | {r.isd} | {r.acres:,.0f} | {r.lotes} | {'sim' if r.franja else ''} |".replace(",", "."))
    a = ax[k]; reg.plot(ax=a, column="rid", categorical=True, cmap="tab20", alpha=0.35, edgecolor="#333", linewidth=0.6); lotes.plot(ax=a, color="#17253C", markersize=3)
    for r in reg[reg.lotes >= 25].itertuples(): a.annotate(r.nome.split(" · ")[1][:22], (r.geometry.representative_point().x, r.geometry.representative_point().y), fontsize=6.5, ha="center")
    a.set_title(f"{cid}: {len(reg)} regiões (setor censitário × cidade × ISD); pontos = terrenos vagos", fontsize=11); a.set_axis_off(); print(cid, n0, unidos, n1, grandes, len(reg))
plt.tight_layout(); plt.savefig(f"{R}/docs/recorte_regioes_exemplo_v2.png", dpi=100); open("recorte2.md", "w").write("\n".join(out))
