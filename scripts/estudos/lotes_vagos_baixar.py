"""Baixa os lotes vagos (código C1) de um serviço ArcGIS de cadastro, com centróide, para o estudo de recorte. Exploratório."""
import json, sys, urllib.parse, urllib.request, time
def pagina(url, params):
    for t in range(4):
        try:
            import subprocess
            r = subprocess.run(["curl", "-s", "-m", "150", url + "/query?" + urllib.parse.urlencode(params)], capture_output=True, text=True, check=True); return json.loads(r.stdout)
        except Exception as e:
            if t == 3: raise
            time.sleep(5 * (t + 1))
def baixar(nome, url, where, campos, ordem, passo=2000):
    out, off = [], 0
    while True:
        d = pagina(url, dict(where=where, outFields=",".join(campos), returnGeometry="true", outSR=4326, geometryPrecision=5, maxAllowableOffset=0.0002,
                             orderByFields=ordem, resultOffset=off, resultRecordCount=passo, f="json"))
        if "error" in d: print(nome, "ERRO", d["error"]); break
        fs = d.get("features", [])
        for f in fs:
            g = f.get("geometry") or {}; rings = g.get("rings") or []
            if not rings: continue
            xs = [p[0] for p in rings[0]]; ys = [p[1] for p in rings[0]]
            out.append({**f["attributes"], "lon": sum(xs) / len(xs), "lat": sum(ys) / len(ys)})
        off += len(fs); print(nome, off, flush=True)
        if len(fs) < passo and not d.get("exceededTransferLimit"): break
        if not fs: break
    json.dump(out, open(nome + ".json", "w")); print(nome, "total", len(out))
F = {
 "collin": ("https://services2.arcgis.com/uXyoacYrZTPTKD3R/arcgis/rest/services/CCAD_Parcel_Feature_Set/FeatureServer/4", "propCategoryCode='C1' AND propSubType='Land'",
            ["propID", "ownerName", "legalDescription", "landSizeAcres", "landSizeSqft", "landAgAcres", "prevValLand", "prevValMarket", "prevValAgLoss", "situsCity", "situsZip", "exemptCodes", "landTypeCode", "legalAbsSubName"], "OBJECTID"),
 "tarrant": ("https://tad.newedgeservices.com/arcgis/rest/services/InteractiveMap/TADMap/MapServer/0", "PropertyUseCode='C1'",
             ["PID", "DisplayOwnerName", "LegalDescription", "LandTotalSqft", "ACRES", "LandValue", "ImprovementValue", "SitusAddress", "AssessmentStatus", "MarketAreaDescription"], "OBJECTID"),
 "denton": ("https://gis.dentoncounty.gov/arcgis/rest/services/Parcels_FC/MapServer/0", "stateCodes='C1' OR stateCodes='C1,PLAN'",
            ["pid", "name", "legalDescription", "legalAcreage", "land_sqft", "landNHSValue", "landHSValue", "ownerAgValue", "ownerMarketValue", "situsCity", "situsZip", "exemptions", "cityTaxingUnitName", "abstractSubdivisionDescription"], "OBJECTID"),
}
u, w, c, o = F[sys.argv[1]]; baixar(sys.argv[1], u, w, c, o)
