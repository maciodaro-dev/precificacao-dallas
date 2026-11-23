"""Tempo de carro até polos de emprego, por roteamento OSRM sobre OpenStreetMap (servidor público de demonstração).
Critério 19. Sem trânsito: tempos de fluxo livre, subestimam o horário de pico. Polos = premissa P-001."""
import sys, pathlib, json, urllib.request, time; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from comum import *
POLOS = json.load(open(DATA / "manual" / "polos_emprego.json", encoding="utf-8"))
def main():
    us = unidades(); L = []
    dest = ";".join(f"{p['lon']},{p['lat']}" for p in POLOS); nd = len(POLOS)
    for k in range(0, len(us), 40):
        lote = us[k:k + 40]; src = ";".join(f"{u['lon']},{u['lat']}" for u in lote)
        url = (f"https://router.project-osrm.org/table/v1/driving/{src};{dest}?sources={';'.join(map(str, range(len(lote))))}"
               f"&destinations={';'.join(str(len(lote) + i) for i in range(nd))}")
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "precificacao-dallas/1.0"}), timeout=120) as r: d = json.load(r)
        for u, linha in zip(lote, d["durations"]):
            mins = [round(s / 60, 1) if s is not None else None for s in linha]; ok = [m for m in mins if m is not None]
            base = dict(unidade_id=u["unidade_id"], criterio_id="c19", unidade_medida="min", url="https://router.project-osrm.org", data_referencia=HOJE, confianca="media")
            det = "; ".join(f"{p['nome']} {m}" for p, m in zip(POLOS, mins))
            L.append({**base, "metrica": "min_polo_mais_proximo", "valor": min(ok) if ok else None, "obs": f"fluxo livre, a partir de um ponto interno da unidade. {det}"})
            for p, m in zip(POLOS, mins):
                L.append({**base, "metrica": f"min_{p['id']}", "valor": m, "obs": f"fluxo livre até {p['nome']}"})
        time.sleep(2)
    gravar("osrm", L)
if __name__ == "__main__": main()
