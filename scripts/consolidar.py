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
CONF = ["sem_dado", "baixa", "media", "alta"]
FONTES_PARTE = ("tea", "comptroller", "fema_nfhl", "osrm", "census_tract")   # fontes cujo valor muda de uma parte para outra da mesma cidade
PESO_DOMICILIOS = ("c24|", "c23|")   # imposto e renda: média ponderada pelos domicílios; o resto, pela área
def regiao_id(u): return f"R-{u['place_geoid']}" if u["tipo"] == "cidade_isd" else f"R-ETJ-{u['condado_fips']}"
def regioes(us, ind):
    """Agrupa as partes (cidade × ISD, ou condado × ISD fora de cidade) em regiões: a cidade inteira, ou a área fora de cidade do condado.
    A linha do ranking é a região. O ISD só separa a região na pergunta da escola (premissa P-015).
    Devolve (regiões, indicadores por região e por parte, partes). Indicador de parte só é guardado quando difere do da região."""
    grupos = {}
    for u in us: grupos.setdefault(regiao_id(u), []).append(u)
    R, I, P = [], {}, []
    for rid, ps in grupos.items():
        dom = {p["unidade_id"]: ((ind.get(p["unidade_id"], {}).get("ctx|domicilios") or {}).get("v") or 0) for p in ps}
        ac = {p["unidade_id"]: float(p["acres_terra"] or 0) for p in ps}; tdom, tac = sum(dom.values()), sum(ac.values())
        ps.sort(key=lambda p: (-(dom[p["unidade_id"]] if tdom else ac[p["unidade_id"]]), p["nome"])); m = ps[0]; cid = m["tipo"] == "cidade_isd"
        info = []
        for p in ps:
            pa = round(100 * ac[p["unidade_id"]] / tac, 1) if tac else None; pdm = round(100 * dom[p["unidade_id"]] / tdom, 1) if tdom else None
            peq = bool(len(ps) > 1 and pa is not None and pa < FATIA_PEQUENA_PCT and ac[p["unidade_id"]] < FATIA_PEQUENA_ACRES)
            info.append(dict(parte_id=p["unidade_id"], isd_id=p["isd_id"], isd_nome=p["isd_nome"], acres=ac[p["unidade_id"]], pct_area=pa, pct_domicilios=pdm, pequena=peq))
            P.append({**p, "regiao_id": rid})
        r = dict(unidade_id=rid, nome=m["cidade"] if cid else f"Fora de cidade · condado de {m['condado']}", tipo=m["tipo"], cidade=m["cidade"], place_geoid=m["place_geoid"], isd_id=m["isd_id"],
                 isd_nome=m["isd_nome"] if len(ps) == 1 else f"{m['isd_nome']} e mais {len(ps) - 1}", condado=m["condado"], condado_fips=m["condado_fips"], condados_pct=m["condados_pct"], lado=m["lado"],
                 acres_terra=round(tac, 1), pct_cidade=100 if cid else "", lat=round(sum(float(p["lat"]) * ac[p["unidade_id"]] for p in ps) / tac, 5) if tac else m["lat"],
                 lon=round(sum(float(p["lon"]) * ac[p["unidade_id"]] for p in ps) / tac, 5) if tac else m["lon"], fonte=m["fonte"], partes=info)
        R.append(r); d = I[rid] = {}
        chaves = []
        for p in ps:
            for k in ind.get(p["unidade_id"], {}):
                if k not in chaves: chaves.append(k)
        for k in chaves:
            if k in ("ctx|pct_domicilios_cidade",): continue
            xs = [(p, ind[p["unidade_id"]][k]) for p in ps if k in ind.get(p["unidade_id"], {})]; com = [(p, x) for p, x in xs if x["v"] is not None]
            if k == "ctx|domicilios": d[k] = {**xs[0][1], "v": round(tdom), "obs": "soma das partes"}; continue
            if not com: d[k] = dict(xs[0][1]); continue
            # renda por setor censitário é da parte; a região usa a renda da cidade (ACS). Fora de cidade não há ACS: média das partes.
            da_cidade = next((x.get("_cid") or (x if x["f"] in FONTES_CIDADE else None) for _, x in com if x.get("_cid") or x["f"] in FONTES_CIDADE), None)
            if da_cidade and cid: d[k] = dict(da_cidade); continue
            vals = [x["v"] for _, x in com]; base_x = next((x for p, x in com if p is m), com[0][1])
            if len(set(map(str, vals))) == 1 and len(com) == len(ps): d[k] = dict(base_x); continue
            if all(isinstance(v, (int, float)) for v in vals):
                w = [(dom[p["unidade_id"]] if (k.startswith(PESO_DOMICILIOS) and tdom) else ac[p["unidade_id"]]) or 1e-9 for p, _ in com]
                v = sum(a * b for a, b in zip(vals, w)) / sum(w)
                d[k] = {**base_x, "v": round(v, 4 if abs(v) < 10 else 1), "conf": min((x["conf"] for _, x in com), key=CONF.index) if k != "c23|renda_mediana" else "baixa",
                        "obs": (f"média das {len(com)} partes da região, ponderada {'pelos domicílios' if k.startswith(PESO_DOMICILIOS) and tdom else 'pela área'}; varia de {min(vals):g} a {max(vals):g} entre os ISDs"
                                + (f"; {len(ps) - len(com)} parte(s) sem dado" if len(com) < len(ps) else ""))}
            else:   # texto (nota do ISD, polo mais próximo...): vale a parte principal; a observação lista as demais
                d[k] = {**base_x, "obs": ("parte principal da região (" + m["isd_nome"] + "). Por parte: " + "; ".join(f"{p['isd_nome']}: {x['v']}" for p, x in com) + ". " + base_x["obs"]).strip()}
        a, b = d.get("c16|valor_tipico_casa"), d.get("c23|renda_mediana")
        if a and b and a["v"] and b["v"]: d["c23|preco_renda"] = {**d.get("c23|preco_renda", {}), "v": round(a["v"] / b["v"], 2), "um": "x renda anual", "f": "derivado", "url": "", "ref": min(a["ref"], b["ref"]), "col": a["col"], "conf": "media",
                                                                 "obs": "derivado: ZHVI (Zillow) ÷ renda domiciliar mediana"}
        # indicadores de cada parte: só o que difere da região
        if len(ps) > 1:
            for p in ps:
                dp = {k: x for k, x in ind.get(p["unidade_id"], {}).items() if x["v"] is not None and (k not in d or str(d[k]["v"]) != str(x["v"])) and (x["f"] in FONTES_PARTE or x["f"] == "derivado") and k != "ctx|domicilios"}
                if dp: I[p["unidade_id"]] = {k: {kk: vv for kk, vv in x.items() if kk != "_cid"} for k, x in dp.items()}
    for d in I.values():
        for x in d.values(): x.pop("_cid", None)
    R.sort(key=lambda r: (r["tipo"] != "cidade_isd", r["nome"]))
    return R, I, P
def main():
    us = unidades(); crit = json.load(open(DATA / "criterios.json", encoding="utf-8"))
    ind = {}
    for arq in sorted(glob.glob(str(DATA / "indicadores" / "*.csv"))):
        for r in csv.DictReader(open(arq, encoding="utf-8")):
            k = r["criterio_id"] + "|" + r["metrica"] + ("|" + r["faixa_id"] if r["faixa_id"] else "")
            novo = dict(v=num(r["valor"]) if r["valor"] != "" else None, um=r["unidade_medida"], f=r["fonte_id"], url=r["url"],
                        ref=r["data_referencia"], col=r["data_coleta"], conf=r["confianca"] or "sem_dado", obs=r["obs"])
            ant = ind.setdefault(r["unidade_id"], {}).get(k)
            # o dado da parte (setor censitário) não apaga o da cidade inteira: a região usa o da cidade, a parte usa o seu
            if r["fonte_id"] == "census_tract" and ant and ant["v"] is not None: novo["_cid"] = ant
            ind[r["unidade_id"]][k] = novo
    # derivado: preço/renda = valor típico (Zillow) / renda mediana (ACS)
    for uid, d in ind.items():
        a, b = d.get("c16|valor_tipico_casa"), d.get("c23|renda_mediana")
        if a and b and a["v"] and b["v"]:
            d["c23|preco_renda"] = dict(v=round(a["v"] / b["v"], 2), um="x renda anual", f="derivado", url="", ref=min(a["ref"], b["ref"]), col=a["col"], conf="media",
                                        obs="derivado: ZHVI (Zillow) ÷ renda domiciliar mediana (ACS)")
    us, ind, partes = regioes(us, ind)
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
    for u in partes:
        for k in ("acres_terra", "pct_cidade", "lat", "lon"): u[k] = num(u[k]) if u[k] != "" else None
    base = dict(gerado_em=datetime.date.today().isoformat(), unidades=us, partes=partes, criterios=crit, indicadores=ind,
                faixas=json.load(open(DATA / "faixas.json", encoding="utf-8")),
                fontes=json.load(open(DATA / "fontes.json", encoding="utf-8")), premissas=list(csv.DictReader(open(DATA / "premissas.csv", encoding="utf-8"))))
    pub = RAIZ / "app" / "public"; pub.mkdir(parents=True, exist_ok=True)
    json.dump(base, open(pub / "base.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    # o mapa continua desenhando cada parte (cidade × ISD); cada parte aponta para a sua região
    geo = json.load(open(DATA / "unidades.geojson", encoding="utf-8")); reg = {p["unidade_id"]: p["regiao_id"] for p in partes}; nome = {u["unidade_id"]: u["nome"] for u in us}
    for f in geo["features"]:
        pr = f["properties"]; pr["parte_id"] = pr["unidade_id"]; pr["parte_nome"] = pr["nome"]; pr["unidade_id"] = reg[pr["parte_id"]]; pr["nome"] = nome[pr["unidade_id"]]
    json.dump(geo, open(pub / "unidades.geojson", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    tot = len(us) * len(crit); com = sum(1 for u in us for c in crit if (ind.get(u["unidade_id"], {}).get(f"{c['id']}|{c['metrica']}") or {}).get("v") is not None)
    print(f"base.json: {len(us)} unidades, {len(crit)} critérios; cobertura da métrica principal {com}/{tot} ({100*com/tot:.0f}%); pendências: {len(pend)}")
    for c in crit:
        n = sum(1 for u in us if (ind.get(u["unidade_id"], {}).get(f"{c['id']}|{c['metrica']}") or {}).get("v") is not None)
        if n: print(f"  {c['id']} {c['nome']}: {n}/{len(us)}")
if __name__ == "__main__": main()
