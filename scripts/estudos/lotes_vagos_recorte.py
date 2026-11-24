import json, re, warnings, collections; warnings.filterwarnings("ignore")
import geopandas as gpd, pandas as pd, numpy as np
def agrupar(pts, eps, minimo):
    """Agrupa lotes que estão a até `eps` um do outro (em cadeia): une círculos de raio eps/2. Grupos com menos de `minimo` lotes ficam sem região (-1)."""
    manchas = gpd.GeoDataFrame(geometry=list(pts.buffer(eps / 2).union_all().geoms) if hasattr(pts.buffer(eps / 2).union_all(), "geoms") else [pts.buffer(eps / 2).union_all()], crs=pts.crs)
    manchas["k"] = range(len(manchas)); j = gpd.sjoin(gpd.GeoDataFrame(geometry=pts), manchas, how="left", predicate="within")
    k = j["k"].to_numpy(); tam = pd.Series(k).value_counts(); return np.where(pd.Series(k).map(tam).to_numpy() >= minimo, k, -1)
R="/home/user/precificacao-dallas"
def carrega():
    L=[]
    for r in json.load(open("collin.json")): L.append(dict(cond="Collin",id=r["propID"],dono=r["ownerName"] or "",desc=r["legalDescription"] or "",sqft=r["landSizeSqft"] or (r["landSizeAcres"] or 0)*43560,valor=r["prevValLand"],isen=r["exemptCodes"] or "",zip=(r["situsZip"] or "")[:5],sub=r["legalAbsSubName"] or "",lon=r["lon"],lat=r["lat"]))
    for r in json.load(open("tarrant.json")): L.append(dict(cond="Tarrant",id=r["PID"],dono=r["DisplayOwnerName"] or "",desc=r["LegalDescription"] or "",sqft=r["LandTotalSqft"] or 0,valor=r["LandValue"],isen=r["AssessmentStatus"] or "",zip="",sub=(r["LegalDescription"] or "").split(" Block")[0],lon=r["lon"],lat=r["lat"]))
    for r in json.load(open("denton.json")): L.append(dict(cond="Denton",id=r["pid"],dono=r["name"] or "",desc=r["legalDescription"] or "",sqft=r["land_sqft"] or (r["legalAcreage"] or 0)*43560,valor=(r["landNHSValue"] or 0)+(r["landHSValue"] or 0),isen=r["exemptions"] or "",zip=(r["situsZip"] or "")[:5],sub=r["abstractSubdivisionDescription"] or "",lon=r["lon"],lat=r["lat"]))
    return pd.DataFrame(L)
d=carrega(); g=gpd.GeoDataFrame(d,geometry=gpd.points_from_xy(d.lon,d.lat),crs=4326)
un=gpd.read_file(f"{R}/data/unidades.geojson")[["unidade_id","nome","geometry"]]; un["cidade"]=un["nome"].str.split(" × ").str[0]
g=gpd.sjoin(g,un,how="left",predicate="within").drop(columns="index_right")
print("lotes C1 baixados:",len(g),"| por condado:",g.cond.value_counts().to_dict())
print("valores distintos do campo de isenção/situação (top):",{c:g[g.cond==c].isen.value_counts().head(6).to_dict() for c in ["Collin","Tarrant","Denton"]})
DONO=re.compile(r"\b(HOA|H O A|HOMEOWNERS?|HOME OWNERS?|OWNERS? ASS(OC|N)|PROPERTY OWNERS|COMMUNITY ASS(OC|N)|ASSOCIATION|CITY OF|TOWN OF|COUNTY|STATE OF TEXAS|TEXAS DEPT|I\.?S\.?D\.?|SCHOOL DIST|MUNICIPAL UTILITY|M\.?U\.?D\.?\b|UTILITY DIST|WATER DIST|WATER SUPPLY|ONCOR|ATMOS|ELECTRIC|PIPELINE|RAILROAD|CHURCH|BAPTIST|METHODIST|CATHOLIC|DIOCESE|IMPROVEMENT DIST)",re.I)
DESC=re.compile(r"(COMMON AREA|\bCA[- ]?\d|\bLOT CA\b|OPEN SPACE|GREEN ?BELT|DRAINAGE|DETENTION|RETENTION|EASEMENT|ESMT|RIGHT[- ]OF[- ]WAY|\bROW\b|\bR\.O\.W|\bPARK\b|AMENITY|LANDSCAPE|PRIVATE STREET|ALLEY|\bHOA\b)",re.I)
ISEN=re.compile(r"(EX-XV|EX-X|EXEMPT|TOTAL|\bEX\b)",re.I)
def limpar(x, nome):
    n0=len(x); passos=[]
    a=x.dono.str.contains(DONO); passos.append(("a) dono público, HOA, igreja, concessionária",a.sum(),x[a].head(20)))
    x=x[~a]; b=x.isen.str.contains(ISEN); passos.append(("b) isenção total",b.sum(),x[b].head(20)))
    x=x[~b]; c=x.desc.str.contains(DESC); passos.append(("c) descrição de área comum/drenagem/servidão",c.sum(),x[c].head(20)))
    x=x[~c]
    print(f"\n== {nome}: {n0} lotes C1");
    for t,n,am in passos: print(f"   {t}: saem {n}"); 
    print(f"   restam {len(x)} | com menos de 2.000 sqft: {(x.sqft<2000).sum()} | sem tamanho: {(x.sqft<=0).sum()} | valor de terra até $1.000: {(x.valor.fillna(0)<=1000).sum()}")
    return x, passos
tr=gpd.read_file(f"{R}/cache/tiger/tl_2025_48_tract.zip")[["GEOID","geometry"]].to_crs(4326)
FX=[(0,0.25,"até 0,25 acre"),(0.25,0.5,"0,25–0,5"),(0.5,1,"0,5–1"),(1,5,"1–5"),(5,20,"5–20"),(20,1e9,"mais de 20")]
res={}
for cid in ["Frisco","Mansfield"]:
    x=g[g.cidade==cid].copy(); x,passos=limpar(x,cid); res[cid]=(x,passos)
    for t,n,am in passos: print(f"   amostra {t[:2]}", [f"{r.dono[:28]} | {r.desc[:40]}" for r in am.head(4).itertuples()])
    ac=x.sqft/43560; print("   tamanho:",{n:int(((ac>a)&(ac<=b)).sum()) for a,b,n in FX})
    x=gpd.sjoin(x,tr,how="left",predicate="within").drop(columns="index_right")
    x["grupo"]=agrupar(x.to_crs(2276).geometry.reset_index(drop=True),1300,10)   # 1.300 pés ≈ 400 m
    def resumo(col,nome,vazio=None):
        s=x[col]; s=s[(s.notna())&(s!=vazio)] if vazio is not None else s[s.notna()&(s!="")]
        c=s.value_counts(); print(f"   {nome}: {len(c)} regiões | lotes por região: mín {c.min() if len(c) else 0}, mediana {int(c.median()) if len(c) else 0}, máx {c.max() if len(c) else 0} | com menos de 10 lotes: {(c<10).sum()} | lotes sem região: {len(x)-len(s)}")
        return c
    resumo("GEOID","setor censitário"); 
    if (x.zip!="").any(): resumo("zip","ZIP (do cadastro)")
    else: print("   ZIP: o cadastro deste condado não traz ZIP do lote")
    c=resumo("grupo","agrupamento por proximidade (400 m, mín. 10 lotes)",vazio=-1)
    x.to_file(f"{cid}.gpkg",driver="GPKG")
    print("   maiores grupos por proximidade e o loteamento mais comum em cada um:",[(int(n), x[x.grupo==k]["sub"].str[:28].mode().iloc[0] if len(x[x.grupo==k]["sub"].mode()) else "") for k,n in c.head(5).items()])
