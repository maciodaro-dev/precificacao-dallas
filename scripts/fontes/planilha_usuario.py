"""Valores da planilha "Calculadora de Custos de Casa DFW" montada pelo usuário (data/manual/planilha_usuario.csv).
São aproximações do usuário, não dado de fonte pública: entram com confiança baixa e estão no registro de premissas (P-006).
Importa: taxa combinada de property tax (c24), segurança e mobilidade em texto (não entram na nota) e idade das casas (contexto).
A coluna de composição étnica da planilha não é importada: a ferramenta não usa esse tipo de critério."""
import sys, pathlib, csv, re; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from comum import *
DATA_PLANILHA = "2026-11-23"
def main():
    mapa = {}
    for r in csv.DictReader(open(DATA / "manual" / "planilha_usuario.csv", encoding="utf-8")):
        nomes = re.sub(r"^[^:]*:\s*", "", r["cidade_planilha"]).split("/")
        for n in nomes: mapa[n.strip().lower()] = r
    L = []; achou = set()
    for u in unidades():
        r = mapa.get(u["cidade"].lower())
        if not r: continue
        achou.add(u["cidade"]); b = dict(unidade_id=u["unidade_id"], data_referencia=DATA_PLANILHA, confianca="baixa", url="")
        orig = f"planilha do usuário, linha \"{r['cidade_planilha']}\""
        L.append({**b, "criterio_id": "c24", "metrica": "aliquota_total", "valor": round(float(r["taxa_combinada"]) * 100, 2), "unidade_medida": "% do valor",
                  "obs": f"valor aproximado informado pelo usuário para a cidade inteira (não separa ISD nem MUD/PID); {orig}. Substituir pela alíquota oficial."})
        L.append({**b, "criterio_id": "c22", "metrica": "seguranca_texto", "valor": r["seguranca"], "unidade_medida": "texto", "obs": f"avaliação qualitativa do usuário; não entra na nota; {orig}"})
        L.append({**b, "criterio_id": "c19", "metrica": "mobilidade_texto", "valor": r["mobilidade"], "unidade_medida": "texto", "obs": f"anotação do usuário; não entra na nota; {orig}"})
        L.append({**b, "criterio_id": "ctx", "metrica": "idade_casas", "valor": r["idade_casas"], "unidade_medida": "texto", "obs": f"anotação do usuário; {orig}"})
    print("cidades da planilha usadas:", len(achou), "| fora da área de estudo:", sorted(k for k in mapa if k not in {a.lower() for a in achou}))
    gravar("planilha_usuario", L)
if __name__ == "__main__": main()
