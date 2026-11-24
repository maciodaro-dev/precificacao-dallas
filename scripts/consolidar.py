"""Junta data/unidades.csv + data/indicadores/*.csv + catálogos em app/public/base.json (lido pela aplicação) e
gera data/pendencias.csv (toda unidade × critério sem valor na métrica principal)."""
import csv, json, glob, datetime, pathlib
from comum import DATA, RAIZ, unidades
FONTES_CIDADE = ("census_acs", "census_bps", "zillow")
FATIA_REPRESENTATIVA = 90   # % da área da cidade a partir do qual o dado da cidade vale para a unidade
FATIA_PEQUENA_PCT, FATIA_PEQUENA_ACRES = 10, 5000   # oculta por padrão: menos de 10% da cidade E menos de 5.000 acres
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
    # Escala do dado. Census (ACS), permits (BPS) e Zillow são publicados para a cidade inteira. Numa unidade que é só uma fatia da cidade
    # (menos de FATIA_REPRESENTATIVA % da área), o valor fica marcado "dado da cidade inteira" e a confiança cai para baixa. Dado calculado por
    # setor censitário (fonte census_tract) é da própria fatia e substitui o da cidade onde existir.
    por_id = {u["unidade_id"]: u for u in us}
    for uid, d in ind.items():
        u = por_id.get(uid)
        if not u or u["tipo"] != "cidade_isd": continue
        fatia = float(u["pct_cidade"] or 100) < FATIA_REPRESENTATIVA
        for k, x in d.items():
            if x["v"] is None: continue
            if x["f"] in FONTES_CIDADE or (x["f"] == "derivado" and fatia and (d.get("c23|renda_mediana") or {}).get("f") in FONTES_CIDADE):
                x["esc"] = "cidade" if fatia else "fatia"
                if fatia: x["conf"] = "baixa"; x["obs"] = (f"dado da cidade inteira; esta unidade é {float(u['pct_cidade']):.0f}% da área de {u['cidade']}. " + x["obs"]).strip()
            elif x["f"] in ("census_tract", "tea", "fema_nfhl", "osrm", "comptroller"): x["esc"] = "fatia"
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
        if u.get("pct_domicilios", "") != "": u["pct_domicilios"] = num(u["pct_domicilios"])
        else: u.pop("pct_domicilios", None)
        # Fatia pequena: oculta por padrão na exibição (premissa P-012). Nunca sai da base.
        u["fatia_pequena"] = bool(u["tipo"] == "cidade_isd" and u["pct_cidade"] is not None and u["pct_cidade"] < FATIA_PEQUENA_PCT and u["acres_terra"] < FATIA_PEQUENA_ACRES)
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
