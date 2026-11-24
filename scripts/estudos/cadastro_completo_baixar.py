"""Baixa o cadastro completo (todos os lotes) dentro de uma caixa geográfica, com o nome do loteamento e os campos de valor, para dar nome às regiões.
Guarda em cache/cadastro/ (o cadastro completo servirá depois para valor de casas construídas). Nome de proprietário NÃO é baixado."""
import json, sys, subprocess, urllib.parse, time
F = {
 "collin": ("https://services2.arcgis.com/uXyoacYrZTPTKD3R/arcgis/rest/services/CCAD_Parcel_Feature_Set/FeatureServer/4", ["propID", "propCategoryCode", "propSubType", "legalAbsSubName", "legalDescription", "landSizeSqft", "prevValLand", "prevValImprv", "imprvYearBuilt", "imprvMainArea", "situsCity"]),
 "denton": ("https://gis.dentoncounty.gov/arcgis/rest/services/Parcels_FC/MapServer/0", ["pid", "stateCodes", "abstractSubdivisionDescription", "legalDescription", "land_sqft", "landNHSValue", "landHSValue", "improvementValue", "imprvActualYearBuilt", "imprvMainArea", "situsCity"]),
 "tarrant": ("https://tad.newedgeservices.com/arcgis/rest/services/InteractiveMap/TADMap/MapServer/0", ["PID", "PropertyUseCode", "LegalDescription", "LandTotalSqft", "LandValue", "ImprovementValue", "ActualYearBuilt", "MainArea", "SitusAddress"]),
 "johnson": ("https://jcadgis.johnsoncad.com/arcgis/rest/services/Public_Map_Parcels/MapServer/1", ["*"]),
}
def q(url, p):
    for t in range(4):
        r = subprocess.run(["curl", "-s", "-m", "180", url + "/query?" + urllib.parse.urlencode(p)], capture_output=True, text=True)
        try: return json.loads(r.stdout)
        except Exception: time.sleep(5 * (t + 1))
    raise SystemExit("falhou " + url)
nome, caixa, saida = sys.argv[1], sys.argv[2], sys.argv[3]; url, campos = F[nome]; out, off = [], 0
while True:
    d = q(url, dict(where="1=1", geometry=caixa, geometryType="esriGeometryEnvelope", inSR=4326, spatialRel="esriSpatialRelIntersects", outFields=",".join(campos), returnGeometry="true", outSR=4326,
                    geometryPrecision=5, maxAllowableOffset=0.0005, orderByFields="OBJECTID", resultOffset=off, resultRecordCount=2000, f="json"))
    if "error" in d: print("ERRO", d["error"]); break
    fs = d.get("features", [])
    for f in fs:
        rg = (f.get("geometry") or {}).get("rings") or []
        if rg: xs = [p[0] for p in rg[0]]; ys = [p[1] for p in rg[0]]; out.append({**f["attributes"], "lon": sum(xs) / len(xs), "lat": sum(ys) / len(ys)})
    off += len(fs)
    if off % 20000 < 2000: print(nome, off, flush=True)
    if len(fs) < 2000 and not d.get("exceededTransferLimit"): break
    if not fs: break
json.dump(out, open(saida, "w")); print(nome, "total", len(out))
