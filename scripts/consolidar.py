"""Junta data/unidades.csv + data/indicadores/*.csv + catálogos em app/public/base.json (lido pela aplicação) e
gera data/pendencias.csv (toda unidade × critério sem valor na métrica principal)."""
import csv, json, glob, datetime, pathlib
from comum import DATA, RAIZ, unidades
def num(v):
    try: return float(v)
    except Exception: return v
def main():
    us = unidades(); crit = json.load(open(DATA / "criterios.json", encoding="utf-8"))
    ind = {}
    for arq in sorted(glob.glob(str(DATA / "indicadores" / "*.csv"))):
        for r in csv.DictReader(open(arq, encoding="utf-8")):
            k = r["criterio_id"] + "|" + r["metrica"] + ("|" + r["faixa_id"] if r["faixa_id"] else "")
            ind.setdefault(r["unidade_id"], {})[k] = dict(v=num(r["valor"]) if r["valor"] != "" else None, um=r["unidade_medida"], f=r["fonte_id"], url=r["url"],
                                                         ref=r["data_referencia"], col=r["data_coleta"], conf=r["confianca"] or "sem_dado", obs=r["obs"])
    # derivado: preço/renda = valor típico (Zillow) / renda mediana (ACS)
    for uid, d in ind.items():
        a, b = d.get("c16|valor_tipico_casa"), d.get("c23|renda_mediana")
        if a and b and a["v"] and b["v"]:
            d["c23|preco_renda"] = dict(v=round(a["v"] / b["v"], 2), um="x renda anual", f="derivado", url="", ref=min(a["ref"], b["ref"]), col=a["col"], conf="media",
                                        obs="derivado: ZHVI (Zillow) ÷ renda domiciliar mediana (ACS)")
    pend = []
    motivo = {"adiado": "anúncios de terrenos: coleta adiada por decisão do usuário", "manual": "exige leitura manual de documento municipal",
              "bloqueado": "fonte recusou acesso automático; baixar manualmente", "pendente": "coletor ainda não escrito / fonte exige chave ou formulário",
              "premissa": "sem fonte pública: informar premissa", "derivado": "depende de critérios ainda sem dado", "coletado": "fonte não publica para esta unidade"}
    for u in us:
        for c in crit:
            ks = [f"{c['id']}|{c['metrica']}"] if not c.get("por_faixa") else [f"{c['id']}|{c['metrica']}|F{i}" for i in range(1, 5)]
            for k in ks:
                x = ind.get(u["unidade_id"], {}).get(k)
                if not x or x["v"] is None:
                    pend.append(dict(unidade_id=u["unidade_id"], unidade=u["nome"], criterio_id=c["id"], criterio=c["nome"], metrica=k.split("|", 1)[1], unidade_medida=c["unidade_medida"],
                                     motivo=(x or {}).get("obs") or motivo[c["cobertura"]], fonte_planejada=c["fonte_planejada"], valor="", fonte_informada="", data=""))
    with open(DATA / "pendencias.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(pend[0])); w.writeheader(); w.writerows(pend)
    for u in us:
        for k in ("acres_terra", "pct_cidade", "lat", "lon"): u[k] = num(u[k]) if u[k] != "" else None
    base = dict(gerado_em=datetime.date.today().isoformat(), unidades=us, criterios=crit, indicadores=ind,
                faixas=json.load(open(DATA / "faixas.json", encoding="utf-8")),
                fontes=json.load(open(DATA / "fontes.json", encoding="utf-8")), premissas=list(csv.DictReader(open(DATA / "premissas.csv", encoding="utf-8"))))
    pub = RAIZ / "app" / "public"; pub.mkdir(parents=True, exist_ok=True)
    json.dump(base, open(pub / "base.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    (pub / "unidades.geojson").write_bytes((DATA / "unidades.geojson").read_bytes())
    tot = len(us) * len(crit); com = sum(1 for u in us for c in crit if (ind.get(u["unidade_id"], {}).get(f"{c['id']}|{c['metrica']}") or {}).get("v") is not None)
    print(f"base.json: {len(us)} unidades, {len(crit)} critérios; cobertura da métrica principal {com}/{tot} ({100*com/tot:.0f}%); pendências: {len(pend)}")
    for c in crit:
        n = sum(1 for u in us if (ind.get(u["unidade_id"], {}).get(f"{c['id']}|{c['metrica']}") or {}).get("v") is not None)
        if n: print(f"  {c['id']} {c['nome']}: {n}/{len(us)}")
if __name__ == "__main__": main()
