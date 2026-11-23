"""Zillow Research – ZHVI por cidade (valor típico, casas unifamiliares + condos, terço médio, suavizado).
Critério 18: valorização em 5 anos. Critério 16: valor típico atual (preço de referência da casa). Nível: cidade inteira."""
import sys, pathlib, csv; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from comum import *
URL = "https://files.zillowstatic.com/research/public_csvs/zhvi/City_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv"
def main():
    arq = baixar(URL, CACHE / "zillow" / "city_zhvi.csv", forcar=False); Z = {}
    with open(arq, newline="", encoding="utf-8") as f:
        rd = csv.reader(f); cab = next(rd); datas = [c for c in cab if c[:2] == "20" or c[:2] == "19"]; i0 = cab.index(datas[0])
        iN, iS, iC = cab.index("RegionName"), cab.index("State"), cab.index("CountyName")
        for r in rd:
            if r[iS] == "TX": Z.setdefault(r[iN].lower(), []).append((r[iC], r[i0:]))
    ult = datas[-1]; L = []
    for u in unidades():
        base = dict(unidade_id=u["unidade_id"], url=URL, data_referencia=ult)
        c = Z.get(u["cidade"].lower().replace("st. paul", "st. paul"), []) if u["place_geoid"] else []
        if len(c) > 1: c = [x for x in c if x[0].replace(" County", "") in u["condados_pct"]]
        def v(k):
            try: return float(c[0][1][k])
            except Exception: return None
        atual, ant = (v(-1), v(-61)) if len(c) == 1 else (None, None)
        motivo = "Zillow não publica ZHVI para esta cidade" if u["place_geoid"] else "ZHVI por cidade não cobre área não incorporada"
        L.append({**base, "criterio_id": "c16", "metrica": "valor_tipico_casa", "valor": round(atual) if atual else None, "unidade_medida": "US$",
                  "confianca": "media", "obs": "ZHVI: casas existentes + novas, cidade inteira; não é preço de casa nova" if atual else motivo})
        L.append({**base, "criterio_id": "c18", "metrica": "valorizacao_5a", "valor": round(100 * (atual / ant - 1), 1) if atual and ant else None, "unidade_medida": "%",
                  "confianca": "alta", "obs": f"ZHVI {datas[-61]} → {ult}, cidade inteira" if atual and ant else motivo})
    gravar("zillow", L)
if __name__ == "__main__": main()
