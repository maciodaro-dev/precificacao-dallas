"""Leis estaduais do Texas que afetam os critérios 6 e 8.
SB 15 (89R, vigente desde 2025-09-01), Local Government Code 211.052: vale para município com população > 150.000 situado em
condado com população > 300.000, em gleba >= 5 acres, sem plat registrado, zoneada unifamiliar. Nesses casos a cidade não pode
exigir lote > 3.000 sqft, > 30 ft de largura ou > 75 ft de profundidade.
População legal = censo decenal de 2020 (Government Code 311.005). Aqui uso a base de 1/abr/2020 do Census Population Estimates.
Moratórias (HB 2559, vigente desde 2025-09-01): 90 dias, máximo agregado de 180, sem repetição por 2 anos. Situação por cidade
vem de data/manual/moratorias.csv (leitura manual, com URL)."""
import sys, pathlib, csv; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from comum import *
URLP = "https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/cities/totals/sub-est2025_48.csv"
SB15 = "https://capitol.texas.gov/tlodocs/89R/billtext/html/SB00015F.htm"
COND_300K = {"Collin", "Denton", "Dallas", "Tarrant"}  # condados da DFW com mais de 300 mil hab. no censo 2020 (os outros 7 ficam abaixo)
def main():
    pop = {}
    for r in csv.DictReader(open(baixar(URLP, CACHE / "popest.csv"), encoding="latin-1")):
        if r["SUMLEV"] == "162": pop["48" + r["PLACE"]] = (int(r["ESTIMATESBASE2020"]), int(r["POPESTIMATE2025"]))
    mor = {r["cidade"]: r for r in csv.DictReader(open(DATA / "manual" / "moratorias.csv", encoding="utf-8"))}
    L = []
    for u in unidades():
        g = u["place_geoid"]; b = dict(unidade_id=u["unidade_id"])
        if g and g in pop:
            p20, p25 = pop[g]; cond = any(c in u["condados_pct"] for c in COND_300K)
            cob = p20 > 150000 and cond; perto = abs(p20 - 150000) / 150000 < 0.02
            L.append({**b, "criterio_id": "c06", "metrica": "coberta_sb15", "valor": "sim" if cob else "nao", "unidade_medida": "sim/nao", "url": SB15,
                      "data_referencia": HOJE, "confianca": "media" if perto else "alta",
                      "obs": f"lei vigente desde 2025-09-01, texto conferido na data de referência; população base 2020: {p20:,}".replace(",", ".") + ("; a menos de 2% do corte de 150 mil: conferir contagem oficial do censo" if perto else "")
                             + ("; vale só para gleba >= 5 acres, sem plat, zoneada unifamiliar" if cob else "")})
            L.append({**b, "criterio_id": "ctx", "metrica": "crescimento_pop_2020_2025", "valor": round(100 * (p25 / p20 - 1), 1) if p20 else None, "unidade_medida": "%",
                      "url": URLP, "data_referencia": "2025-07-01", "confianca": "alta", "obs": f"Census Population Estimates, cidade inteira: {p20} → {p25}"})
        else:
            L.append({**b, "criterio_id": "c06", "metrica": "coberta_sb15", "valor": "nao" if not g else None, "unidade_medida": "sim/nao", "url": SB15, "data_referencia": HOJE,
                      "confianca": "alta", "obs": "SB 15 só vale dentro de município; fora dele não há zoneamento municipal" if not g else ""})
        m = mor.get(u["cidade"])
        if not g:
            L.append({**b, "criterio_id": "c08", "metrica": "moratoria_ativa", "valor": "nao", "unidade_medida": "sim/nao", "url": "https://statutes.capitol.texas.gov/Docs/LG/htm/LG.212.htm",
                      "data_referencia": HOJE, "confianca": "alta", "obs": "moratória do cap. 212 é instrumento municipal; condado não tem esse poder"})
        elif m:
            L.append({**b, "criterio_id": "c08", "metrica": "moratoria_ativa", "valor": m["moratoria_ativa"], "unidade_medida": "sim/nao", "url": m["url"],
                      "data_referencia": m["data_verificacao"], "confianca": m["confianca"], "obs": m["obs"]})
        else:
            L.append({**b, "criterio_id": "c08", "metrica": "moratoria_ativa", "valor": None, "unidade_medida": "sim/nao", "obs": "não verificado: exige leitura de atas/ordenanças da prefeitura"})
    gravar("leis_tx", L)
if __name__ == "__main__": main()
