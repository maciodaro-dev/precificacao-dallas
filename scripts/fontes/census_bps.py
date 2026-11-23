"""Census Building Permits Survey, arquivo anual por jurisdição emissora (place). Critério 15 (proxy de absorção de casas novas):
unidades unifamiliares licenciadas no ano e valor médio declarado por unidade. Nível: cidade inteira."""
import sys, pathlib, csv; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from comum import *
ANOS = [2025, 2024, 2023]
def ler(ano):
    url = f"https://www2.census.gov/econ/bps/Place/South%20Region/so{ano}a.txt"
    arq = baixar(url, CACHE / "bps" / f"so{ano}a.txt"); d = {}
    for r in csv.reader(open(arq, encoding="latin-1")):
        if len(r) > 20 and r[1].strip() == "48" and r[5].strip().isdigit():
            d["48" + r[5].strip().zfill(5)] = dict(meses=r[15].strip(), bld=int(r[17]), un=int(r[18]), val=int(r[19]))
    return url, d
def main():
    dados = {a: ler(a) for a in ANOS}; L = []
    for u in unidades():
        g = u["place_geoid"]
        for a in ANOS:
            url, d = dados[a]; r = d.get(g) if g else None
            base = dict(unidade_id=u["unidade_id"], criterio_id="c15", url=url, data_referencia=f"{a}-12-31")
            mt = "permits_unifamiliares_ano" if a == ANOS[0] else f"permits_unifamiliares_{a}"
            if not r:
                L.append({**base, "metrica": mt, "valor": None, "unidade_medida": "unidades/ano",
                          "obs": "condado emite os permits; BPS não separa por ISD" if not g else "jurisdição não consta no BPS deste ano"}); continue
            conf = "alta" if r["meses"] == "12" else "media"
            L.append({**base, "metrica": mt, "valor": r["un"], "unidade_medida": "unidades/ano", "confianca": conf,
                      "obs": f"cidade inteira; {r['meses']} meses reportados; proxy de absorção (permits, não vendas)"})
            if a == ANOS[0] and r["un"] > 0:
                L.append({**base, "metrica": "valor_declarado_por_unidade", "valor": round(r["val"] / r["un"]), "unidade_medida": "US$/unidade",
                          "confianca": "media", "obs": "valor de construção declarado no permit (sem terreno); costuma subestimar o custo real"})
    gravar("census_bps", L)
if __name__ == "__main__": main()
