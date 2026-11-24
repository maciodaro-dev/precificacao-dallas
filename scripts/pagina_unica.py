"""Gera um único arquivo HTML com a aplicação e os dados embutidos, para abrir sem servidor ou publicar como pré-visualização.
Uso: cd app && npm run build && python ../scripts/pagina_unica.py saida.html"""
import sys, glob, pathlib, base64
D = pathlib.Path(__file__).resolve().parent.parent / "app" / "dist"
esc = lambda t: t.replace("</", "<\\/")
js = open(glob.glob(str(D / "assets" / "*.js"))[0], encoding="utf-8").read().replace("</script", "<\\/script")
css = open(glob.glob(str(D / "assets" / "*.css"))[0], encoding="utf-8").read()
# o arquivo único não tem pasta ao lado: o símbolo da marca vai embutido, se existir
marca = D / "marca" / "mark.png"
if marca.exists(): js = js.replace("./marca/mark.png", "data:image/png;base64," + base64.b64encode(marca.read_bytes()).decode())
FONTES = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Hanken+Grotesk:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&family=Caveat:wght@400;700&display=swap">' 
html = (f"<title>CSD Tools — Formação de preço</title>\n{FONTES}\n<style>{css}</style>\n<div id=\"root\"></div>\n"
        f"<script type=\"application/json\" id=\"dados-base\">{esc((D / 'base.json').read_text(encoding='utf-8'))}</script>\n"
        f"<script type=\"application/json\" id=\"dados-geo\">{esc((D / 'unidades.geojson').read_text(encoding='utf-8'))}</script>\n"
        f"<script type=\"module\">{js}</script>\n")
pathlib.Path(sys.argv[1]).write_text(html, encoding="utf-8"); print(len(html) // 1024, "KB")
