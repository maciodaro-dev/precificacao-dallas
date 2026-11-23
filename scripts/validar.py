"""Teste de validação da etapa 1: para as cidades indicadas pelo usuário, relê cada valor direto do arquivo bruto da fonte
(por um caminho de código separado do coletor) e compara com o que está na base. Gera docs/validacao_etapa1.md.
Uso: python scripts/validar.py Frisco Celina Plano Wylie Parker"""
import sys, csv, json, re, urllib.request
from comum import DATA, CACHE, RAIZ, unidades, HOJE
import openpyxl
cidades = sys.argv[1:] or ["Frisco", "Celina", "Plano", "Wylie", "Parker"]
ind = {}
for f in (DATA / "indicadores").glob("*.csv"):
    for r in csv.DictReader(open(f, encoding="utf-8")): ind[(r["unidade_id"], r["criterio_id"], r["metrica"])] = r
def acs(tab, geoid):
    for l in open(CACHE / "acs" / f"2024-{tab}.dat", encoding="latin-1"):
        if l.startswith(f"1600000US{geoid}|"): return l.strip()
def bps(geoid):
    for l in open(CACHE / "bps" / "so2025a.txt", encoding="latin-1"):
        p = l.split(",")
        if len(p) > 18 and p[1].strip() == "48" and p[5].strip() == geoid[2:]: return p[16].strip(), p[18].strip(), l.strip()[:90]
def zillow(cidade, condados):
    c = [r for r in csv.reader(open(CACHE / "zillow" / "city_zhvi.csv", encoding="utf-8")) if r[2].lower() == cidade.lower() and r[5] == "TX"]
    if len(c) > 1: c = [r for r in c if r[7].replace(" County", "") in condados]
    return (c[0][-61], c[0][-1], c[0][7]) if len(c) == 1 else None
wb = openpyxl.load_workbook(CACHE / "tea" / "multi2026.xlsx", read_only=True); TEA = {}
for r in wb.worksheets[0].iter_rows(min_row=2, values_only=True):
    if not r[2]: TEA[(re.sub(r"[^A-Z]", "", str(r[1])), str(r[5]).upper())] = r
polos = json.load(open(DATA / "manual" / "polos_emprego.json", encoding="utf-8"))
def rota(u):
    d = polos[0]; url = f"https://router.project-osrm.org/route/v1/driving/{u['lon']},{u['lat']};{d['lon']},{d['lat']}?overview=false"
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "precificacao-dallas/1.0"}), timeout=60) as r: return round(json.load(r)["routes"][0]["duration"] / 60, 1)
    except Exception as e: return f"falhou: {e}"
L = [f"# Validação da etapa 1 — {', '.join(cidades)}", "", f"Gerado em {HOJE} por `scripts/validar.py`.", "",
     "Cada linha compara o valor gravado na base com o valor relido direto do arquivo bruto da fonte, por um caminho de código separado do coletor. "
     "Isso prova que a base reproduz a fonte; não prova que a fonte está certa — essa parte é a sua conferência, com o que você conhece dessas cidades.", "",
     "| Unidade | Dado | Na base | Na fonte (releitura) | Confere? | Trecho bruto / como conferir |", "|---|---|---:|---:|:-:|---|"]
div = []; n = 0
def cmp(u, nome, k, fonte, bruto):
    global n
    b = ind.get((u["unidade_id"],) + k, {}).get("valor", "")
    def eq(a, c):
        try: return abs(float(a) - float(c)) <= max(0.051, 0.0005 * abs(float(c)))
        except Exception: return str(a) == str(c)
    ok = eq(b, fonte); n += 1
    if not ok: div.append((u["nome"], nome, b, fonte))
    L.append(f"| {u['nome']} | {nome} | {b or 'sem dado'} | {fonte} | {'sim' if ok else '**NÃO**'} | {bruto} |")
for u in unidades():
    if u["cidade"] not in cidades: continue
    g = u["place_geoid"]
    for tab, m, nome in (("b19013", "renda_mediana", "Renda mediana (ACS)"), ("b25077", "valor_mediano_imovel_acs", "Valor mediano do imóvel (ACS)")):
        l = acs(tab, g); cmp(u, nome, ("c23", m), float(l.split("|")[1]) if l else "", f"`{l}`")
    l = acs("b01003", g); cmp(u, "População (ACS)", ("ctx", "populacao"), float(l.split("|")[1]), f"`{l}`")
    b = bps(g); cmp(u, "Permits unifamiliares 2025 (BPS)", ("c15", "permits_unifamiliares_ano"), b[1] if b else "", f"`{b[2]}…` coluna 1-unit Units" if b else "não consta")
    z = zillow(u["cidade"], u["condados_pct"])
    cmp(u, "Valor típico da casa (ZHVI)", ("c16", "valor_tipico_casa"), round(float(z[1])) if z else "", f"última coluna do CSV, linha {u['cidade']} / {z[2]}" if z else "não consta")
    cmp(u, "Valorização 5 anos (ZHVI)", ("c18", "valorizacao_5a"), round(100 * (float(z[1]) / float(z[0]) - 1), 1) if z else "", f"{float(z[0]):.0f} → {float(z[1]):.0f}" if z else "")
    t = next((v for (nm, co), v in TEA.items() if nm == re.sub(r"[^A-Z]", "", u["isd_nome"].upper()) and co in u["condados_pct"].upper() + " COLLIN DENTON DALLAS ROCKWALL KAUFMAN ELLIS TARRANT HUNT"), None)
    cab = [str(c).replace("\n", " ") for c in next(wb.worksheets[0].iter_rows(max_row=1, values_only=True))]
    cmp(u, "Nota do ISD 2026 (TEA)", ("c21", "nota_isd_score"), t[cab.index("2026 Overall Score")] if t else "", f"{t[0]} {t[1]}: {t[cab.index('2026 Overall Rating')]} {t[cab.index('2026 Overall Score')]}" if t else "")
    cmp(u, "Minutos até Downtown Dallas (OSRM)", ("c19", "min_downtown_dallas"), rota(u), "nova consulta pelo endpoint /route (o coletor usa /table)")
    f = ind.get((u["unidade_id"], "c25", "pct_area_sfha"), {}).get("valor", "")
    L.append(f"| {u['nome']} | % da área em zona de alagamento (FEMA) | {f} | — | sem 2ª via | calculado por interseção de polígonos; conferir no visualizador msc.fema.gov |")
    s = ind.get((u["unidade_id"], "c06", "coberta_sb15"), {})
    L.append(f"| {u['nome']} | Coberta pela SB 15 | {s.get('valor')} | — | regra | {s.get('obs')} |")
L += ["", f"## Resultado", "", f"{n} comparações, **{len(div)} divergências**.", ""]
L += [f"- {a} · {b}: base {c} × fonte {d}" for a, b, c, d in div] or ["Nenhum valor da base difere do arquivo bruto da fonte."]
L += ["", "## O que este teste não cobre", "",
      "- Dados de nível cidade (ACS, BPS, ZHVI) são repetidos em todas as unidades da mesma cidade; a fatia de cada ISD pode ser bem diferente da média da cidade.",
      "- Alagamento (FEMA) não tem segunda via automática.", "- 19 dos 26 critérios não têm dado nessas cidades (veja `data/pendencias.csv`)."]
(RAIZ / "docs").mkdir(exist_ok=True); (RAIZ / "docs" / "validacao_etapa1.md").write_text("\n".join(L), encoding="utf-8")
print(f"{n} comparações, {len(div)} divergências"); [print(" ", d) for d in div]
