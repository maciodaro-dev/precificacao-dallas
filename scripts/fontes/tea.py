"""TEA Accountability Ratings (A–F) por distrito. Critério 21. Planilha multi-ano do TEA."""
import sys, pathlib, re; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from comum import *
import openpyxl
ANO = 2026
URL = "https://tea.texas.gov/school-and-district-leaders/accountability/academic-accountability/performance-reporting/2026-statewide-multi-year-ratings-spreadsheet.xlsx"
# nomes que o TEA abrevia de forma diferente do Census
APELIDOS = {"EAGLEMOUNTAINSAGINAWISD": "EAGLEMTSAGINAWISD"}
def norm(n):
    k = re.sub(r"[^A-Z]", "", n.upper().replace("INDEPENDENT SCHOOL DISTRICT", "ISD").replace("CISD", "ISD").replace("CONSOLIDATED ISD", "ISD"))
    return APELIDOS.get(k, k)
def main():
    wb = openpyxl.load_workbook(baixar(URL, CACHE / "tea" / f"multi{ANO}.xlsx"), read_only=True)
    ws = wb.worksheets[0]; it = ws.iter_rows(values_only=True); cab = [str(c).replace("\n", " ") if c else "" for c in next(it)]
    ir, isc = cab.index(f"{ANO} Overall Rating"), cab.index(f"{ANO} Overall Score")
    ic, idn, ino, ico = cab.index("Campus Number"), cab.index("District Number"), cab.index("District"), cab.index("County")
    D = {}
    for r in it:
        if r[ic] in (None, ""): D.setdefault(norm(r[ino]), []).append((r[idn], r[ino], r[ico], r[ir], r[isc]))
    L = []; falt = set()
    for u in unidades():
        c = D.get(norm(u["isd_nome"]), [])
        if len(c) > 1: c = [x for x in c if x[2] and x[2].upper() in u["condados_pct"].upper()] or c
        base = dict(unidade_id=u["unidade_id"], criterio_id="c21", url=URL, data_referencia=f"{ANO}-08-15")
        if len(c) != 1:
            falt.add(u["isd_nome"]); L += [{**base, "metrica": m, "valor": None, "obs": "distrito não casado por nome na planilha do TEA"} for m in ("nota_isd_score", "nota_isd_letra")]; continue
        num, nome, cond, letra, score = c[0]
        ok = isinstance(score, (int, float))
        L.append({**base, "metrica": "nota_isd_score", "valor": score if ok else None, "unidade_medida": "pontos 0-100", "confianca": "alta",
                  "obs": f"TEA distrito {num} {nome}, rating {ANO}: {letra}"})
        L.append({**base, "metrica": "nota_isd_letra", "valor": letra if letra and len(str(letra)) == 1 else None, "unidade_medida": "A-F", "confianca": "alta", "obs": f"TEA distrito {num}"})
    if falt: print("ISDs sem casamento:", sorted(falt))
    gravar("tea", L)
if __name__ == "__main__": main()
