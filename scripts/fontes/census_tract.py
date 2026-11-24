"""Renda por fatia, a partir dos setores censitários (census tracts) do ACS 5 anos.

Para que serve: Census publica renda mediana por cidade inteira. Uma unidade "cidade × ISD" que é só uma fatia da cidade
(ex.: Dallas × Plano ISD) não é bem representada por esse número. Aqui a renda é recalculada só com os setores que caem na fatia.

Método:
 1. Cruza o polígono de cada unidade com os setores censitários (TIGER/Line).
 2. Reparte os domicílios de cada setor (tabela B19001, por classe de renda) pela parcela da ÁREA do setor que cai na unidade.
    É uma aproximação: supõe domicílios espalhados por igual dentro do setor.
 3. Soma as classes de renda da unidade e calcula a mediana por interpolação linear dentro da classe (método padrão para dados agrupados).
Grava:
 - c23|renda_mediana para unidades cidade × ISD com menos de 90% da área da cidade e para áreas não incorporadas (que não tinham dado);
 - ctx|pct_domicilios_cidade: parcela dos domicílios da cidade que cada unidade cidade × ISD representa.
Confiança: média com 400 domicílios ou mais na fatia; baixa abaixo disso. Sem valor com menos de 50 domicílios."""
import sys, pathlib, warnings; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
warnings.filterwarnings("ignore")
import geopandas as gpd
from comum import *
ANO = 2024
BASE = f"https://www2.census.gov/programs-surveys/acs/summary_file/{ANO}/table-based-SF/data/5YRData"
TIGER = "https://www2.census.gov/geo/tiger/TIGER2025/TRACT/tl_2025_48_tract.zip"
CONDADOS = {"48085", "48113", "48121", "48139", "48231", "48251", "48257", "48367", "48397", "48439", "48497"}
# limites das 16 classes de renda da B19001 (colunas 2 a 17); a última é aberta (US$ 200 mil ou mais)
LIM = [0, 10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000, 60000, 75000, 100000, 125000, 150000, 200000]
REPRESENTATIVA = 90
def mediana(cls):
    tot = sum(cls)
    if tot <= 0: return None, False
    meio, ac = tot / 2, 0
    for i, n in enumerate(cls):
        if ac + n >= meio and n > 0:
            if i == len(cls) - 1: return 200001, True      # mediana na classe aberta: só se sabe que é US$ 200 mil ou mais
            return LIM[i] + (LIM[i + 1] - LIM[i]) * (meio - ac) / n, False
        ac += n
    return None, False
def main():
    arq = baixar(f"{BASE}/acsdt5y{ANO}-b19001.dat", CACHE / "acs" / f"{ANO}-b19001.dat"); cab = None; dom = {}
    for l in open(arq, encoding="latin-1"):
        p = l.rstrip("\n").split("|")
        if cab is None: cab = p; continue
        if p[0].startswith("1400000US48") and p[0][9:14] in CONDADOS:
            est = [float(p[cab.index(f"B19001_E{i:03d}")] or 0) for i in range(1, 18)]
            dom[p[0][9:]] = est            # est[0] = total; est[1:] = 16 classes
    setores = gpd.read_file(baixar(TIGER, CACHE / "tiger" / "tl_2025_48_tract.zip"))
    setores = setores[setores["GEOID"].isin(dom)][["GEOID", "geometry"]].to_crs(2276)
    setores["a_setor"] = setores.area
    un = gpd.read_file(DATA / "unidades.geojson")[["unidade_id", "geometry"]].to_crs(2276)
    x = gpd.overlay(un, setores, how="intersection", keep_geom_type=True); x["parte"] = x.area / x["a_setor"]
    classes, nset = {}, {}
    for _, r in x.iterrows():
        if r["parte"] < 0.001: continue
        c = classes.setdefault(r["unidade_id"], [0.0] * 16); nset[r["unidade_id"]] = nset.get(r["unidade_id"], 0) + 1
        for i, v in enumerate(dom[r["GEOID"]][1:]): c[i] += v * r["parte"]
    us = unidades(); por_cidade = {}
    for u in us:
        if u["tipo"] == "cidade_isd": por_cidade[u["place_geoid"]] = por_cidade.get(u["place_geoid"], 0) + sum(classes.get(u["unidade_id"], []))
    L = []; url = f"{BASE}/acsdt5y{ANO}-b19001.dat"; ref = f"{ANO-4}-{ANO}"
    for u in us:
        c = classes.get(u["unidade_id"]); n = sum(c) if c else 0
        if n > 0: L.append(dict(unidade_id=u["unidade_id"], criterio_id="ctx", metrica="domicilios", valor=round(n), unidade_medida="domicílios", url=url, data_referencia=f"{ANO}-12-31", confianca="media",
                                obs=f"ACS {ref}: domicílios dos setores censitários repartidos pela área que cai na unidade"))
        if u["tipo"] == "cidade_isd" and por_cidade.get(u["place_geoid"]):
            L.append(dict(unidade_id=u["unidade_id"], criterio_id="ctx", metrica="pct_domicilios_cidade", valor=round(100 * n / por_cidade[u["place_geoid"]], 1), unidade_medida="%",
                          url=url, data_referencia=f"{ANO}-12-31", confianca="media", obs=f"ACS {ref}: cerca de {n:.0f} domicílios na unidade, repartidos dos setores censitários pela área"))
        fatia = u["tipo"] == "nao_incorporado" or float(u["pct_cidade"] or 100) < REPRESENTATIVA
        if not fatia or n < 50: continue
        m, teto = mediana(c)
        if m is None: continue
        L.append(dict(unidade_id=u["unidade_id"], criterio_id="c23", metrica="renda_mediana", valor=round(m, -2) if not teto else m, unidade_medida="US$/ano", url=url, data_referencia=f"{ANO}-12-31",
                      confianca="baixa" if (teto or n < 400) else "media",
                      obs=(f"dado da fatia: ACS {ref}, {nset[u['unidade_id']]} setores censitários, cerca de {n:.0f} domicílios; mediana estimada por classes de renda, domicílios repartidos pela área do setor"
                           + ("; mediana na classe aberta: o real é US$ 200 mil ou mais" if teto else ""))))
    gravar("census_tract", L)
    print(f"census_tract: {sum(1 for l in L if l['metrica']=='renda_mediana')} unidades com renda da fatia; {sum(1 for l in L if l['criterio_id']=='ctx')} com parcela de domicílios")
if __name__ == "__main__": main()
