"""Limpeza dos lotes vagos de Dallas County (DCAD 2026 certificado), passo a passo, para aprovação do usuário. Exploratório: não altera a base."""
import zipfile, io, csv, re, collections, random, statistics
D = "cache/dcad/"; z = zipfile.ZipFile(D + "DCAD2026_CURRENT.ZIP"); random.seed(7)
def ler(n):
    with z.open(n) as f: yield from csv.DictReader(io.TextIOWrapper(f, encoding="latin-1"))
DONO = re.compile(r"\b(HOA|H O A|HOMEOWNERS?|HOME OWNERS?|OWNERS? ASS(OC|N)|PROPERTY OWNERS|COMMUNITY ASS(OC|N)|ASSOCIATION|CITY OF|TOWN OF|COUNTY|STATE OF TEXAS|TEXAS DEPT|I\.?S\.?D\.?|SCHOOL DIST|MUNICIPAL UTILITY|M\.?U\.?D\.?\b|UTILITY DIST|WATER DIST|WATER SUPPLY|ONCOR|ATMOS|ELECTRIC|PIPELINE|RAILROAD|CHURCH|BAPTIST|METHODIST|CATHOLIC|DIOCESE|IMPROVEMENT DIST)", re.I)
# "park" e "row" soltos ficaram de fora; só as formas inequívocas definidas pelo usuário
DESC = re.compile(r"(COMMON AREA|\bCA[- ]?\d|\bLOT CA\b|OPEN SPACE|GREEN ?BELT|DRAINAGE|DETENTION|RETENTION|EASEMENT|ESMT|RIGHT[- ]OF[- ]WAY|R\.O\.W\.|\bR O W\b|CITY PARK|POCKET PARK|PARK SITE|PARKLAND|PARK DEDICATION|AMENITY|LANDSCAPE|PRIVATE STREET|ALLEY|\bHOA\b)", re.I)
CONSTR = re.compile(r"\b(HOMES?|HOMEBUILDERS?|BUILDERS?|CONSTRUCTION|DEVELOPMENT|DEVELOPERS?|LENNAR|HORTON|PULTE|CENTEX|KB HOME|MERITAGE|BEAZER|ASHTON WOODS|HIGHLAND|PERRY|TOLL|TAYLOR MORRISON|LGI|BLOOMFIELD|FIRST TEXAS|GEHAN|BRIGHTLAND|DAVID WEEKLEY|M/I|IMPRESSION|HISTORYMAKER|TRENDMAKER|CAMDEN|LAND (LLC|LP|LTD)|LOTS? (LLC|LP|LTD)|RESIDENTIAL)\b", re.I)
vag = {r["ACCOUNT_NUM"]: r for r in ler("ACCOUNT_APPRL_YEAR.CSV") if r["SPTD_CODE"].strip() in ("C11", "C14")}
info = {r["ACCOUNT_NUM"]: r for r in ler("ACCOUNT_INFO.CSV") if r["ACCOUNT_NUM"] in vag}
isen = {r["ACCOUNT_NUM"]: r["TE_REASON"].strip() for r in ler("TOTAL_EXEMPTION.CSV") if r["ACCOUNT_NUM"] in vag}
area, frente = collections.defaultdict(float), {}
for r in ler("LAND.CSV"):
    a = r["ACCOUNT_NUM"]
    if a not in vag: continue
    try: t = float(r["AREA_SIZE"] or 0)
    except ValueError: t = 0
    area[a] += t * 43560 if r["AREA_UOM_DESC"].strip() == "ACRE" else t if r["AREA_UOM_DESC"].strip() == "SQUARE FEET" else 0
    try:
        f = float(r["FRONT_DIM"] or 0)
        if f > 0: frente[a] = max(frente.get(a, 0), f)
    except ValueError: pass
dono = lambda a: (info.get(a, {}).get("OWNER_NAME1", "") + " " + info.get(a, {}).get("OWNER_NAME2", "")).strip()
leg = lambda a: " ".join(info.get(a, {}).get(k, "") for k in ("LEGAL1", "LEGAL2", "LEGAL3")).strip()
lot = lambda a: info.get(a, {}).get("LEGAL1", "").strip()
val = lambda a: float(vag[a]["LAND_VAL"] or 0)
cid = lambda a: vag[a]["CITY_JURIS_DESC"].strip()
linha = lambda a, extra="": f"| {a} | {dono(a)[:34]} | {leg(a)[:48]} | {cid(a)[:16]} | {area[a]:,.0f} | {val(a):,.0f} | {extra} |".replace(",", ".")
CAB = "| Conta | Dono | Descrição do lote | Cidade | Área (sqft) | Valor da terra (US$) | Motivo |\n|---|---|---|---|--:|--:|---|"
out = ["# Limpeza dos lotes vagos de Dallas County — para aprovação", "",
       "Fonte: DCAD, certificado de 2026 com suplementos (arquivos de 2026-11-09). Estudo exploratório: nada foi aplicado à base. Cada lote filtrado ficará marcado com o motivo; nada é apagado.", "",
       f"Ponto de partida: **{sum(1 for a in vag if vag[a]['SPTD_CODE'].strip()=='C11')}** lotes C11 (vago residencial) e **{sum(1 for a in vag if vag[a]['SPTD_CODE'].strip()=='C14')}** lotes C14 (\"terreno vago rural\", menos de 5 acres), tratados juntos nos mesmos passos.", ""]
rest = list(vag); motivo = {}
def passo(nome, f, m):
    global rest
    sai = [a for a in rest if f(a)]; rest = [a for a in rest if not f(a)]
    for a in sai: motivo[a] = nome
    out.extend([f"## {nome}", "", f"Saem **{len(sai)}**; restam **{len(rest)}**.", "", "Amostra de 20 removidos (ao acaso):", "", CAB] + [linha(a, m(a)) for a in random.sample(sai, min(20, len(sai)))] + [""])
    print(nome[:40], "saem", len(sai), "restam", len(rest))
passo("a) Dono: HOA, prefeitura, condado, estado, escola, distrito de água, concessionária, igreja", lambda a: bool(DONO.search(dono(a))), lambda a: DONO.search(dono(a)).group(0))
passo("b) Isenção total de imposto", lambda a: a in isen, lambda a: isen[a])
passo("c) Descrição: área comum, espaço aberto, drenagem, servidão etc.", lambda a: bool(DESC.search(leg(a))), lambda a: DESC.search(leg(a)).group(0))
# ---- d) forma e tamanho: só mostra a distribuição e os cortes; não aplica
com = [a for a in rest if area[a] > 0]; sem = len(rest) - len(com); ar = sorted(area[a] for a in com)
q = lambda p: ar[int(p * (len(ar) - 1))]
out += ["## d) Forma e tamanho — distribuição, antes de aplicar", "", f"Dos {len(rest)} lotes restantes, {len(com)} têm área no cadastro e {sem} não têm (a calcular pelo desenho do lote).", "",
        f"Área dos que têm: mínimo {ar[0]:,.0f} sqft; 5% abaixo de {q(.05):,.0f}; 25% abaixo de {q(.25):,.0f}; mediana {q(.5):,.0f}; 75% abaixo de {q(.75):,.0f}; 95% abaixo de {q(.95):,.0f}; máximo {ar[-1]:,.0f}.".replace(",", "."), "",
        "| Faixa de área | Lotes |", "|---|--:|"]
for lo, hi, n in [(0, 1000, "até 1.000 sqft"), (1000, 2500, "1.000 a 2.500"), (2500, 3000, "2.500 a 3.000"), (3000, 4000, "3.000 a 4.000"), (4000, 5000, "4.000 a 5.000"), (5000, 7500, "5.000 a 7.500"), (7500, 10890, "7.500 sqft a 0,25 acre"), (10890, 21780, "0,25 a 0,5 acre"), (21780, 43560, "0,5 a 1 acre"), (43560, 217800, "1 a 5 acres"), (217800, 871200, "5 a 20 acres"), (871200, 1e12, "mais de 20 acres")]:
    out.append(f"| {n} | {sum(1 for x in ar if lo < x <= hi)} |")
fr = [a for a in com if a in frente]
out += ["", f"Largura (frente do lote): {len(fr)} lotes têm a medida no cadastro; {sum(1 for a in fr if frente[a] < 25)} têm menos de 25 pés.", "", "| Corte | Saem pela área | Saem pela largura menor que 25 pés (e não pela área) | Total que sai | Restam |", "|---|--:|--:|--:|--:|"]
for c in (2500, 3000, 4000):
    pa = {a for a in com if area[a] < c}; pl = {a for a in fr if frente[a] < 25} - pa
    out.append(f"| área menor que {c:,} sqft ou largura menor que 25 pés | {len(pa)} | {len(pl)} | {len(pa | pl)} | {len(rest) - len(pa | pl)} |".replace(",", "."))
    print("corte", c, len(pa), len(pl))
# ---- e) valor: com o corte proposto de 3.000 sqft / 25 pés
fora_d = {a for a in com if area[a] < 3000} | {a for a in fr if frente[a] < 25}; dep = [a for a in rest if a not in fora_d]
barato = [a for a in dep if val(a) <= 1000]
out += ["", "## e) Valor — só para mostrar; nenhum corte aplicado", "", f"Antes do passo d) havia {sum(1 for a in rest if val(a) <= 1000)} lotes com valor de terra de até US$ 1.000. Aplicando o corte proposto no d) (3.000 sqft ou 25 pés), **restam {len(barato)}**.", "",
        "Amostra de 20 deles (ao acaso):", "", CAB] + [linha(a, "valor até US$ 1.000") for a in random.sample(barato, min(20, len(barato)))] + [""]
print("baratos", len(barato))
# ---- construtoras: nome ou concentração (10 ou mais lotes do mesmo dono no mesmo loteamento)
conc = collections.Counter((dono(a), lot(a)) for a in dep)
ehc = lambda a: bool(CONSTR.search(dono(a))) or conc[(dono(a), lot(a))] >= 10
gp = [a for a in dep if cid(a) == "GRAND PRAIRIE"]; gpc = [a for a in gp if ehc(a)]
top = collections.Counter(dono(a) for a in gpc).most_common(12)
out += ["## Estoque de construtora (marcar e contar separado; não remover)", "", "Critério usado: nome do dono com termo de construtora ou loteadora, ou 10 ou mais lotes do mesmo dono no mesmo loteamento.", "",
        f"Em Dallas County, depois do corte do passo d): {sum(1 for a in dep if ehc(a))} de {len(dep)} lotes ficam marcados como de construtora ou loteadora.", "",
        f"**Grand Prairie**: {len(gpc)} de {len(gp)} lotes. Maiores donos:", "", "| Dono | Lotes | Loteamento mais comum |", "|---|--:|---|"]
for d, n in top: out.append(f"| {d[:40]} | {n} | {collections.Counter(lot(a) for a in gpc if dono(a) == d).most_common(1)[0][0][:40]} |")
print("GP", len(gpc), len(gp), top[:4])
# ---- amostra inversa
mant = [a for a in dep if not ehc(a) and val(a) > 1000]
out += ["", "## Amostra inversa: 20 lotes mantidos, ao acaso", "", f"Mantidos depois de a), b), c), do corte proposto no d), fora os de construtora e os de até US$ 1.000: **{len(mant)}**.", "", CAB] + [linha(a, vag[a]["SPTD_CODE"].strip()) for a in random.sample(mant, 20)] + [""]
open("docs/limpeza_lotes_dallas.md", "w").write("\n".join(out) + "\n"); print("mantidos", len(mant))
# ---- glebas acima de 5 acres em Dallas: por código
g = collections.Counter(); gl = collections.defaultdict(float); cod = {}
for r in ler("ACCOUNT_APPRL_YEAR.CSV"):
    if r["SPTD_CODE"].strip() in ("D10", "D20", "C11", "C12", "C14", "E11", "E12"): cod[r["ACCOUNT_NUM"]] = r["SPTD_CODE"].strip()
for r in ler("LAND.CSV"):
    a = r["ACCOUNT_NUM"]
    if a in cod:
        try: t = float(r["AREA_SIZE"] or 0)
        except ValueError: t = 0
        gl[a] += t if r["AREA_UOM_DESC"].strip() == "ACRE" else t / 43560 if r["AREA_UOM_DESC"].strip() == "SQUARE FEET" else 0
for a, ac in gl.items():
    if ac > 20: g[(cod[a], "mais de 20")] += 1
    elif ac > 5: g[(cod[a], "5 a 20")] += 1
print("glebas Dallas:", dict(sorted(g.items())))
