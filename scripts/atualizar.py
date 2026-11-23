"""Atualiza a base. Uso: python scripts/atualizar.py [fonte ...]   (sem argumentos roda todas, depois consolida)
Fontes: tiger census_acs census_bps tea zillow fema_nfhl osrm leis_tx planilha_usuario"""
import sys, subprocess, pathlib
D = pathlib.Path(__file__).resolve().parent
TODAS = ["tiger", "census_acs", "census_bps", "tea", "zillow", "fema_nfhl", "osrm", "leis_tx", "planilha_usuario"]
for f in (sys.argv[1:] or TODAS):
    print(f"== {f}"); subprocess.run([sys.executable, str(D / "fontes" / f"{f}.py")], check=True)
subprocess.run([sys.executable, str(D / "consolidar.py")], check=True)
