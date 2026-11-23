"""FEMA National Flood Hazard Layer (camada 28, Flood Hazard Zones). Risco c25: % da área de terra da unidade em
Special Flood Hazard Area (SFHA_TF = 'T', zonas A/AE/AO/AH/VE: cheia de 1% ao ano)."""
import sys, pathlib, json, time, urllib.parse, urllib.request, warnings; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from comum import *
import geopandas as gpd, pandas as pd
warnings.filterwarnings("ignore")
SVC = "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query"
def pagina(bbox, off):
    q = dict(where="SFHA_TF='T'", geometry=",".join(map(str, bbox)), geometryType="esriGeometryEnvelope", inSR=4326, outSR=4326,
             spatialRel="esriSpatialRelIntersects", outFields="FLD_ZONE", returnGeometry="true", geometryPrecision=5,
             resultOffset=off, resultRecordCount=1000, orderByFields="OBJECTID", f="geojson")
    url = SVC + "?" + urllib.parse.urlencode(q)
    for t in range(6):
        try:
            with urllib.request.urlopen(url, timeout=180) as r: return json.load(r)
        except Exception as e:
            time.sleep(5 * (t + 1)); err = e
    raise err
def main():
    u = gpd.read_file(DATA / "unidades.geojson"); x0, y0, x1, y1 = u.total_bounds
    dst = CACHE / "fema"; dst.mkdir(exist_ok=True, parents=True); n = 4; partes = []
    for i in range(n):
        for j in range(n):
            bb = (x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * j / n, x0 + (x1 - x0) * (i + 1) / n, y0 + (y1 - y0) * (j + 1) / n)
            arq = dst / f"sfha_{i}_{j}.geojson"
            if not arq.exists():
                feats = []; off = 0
                while True:
                    d = pagina(bb, off); fs = d.get("features", []); feats += fs; off += len(fs)
                    if len(fs) < 1000: break
                json.dump({"type": "FeatureCollection", "features": feats}, open(arq, "w"))
                print(arq.name, len(feats), flush=True)
            g = gpd.read_file(arq)
            if len(g): partes.append(g)
    f = pd.concat(partes).set_crs(4326, allow_override=True).to_crs(2276); f["geometry"] = f.geometry.buffer(0)
    sfha = f.union_all(); uu = u.to_crs(2276); uu["geometry"] = uu.geometry.buffer(0)
    L = []
    for r in uu.itertuples():
        pct = 100 * r.geometry.intersection(sfha).area / r.geometry.area
        L.append(dict(unidade_id=r.unidade_id, criterio_id="c25", metrica="pct_area_sfha", valor=round(pct, 1), unidade_medida="% da área",
                      url="https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28", data_referencia=HOJE, confianca="alta",
                      obs="NFHL vigente na data da coleta; área de terra da unidade (lagos > 10 acres excluídos); geometria simplificada a ~150 ft"))
    gravar("fema_nfhl", L)
if __name__ == "__main__": main()
