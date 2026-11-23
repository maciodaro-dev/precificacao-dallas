"""Gera um único arquivo HTML com a aplicação e os dados embutidos, para abrir sem servidor ou publicar como pré-visualização.
Uso: cd app && npm run build && python ../scripts/pagina_unica.py saida.html"""
import sys, glob, pathlib
D = pathlib.Path(__file__).resolve().parent.parent / "app" / "dist"
esc = lambda t: t.replace("</", "<\\/")
js = open(glob.glob(str(D / "assets" / "*.js"))[0], encoding="utf-8").read().replace("</script", "<\\/script")
css = open(glob.glob(str(D / "assets" / "*.css"))[0], encoding="utf-8").read()
html = (f"<title>Formação de Preço Dallas</title>\n<style>{css}</style>\n<div id=\"root\"></div>\n"
        f"<script type=\"application/json\" id=\"dados-base\">{esc((D / 'base.json').read_text(encoding='utf-8'))}</script>\n"
        f"<script type=\"application/json\" id=\"dados-geo\">{esc((D / 'unidades.geojson').read_text(encoding='utf-8'))}</script>\n"
        f"<script type=\"module\">{js}</script>\n")
pathlib.Path(sys.argv[1]).write_text(html, encoding="utf-8"); print(len(html) // 1024, "KB")
