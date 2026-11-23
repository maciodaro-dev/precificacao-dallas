"""Census ACS 5 anos (arquivos table-based summary file, sem chave de API). Nível: cidade (place).
Critério 23: renda domiciliar mediana (B19013), valor mediano de imóvel ocupado pelo dono (B25077), população (B01003)."""
import sys, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from comum import *
ANO = 2024
BASE = f"https://www2.census.gov/programs-surveys/acs/summary_file/{ANO}/table-based-SF/data/5YRData"
def tabela(t):
    arq = baixar(f"{BASE}/acsdt5y{ANO}-{t}.dat", CACHE / "acs" / f"{ANO}-{t}.dat"); d = {}
    for l in open(arq, encoding="latin-1"):
        p = l.rstrip("\n").split("|")
        if p[0].startswith("1600000US48"): d[p[0][9:]] = p[1:]
    return d
def num(v):
    try: x = float(v)
    except Exception: return None
    return x if x >= 0 else None
def main():
    inc, val, pop = tabela("b19013"), tabela("b25077"), tabela("b01003"); L = []
    ref = f"{ANO-4}-{ANO}"
    for u in unidades():
        g = u["place_geoid"]
        def linha(metrica, tab, t, um, crit="c23"):
            v = num(tab.get(g, [None])[0]) if g else None
            moe = num(tab.get(g, [None, None])[1]) if g and v else None
            teto = v in (250001, 2000001)
            conf = "sem_dado" if v is None else "baixa" if teto else ("alta" if moe is not None and moe / max(v, 1) < 0.1 else "media")
            L.append(dict(unidade_id=u["unidade_id"], criterio_id=crit, metrica=metrica, valor=v, unidade_medida=um,
                          url=f"{BASE}/acsdt5y{ANO}-{t}.dat", data_referencia=f"{ANO}-12-31", confianca=conf,
                          obs=(f"ACS {ref}, cidade inteira; valor no teto de divulgação do ACS: o real é igual ou maior" if teto else
                               f"ACS {ref}, nível cidade inteira; margem de erro ±{moe or 0:.0f}" if v is not None else
                               ("ACS não publica para área não incorporada" if not g else "valor suprimido ou acima do teto no ACS"))))
        linha("renda_mediana", inc, "b19013", "US$/ano"); linha("valor_mediano_imovel_acs", val, "b25077", "US$"); linha("populacao", pop, "b01003", "hab", "ctx")
    gravar("census_acs", L)
if __name__ == "__main__": main()
