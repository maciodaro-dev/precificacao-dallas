"""Imposto total (property tax) por unidade, a partir das planilhas oficiais "Tax Rates and Levies" do Texas Comptroller.
Dado 24. Alíquota total = cidade + distrito escolar (ISD) + condado + distritos especiais que cobrem o condado inteiro
(hospital e faculdade comunitária). Valor em % do valor tributável (a planilha traz dólares por US$ 100, que é o mesmo número).

Regras:
- Cidade e ISD são casados pelo nome dentro dos condados da unidade.
- Unidade em mais de um condado usa a alíquota do condado predominante.
- Um distrito de hospital ou de faculdade conta como "do condado inteiro" quando o valor tributável dele naquele
  condado é 80% ou mais do valor tributável do condado. Os que cobrem só parte do condado ficam de fora e são citados.
- NÃO entram: MUD, PID, WCID, FWSD, MMD, distritos de emergência (ESD) e outros que variam de lote para lote, nem isenções.
  Por isso o indicador de MUD/PID continua sem dado no nível da unidade: é conferido lote a lote na etapa 2."""
import sys, pathlib, re; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from comum import *
import openpyxl
ANO = 2025
BASE = "https://comptroller.texas.gov/taxes/property-tax/docs"
PAG = "https://comptroller.texas.gov/taxes/property-tax/rates/"
COBRE = 0.8

def ler(tipo):
    arq = baixar(f"{BASE}/{ANO}-{tipo}-rates-levies.xlsx", CACHE / "comptroller" / f"{ANO}-{tipo}.xlsx")
    rows = list(openpyxl.load_workbook(arq, read_only=True)["Detail"].iter_rows(values_only=True))
    h = next(i for i, r in enumerate(rows) if r and r[0] == "CAD ID"); cab = [str(c).strip() if c else "" for c in rows[h]]
    return [dict(zip(cab, r)) for r in rows[h + 1:] if r and r[0] not in (None, "")]
def f(x):
    try: return float(x)
    except Exception: return None
def chave_cidade(n): return re.sub(r"[^a-z]", "", str(n).lower().replace("city of", "").replace("town of", "").replace("village of", ""))
APELIDOS = {"EAGLEMOUNTAINSAGINAWISD": "EAGLEMTSAGINAWISD"}
def chave_isd(n):
    k = re.sub(r"[^A-Z]", "", str(n).upper().replace("INDEPENDENT SCHOOL DISTRICT", "ISD").replace("CONSOLIDATED ISD", "ISD").replace("CISD", "ISD").replace("MUNICIPAL SCHOOL DISTRICT", "ISD").replace("MSD", "ISD"))
    return APELIDOS.get(k, k)

def main():
    cond = {}
    for r in ler("county"): cond[str(r["COUNTY NAME"]).strip()] = dict(taxa=f(r["TOTAL COUNTY TAX RATE"]), base=f(r["TAXABLE VALUE FOR GENERAL/ROAD AND BRIDGE FUNDS"]), data=r["VERSION DATE"])
    cid, isd = {}, {}
    for r in ler("city"): cid.setdefault(chave_cidade(r["TAXING UNIT NAME"]), {})[str(r["COUNTY NAME"]).strip()] = f(r["TOTAL TAX RATE"])
    for r in ler("school-district"): isd.setdefault(chave_isd(r["TAXING UNIT NAME"]), {})[str(r["COUNTY NAME"]).strip()] = f(r["TOTAL TAX RATE"])
    esp, parciais = {}, {}
    for r in ler("special-district"):
        tipo = str(r["TAXING UNIT ID"]).split("-")[2]; c = str(r["COUNTY NAME"]).strip()
        if tipo not in ("11", "15") or c not in cond: continue
        nome = re.sub(r"\s*\*+\s*$", "", str(r["TU NAME"]).strip()); taxa = f(r["TOTAL TAX RATE"]); base = f(r["TAXABLE VALUE"])
        if taxa and base and cond[c]["base"] and base / cond[c]["base"] >= COBRE: esp.setdefault(c, []).append((nome, taxa))
        elif taxa: parciais.setdefault(c, []).append(nome)
    versao = next(iter(cond.values()))["data"]; L = []; sem = []
    for u in unidades():
        b = dict(unidade_id=u["unidade_id"], criterio_id="c24", unidade_medida="% do valor", url=PAG, data_referencia=f"{ANO}-12-31")
        c = u["condado"]; meus = [x.rsplit(" ", 1)[0] for x in u["condados_pct"].split("; ")]
        def pega(tab, k):
            d = tab.get(k)
            if not d: return None
            for co in [c] + meus:
                if d.get(co) is not None: return d[co]
            return None
        tc = cond.get(c, {}).get("taxa"); ti = pega(isd, chave_isd(u["isd_nome"]))
        tm = pega(cid, chave_cidade(u["cidade"].split(" (")[0])) if u["place_geoid"] else 0.0
        te = esp.get(c, []); tot_e = sum(t for _, t in te)
        # Cidade que não consta no relatório de cidades do Comptroller: o relatório só lista quem cobra property tax.
        sem_cidade = tm is None
        if sem_cidade: tm = 0.0
        falta = [n for n, v in (("condado", tc), ("distrito escolar", ti)) if v is None]
        if falta:
            sem.append((u["nome"], falta))
            L.append({**b, "metrica": "aliquota_total", "valor": None, "obs": "não encontrado na planilha do Comptroller: " + ", ".join(falta)}); continue
        total = round(tc + ti + tm + tot_e, 4)
        partes = f"cidade {tm:.4f} + ISD {ti:.4f} + condado {c} {tc:.4f}" + "".join(f" + {n} {t:.4f}" for n, t in te)
        avisos = ["não inclui MUD, PID, distritos de água ou de emergência nem isenções"]
        if sem_cidade: avisos.insert(0, "a cidade não consta no relatório de cidades do Comptroller, o que normalmente significa que ela não cobra property tax; alíquota municipal considerada zero, confirmar com o appraisal district")
        if len(meus) > 1: avisos.append(f"unidade em mais de um condado: usada a alíquota de {c}")
        if not u["place_geoid"]: avisos.append("área fora de cidade: costuma haver distrito de emergência (ESD) a somar")
        if parciais.get(c): avisos.append("distritos que cobrem só parte do condado e não foram somados: " + ", ".join(sorted(set(parciais[c]))))
        L.append({**b, "metrica": "aliquota_total", "valor": total, "confianca": "baixa" if sem_cidade else "media" if (len(meus) > 1 or not u["place_geoid"]) else "alta",
                  "obs": f"ano fiscal {ANO}, versão de {versao}: {partes}; " + "; ".join(avisos)})
        for m, v in (("aliquota_cidade", tm), ("aliquota_isd", ti), ("aliquota_condado", tc), ("aliquota_distritos_condado", round(tot_e, 4))):
            L.append({**b, "metrica": m, "valor": round(v, 4), "confianca": "alta", "obs": f"Texas Comptroller, ano fiscal {ANO}"})
    if sem: print("sem alíquota:", len(sem), sem[:12])
    print("distritos do condado inteiro:", {k: [n for n, _ in v] for k, v in esp.items()})
    gravar("comptroller", L)
if __name__ == "__main__": main()
