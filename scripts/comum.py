"""Funções comuns aos scripts de coleta. Cada fonte grava apenas o seu arquivo em data/indicadores/."""
import csv, datetime, pathlib, urllib.request, os
RAIZ = pathlib.Path(__file__).resolve().parent.parent
DATA = RAIZ / "data"
CACHE = RAIZ / "cache"
HOJE = datetime.date.today().isoformat()
CAMPOS = ["unidade_id", "criterio_id", "metrica", "faixa_id", "valor", "unidade_medida",
          "fonte_id", "url", "data_referencia", "data_coleta", "confianca", "obs"]

def baixar(url, destino, forcar=False):
    destino = pathlib.Path(destino); destino.parent.mkdir(parents=True, exist_ok=True)
    if destino.exists() and destino.stat().st_size > 0 and not forcar:
        return destino
    req = urllib.request.Request(url, headers={"User-Agent": "precificacao-dallas/1.0 (coleta de dados publicos)"})
    with urllib.request.urlopen(req, timeout=300) as r, open(destino, "wb") as f:
        while True:
            b = r.read(1 << 20)
            if not b: break
            f.write(b)
    return destino

def unidades():
    with open(DATA / "unidades.csv", newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))

def gravar(fonte_id, linhas):
    """linhas: lista de dicts com as chaves de CAMPOS (faltantes ficam vazias). valor None = sem dado."""
    arq = DATA / "indicadores" / f"{fonte_id}.csv"
    with open(arq, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=CAMPOS); w.writeheader()
        for l in linhas:
            l = {**{c: "" for c in CAMPOS}, **l}
            l["fonte_id"] = fonte_id; l["data_coleta"] = l["data_coleta"] or HOJE
            if l["valor"] is None or l["valor"] == "":
                l["valor"] = ""; l["confianca"] = "sem_dado"
            w.writerow(l)
    print(f"{fonte_id}: {len(linhas)} linhas, {sum(1 for l in linhas if l.get('valor') not in (None, ''))} com valor -> {arq.name}")
