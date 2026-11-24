"""Estimativas de referência da etapa 2 (aquisição do terreno) e valores guardados para a etapa 4.

Não são valores oficiais. São faixas publicadas por terceiros, guardadas com fonte, link e data. Aprovadas como PROVISÓRIAS em
2026-11-24, todas com confiança "baixa": os números foram vistos em resultados de busca, não na página original.

Regra do "provável" (registrada junto de cada valor):
 - cada fonte entra com o seu valor central: o típico que ela publica ou, se só publica faixa, o ponto médio da faixa;
 - uma fonte: provável = o valor central dela;
 - duas fontes: ponto médio entre as duas;
 - três ou mais: mediana.
Mínimo e máximo: os aprovados na tabela de 2026-11-24.

Atualização: rever a cada 6 meses (a tela sinaliza valor com mais de 6 meses). Para atualizar, corrigir as fontes abaixo,
mudar DATA e rodar este script; ele grava data/referencias_etapa2.json. Depois rodar scripts/consolidar.py.
"""
import json, pathlib, statistics
DATA = "2026-11-24"
RAIZ = pathlib.Path(__file__).resolve().parent.parent
LOTE_COMUM = "valor de referência para lote comum; em área maior tende a ser mais alto"

def f(nome, url, minimo=None, maximo=None, tipico=None, obs="", lida=False):
    """lida=True: o número foi conferido na página original (aberta em 2026-11-24); False: visto só em resultado de busca."""
    return dict(nome=nome, url=url, min=minimo, max=maximo, tipico=tipico, data=DATA, obs=obs, lida=lida)

# id, nome, unidade, geografia, mínimo, máximo, etapa, fontes, observação
ITENS = [
  ("survey", "Survey de lote residencial", "US$", "DFW / Texas", 450, 1800, 2, [
      f("FindLandSurveyor, Dallas County", "https://findlandsurveyor.com/guides/land-survey-cost-dallas-county-tx", 500, 2000),
      f("FindLandSurveyor, Tarrant County", "https://findlandsurveyor.com/guides/land-survey-cost-tarrant-county-tx", 450, 1800, obs="mesmo editor da fonte anterior"),
      f("LRG Realty, Property Surveys in Texas", "https://lrgrealty.com/lrg-blog/property-survey-texas-buyers-guide/", 400, 700),
      f("HomeAdvisor, Fort Worth", "https://homeadvisor.com/tloc/Haltom-City-TX/Land-Surveyor", 300, 572, 420)], LOTE_COMUM),
  ("laudo_solo", "Laudo de solo (geotécnico)", "US$", "nacional", 1000, 4500, 2, [
      f("Angi, geotechnical report cost", "https://www.angi.com/articles/geotechnical-report-cost.htm", 1000, 5000, 2700, obs="site recusou a conexão; os mesmos números aparecem na página do CostToBuildHouse"),
      f("CostToBuildHouse, geotechnical report", "https://www.costtobuildhouse.com/geotechnical-report-cost", 2000, 3500, lida=True),
      f("CostToBuildHouse, Dallas", "https://www.costtobuildhouse.com/dallas-tx", 800, 1200, obs="contradiz a página nacional do mesmo site", lida=True)], LOTE_COMUM),
  ("fossa_avaliacao", "Avaliação do terreno para fossa", "US$", "Texas", 300, 800, 2, [
      f("SepticAndWell, Texas septic permit guide", "https://septicandwell.com/articles/texas-septic-permit", 300, 800)], "fonte única"),
  ("fechamento_escrow", "Taxa de fechamento da title company (parte do comprador)", "US$", "Texas", 300, 1000, 2, [
      f("Neuhaus RE, closing costs guide", "https://www.neuhausre.com/guides/closing-costs-guide-texas/", 300, 600),
      f("LRG Realty, closing costs for cash buyers", "https://lrgrealty.com/lrg-blog/closing-costs-cash-buyers-texas/", 500, 1200),
      f("Herring Bank, typical closing costs in Texas", "https://herringbank.com/learn/typical-closing-costs-in-texas-for-buyers-and-sellers", 250, 750),
      f("Texas National Title, seller's estimated charges", "https://www.texasnationaltitle.com/wp-content/uploads/2023/03/SellersEstimatedCharges.pdf", tipico=525)],
      "taxa não tabelada pelo estado; nenhuma tabela de title company de DFW encontrada"),
  ("registro_escritura", "Registro da escritura", "US$", "DFW", 28, 41, 2, [
      f("Dallas County Clerk", "https://www.dallascounty.org/government/county-clerk/recording/fees-payment.php", 33, 37, obs="US$ 25 a primeira página + US$ 4 por página adicional"),
      f("Collin County Clerk", "https://www.collincountytx.gov/docs/default-source/county-clerk/documents/land-recording-fees.pdf", 33, 37, obs="US$ 25 + US$ 4 por página"),
      f("Denton County Clerk", "https://www.dentoncounty.gov/322/Real-Property-Recording-Fee-Schedule", 37, 41, obs="US$ 25 + US$ 4 por página + US$ 4 da página de informação"),
      f("Tarrant County Clerk", "https://www.tarrantcountytx.gov/en/county-clerk/real-estate-records/fee-schedules.html", 28, 32, obs="US$ 20 + US$ 4 por página")],
      "conta feita para escritura de 3 a 4 páginas"),
  ("financiamento_contratacao", "Financiamento: taxa de originação do banco", "% do valor financiado", "nacional / Texas", 0.5, 1.5, 2, [
      f("FBN Finance, land loan upfront and closing costs", "https://www.fbn.com/community/blog/land-loan-average-upfront-and-closing-costs", 0.5, 1.5),
      f("LRG Realty, buyer closing costs in Texas", "https://lrgrealty.com/lrg-blog/buyer-closing-costs-texas/", 0.5, 1.0, obs="número de financiamento de casa")],
      "inclui só a taxa de originação, análise e processamento do banco; NÃO inclui a avaliação do lote (linha própria), o seguro de título nem a taxa da title company"),
  ("avaliacao_banco", "Financiamento: avaliação do lote pelo banco", "US$", "nacional", 400, 2000, 2, [
      f("CostHelper, property appraisers", "https://personalfinance.costhelper.com/property-appraisers.html", 300, 500),
      f("Angi, land appraisal cost (até 1 acre)", "https://www.angi.com/articles/land-appraisal-cost.htm", 1000, 2000),
      f("FBN Finance (fazendas)", "https://www.fbn.com/community/blog/land-loan-average-upfront-and-closing-costs", 1500, 3000)], LOTE_COMUM),
  ("juros_terreno", "Juros de financiamento de terreno", "% ao ano", "Texas", 6.5, 10.0, 2, [
      f("Texas GLO, Veterans Land Board", "https://www.glo.texas.gov/veterans/land-sale/land-loans", tipico=7.25, obs="só veteranos; lote de 1 acre ou mais", lida=True),
      f("Members Choice Credit Union", "https://www.mccu.com/access/mortgage-rates", 7.74, 8.24, 7.99, obs="terreno residencial sem benfeitoria, 10 a 20 anos; taxas de 2026-09-21", lida=True),
      f("Dallas Fed Agricultural Survey, via Ag Proud", "https://www.agproud.com/articles/64188-interest-rates-largely-unchanged-in-q2-reports", tipico=7.7, obs="taxas agrícolas, não de lote"),
      f("Mossy Oak Properties, how to finance land", "https://www.mossyoakproperties.com/how-finance-land-best-loan-options-tips/", 6.5, 10.0)],
      "só preenchimento inicial do campo; confirme com o seu banco"),
  ("entrada_pct", "Entrada no financiamento de terreno", "% do preço", "Texas", 15, 35, 2, [
      f("Texas Farm Credit, first-time land buyer", "https://texasfarmcredit.com/resources/first-time-land-buyer-1/", tipico=20, lida=True),
      f("Herring Bank, Texas land loans", "https://www.herringbank.com/?p=10322", 20, 35, obs="lote com infraestrutura 20 a 25%; lote sem infraestrutura 25 a 35%; terra bruta 35 a 50%", lida=True),
      f("Texas GLO, Veterans Land Board", "https://www.glo.texas.gov/veterans/land-sale/land-loans", tipico=5, obs="só veteranos", lida=True)],
      "só preenchimento inicial do campo; confirme com o seu banco"),
  ("prazo_financiamento_anos", "Prazo do financiamento de terreno", "anos", "Texas", 5, 30, 2, [
      f("Capital Farm Credit, land loans", "https://www.capitalfarmcredit.com/loans/land-loans/", 5, 30),
      f("Members Choice Credit Union", "https://www.mccu.com/access/mortgage-rates", 10, 20, lida=True),
      f("Texas GLO, Veterans Land Board", "https://www.glo.texas.gov/veterans/land-sale/land-loans", tipico=30, obs="só veteranos", lida=True)],
      "só preenchimento inicial do campo; confirme com o seu banco"),
  ("sinal_pct", "Sinal (earnest money)", "% do preço", "Texas", 1, 3, 2, [
      f("Redfin, earnest money in Texas", "https://www.redfin.com/blog/how-much-is-earnest-money-in-texas/", 1, 3, 1),
      f("LRG Realty, earnest money in Texas", "https://lrgrealty.com/lrg-blog/earnest-money-texas-how-much/", tipico=1)], "normas de contrato de casa"),
  ("taxa_opcao", "Taxa de opção", "US$", "Texas", 100, 500, 2, [
      f("Wikipedia, Option fee (Texas)", "https://en.wikipedia.org/wiki/Option_fee", 100, 200, obs="sem citação na página"),
      f("Guias do Texas (faixa geral)", "https://lrgrealty.com/lrg-blog/texas-option-period-explained/", 100, 500),
      f("Guia de Houston", "https://lrgrealty.com/lrg-blog/texas-option-period-explained/", 250, 1000, obs="atribuição incerta")], "normas de contrato de casa"),
  # ---- prazo para receber documentos (dias corridos; dias úteis das fontes convertidos por 7/5) ----
  ("prazo_doc_title_commitment", "Prazo para receber o title commitment", "dias", "Texas", 9, 20, 2, [
      f("Old Republic Title, Texas", "https://www.oldrepublictitle.com/media/6108/flyer_tx-commitment-a_d.pdf", tipico=20, obs="prazo do contrato: até 20 dias depois de a title company receber o contrato", lida=True),
      f("CandysDirt (Dallas)", "https://candysdirt.com/2019/06/25/clocks-ticking-countdown-to-closing/", tipico=20, lida=True),
      f("Neuhaus Realty", "https://neuhausre.com/how-long-does-closing-take-texas-timeline/", tipico=20, lida=True),
      f("LRG Realty, closing timeline guide", "https://lrgrealty.com/lrg-blog/?p=1938", 9, 14, obs="a fonte diz 7 a 10 dias úteis")], "20 dias é o prazo máximo do contrato, não a média real"),
  ("prazo_doc_survey", "Prazo para receber o survey", "dias", "Texas / DFW", 7, 42, 2, [
      f("Surveyors.io, Texas", "https://surveyors.io/land-surveyors/texas", 7, 14, obs="5 a 10 dias úteis; até 3 semanas na alta", lida=True),
      f("Lonestar Land Surveying (Joshua, TX)", "https://lonestarlandsurveying.com/", 10, 14, obs="7 a 10 dias úteis depois do trabalho de campo", lida=True),
      f("FinHome Contracting", "https://finhomecontracting.com/blog/home-building/custom-home-building-timeline-phase-by-phase-2026/", 14, 21, lida=True),
      f("TX Roots Global RE", "https://txrootsglobalre.com/blog/how-does-buying-land-or-a-ranch-in-north-texas-actually-work", 14, 42, obs="2 a 6 semanas conforme o tamanho da área", lida=True)], ""),
  ("prazo_doc_solo", "Prazo para receber o laudo de solo", "dias", "DFW / Texas", 7, 56, 2, [
      f("Dallas Geotech", "https://dallasgeotech.com/soil-borings/", 10, 14, obs="7 a 10 dias úteis depois do trabalho de campo", lida=True),
      f("BuildEng", "https://buildgeotech.com/geotechnical-engineering-services", 7, 14, obs="5 a 10 dias úteis depois do campo", lida=True),
      f("FinHome Contracting", "https://finhomecontracting.com/blog/home-building/custom-home-building-timeline-phase-by-phase-2026/", 14, 28, lida=True),
      f("CostToBuildHouse (nacional)", "https://www.costtobuildhouse.com/geotechnical-report-cost", 14, 56, lida=True)], ""),
  ("prazo_doc_zoneamento_carta", "Prazo para receber a carta de zoneamento", "dias", "DFW", 3, 14, 2, [
      f("City of Dallas, Permit Center", "https://dallascityhall.com/departments/sustainabledevelopment/strategic_business_unit/Pages/permit-center.aspx", 3, 4, lida=True),
      f("City of Fort Worth", "https://www.fortworthtexas.gov/files/assets/public/development-services/documents/zoning/2021-zvl.pdf", 4, 14, obs="até 10 dias úteis; 3 dias úteis com taxa maior", lida=True),
      f("City of Arlington", "https://www.arlingtontx.gov/files/assets/city/v/3/planning-and-development-services/documents/zoning-unified-development-code/zoning-verification-letter-application.pdf", tipico=7, obs="5 dias úteis", lida=True),
      f("City of Grand Prairie", "https://www.gptx.org/Departments/Planning-and-Development/Planning-Division/Development-Process/Development-Applications/Zoning-Verification", tipico=14, obs="10 dias úteis", lida=True)], ""),
  ("prazo_doc_fossa_avaliacao", "Prazo da avaliação do terreno para fossa", "dias", "Texas", 3, 7, 2, [
      f("Texas Septic Guide", "https://www.texassepticguide.com/learn/perc-test-texas", 3, 7, lida=True)], "fonte única; a análise do condado leva mais 2 a 4 semanas"),
  # ---- guardados para a etapa 4 (preparação do lote); na etapa 2 só entram no custo da falta do item "água e esgoto" ----
  ("poco", "Poço completo", "US$", "Norte do Texas", 10000, 25000, 4, [
      f("SepticAndWell, Texas well drilling cost", "https://septicandwell.com/articles/well-drilling-cost-texas", 14000, 25000, lida=True),
      f("Fort Worth Weekly", "https://www.fwweekly.com/?p=362940", 10000, 20000)], "poço de 400 a 900 pés no aquífero Trinity"),
  ("fossa_convencional", "Fossa convencional instalada", "US$", "DFW", 5000, 10000, 4, [
      f("Angi, Dallas", "https://www.angi.com/articles/what-does-it-cost-install-septic-system/tx/dallas", 5312, 8675, 6720),
      f("Wholesale Septic Supply, North Texas", "https://www.wholesalesepticsupply.com/blogs/guides/the-cost-of-an-aerobic-septic-system", 5000, 8000),
      f("Angi, nacional", "https://angi.com/articles/what-does-it-cost-install-septic-system.htm", 3000, 8000),
      f("HomeGuide, nacional", "https://homeguide.com/costs/septic-tank-system-cost", 3500, 8500)], ""),
  ("fossa_aerobica", "Fossa aeróbica instalada", "US$", "Texas / nacional", 10000, 25000, 4, [
      f("Angi, aerobic septic system", "https://www.angi.com/articles/aerobic-septic-system.htm", 10000, 20000),
      f("LatestCost, Texas", "https://latestcost.com/aerobic-septic-system-cost-texas/", 11000, 28000, 16000, lida=True),
      f("HomeGuide", "https://homeguide.com/costs/septic-tank-system-cost", 20000, 40000, obs="fora da curva")], ""),
  ("licenca_fossa", "Licença de fossa do condado", "US$", "DFW", 277, 480, 4, [
      f("Tarrant County", "https://www.tarrantcountytx.gov/en/engineering-services/fee-schedule.html", tipico=277),
      f("Collin County", "https://www.collincountytx.gov/Services/Engineering/Development-Services/Documents/permitfees.pdf", 310, 335),
      f("Johnson County", "https://www.johnsoncountytx.org/departments/development-services/permit-fees", 375, 475),
      f("Parker County", "https://parkercountytx.gov/DocumentCenter/View/12318/Permitting-Requirements-2025-updated-61325", tipico=480),
      f("Tarrant Regional Water District", "https://www.trwd.com/wp-content/uploads/2026/02/TRWD-Permit-Fees.pdf", tipico=400)], "valor varia por condado; Denton não confirmado; Ellis e Kaufman sem valor encontrado"),
]

def central(fonte):
    if fonte["tipico"] is not None: return fonte["tipico"]
    return (fonte["min"] + fonte["max"]) / 2
def provavel(fontes):
    c = [central(x) for x in fontes]
    if len(c) == 1: return c[0], "fonte única: valor central da fonte"
    if len(c) == 2: return sum(c) / 2, "ponto médio entre as duas fontes"
    return statistics.median(c), f"mediana de {len(c)} fontes"
def arred(v, unidade):
    if unidade == "dias": return round(v)
    if unidade == "US$": return round(v / 10) * 10 if v >= 100 else round(v)
    return round(v, 1)

def main():
    saida = []; por_id = {}
    for id_, nome, unidade, geo, mn, mx, etapa, fontes, obs in ITENS:
        p, regra = provavel(fontes); p = min(max(arred(p, unidade), mn), mx); lidas = sum(1 for x in fontes if x["lida"])
        r = dict(id=id_, nome=nome, min=mn, provavel=p, max=mx, unidade=unidade, confianca="baixa", geografia=geo, data=DATA, etapa=etapa, regra=regra, provisorio=True,
                 obs=(obs + "; " if obs else "") + (f"{lidas} de {len(fontes)} fontes conferidas na página original" if lidas else "número visto em resultado de busca, página original não lida"), fontes=fontes)
        saida.append(r); por_id[id_] = r
    # custo da falta do item "água e esgoto" (etapa 2): sem rede, a casa depende de poço, fossa e licença. Mínimo com fossa convencional, máximo com aeróbica.
    pc, fc, fa, lc = (por_id[k] for k in ("poco", "fossa_convencional", "fossa_aerobica", "licenca_fossa"))
    saida.append(dict(id="tri_agua_esgoto", nome="Poço, fossa e licença, se não houver rede", min=pc["min"] + fc["min"] + lc["min"], provavel=pc["provavel"] + fc["provavel"] + lc["provavel"],
                      max=pc["max"] + fa["max"] + lc["max"], unidade="US$", confianca="baixa", geografia="DFW / Norte do Texas", data=DATA, etapa=2, provisorio=True,
                      regra="soma das estimativas de poço, fossa e licença guardadas para a etapa 4; mínimo e provável com fossa convencional, máximo com fossa aeróbica",
                      obs="na etapa 2 entra só no custo da falta; a obra é custo da etapa 4", fontes=pc["fontes"] + fc["fontes"] + fa["fontes"] + lc["fontes"]))
    json.dump(saida, open(RAIZ / "data" / "referencias_etapa2.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for r in saida: print(f'{r["id"]:28} {r["min"]:>8} {r["provavel"]:>8} {r["max"]:>8} {r["unidade"]:22} {r["regra"]}')
if __name__ == "__main__": main()
