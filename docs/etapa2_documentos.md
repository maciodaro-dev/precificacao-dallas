# Etapa 2 — checklist de documentos: nomes usados no Texas (para confirmar)

Situação em 2026-11-24: o checklist está no ar com os nomes informados pelo dono da ferramenta. A coluna "Nome no Texas" abaixo é
**proposta**: os sites do TREC, do TDI, do Comptroller e do Legislativo não abriram daqui, então cada nome foi visto só em resultado
de busca. Nada disto foi fixado como oficial. [memória] = não visto em nenhum resultado; tratar como não confirmado.

| Documento no checklist | Nome no Texas (proposto) | Quem emite | Onde conferir |
|---|---|---|---|
| Contrato de compra de terreno | Unimproved Property Contract, TREC No. 9-18 (obrigatório desde 2026-07-01; antes 9-17) | TREC (formulário padrão) | https://www.trec.texas.gov/forms/unimproved-property-contract |
| Comprovante do sinal e da taxa de opção | Blocos de recibo na última página do contrato do TREC (título exato não visto) | Title company (escrow agent) | https://www.trec.texas.gov/sites/default/files/pdf-forms/9-18.pdf |
| Title commitment com as exceções | Commitment for Title Insurance (Form T-7); exceções no Schedule B [memória] | Title company; formulário do TDI | https://www.tdi.texas.gov/title/titlemm2.html |
| Survey | Survey; para reaproveitar um survey antigo: Form T-47 (Residential Real Property Affidavit) ou T-47.1 (Declaration in Lieu of Affidavit) | Surveyor; T-47 assinado pelo vendedor | https://www.tdi.texas.gov/title/documents/formT-47.pdf |
| Restrições registradas e documentos de HOA | Restrictive covenants / deed restrictions; TREC 36-10 ou 36-11 (Addendum for Property Subject to Mandatory Membership in a Property Owners Association); TREC 37-5 (Subdivision Information, Including Resale Certificate) | Associação; restrições registradas no county clerk | https://www.trec.texas.gov/sites/default/files/pdf-forms/36-11.pdf |
| Plat do loteamento | Plat (final plat; replat; amending plat), registrado | Aprovado pela cidade; registrado no county clerk | Local Gov't Code §212.004 |
| Carta de zoneamento da prefeitura | Zoning Verification Letter (ZVL): Dallas, Fort Worth, Frisco e McKinney usam esse nome | Departamento de planejamento da cidade | páginas das cidades (ver `data/referencias_etapa2.json`, prazo_doc_zoneamento_carta) |
| Determinação de zona de alagamento | Para lote sem construção: FIRMette (recorte do mapa da FEMA). Standard Flood Hazard Determination Form só aparece com empréstimo; Elevation Certificate descreve construção | FEMA Flood Map Service Center | https://msc.fema.gov/portal/resources/productsandtools |
| Disponibilidade de água e esgoto | Sem nome único: "Water/Wastewater Availability Request" (Dallas), "will-serve letter"; CCN = Certificate of Convenience and Necessity | Concessionária ou distrito; CCN pela PUC | https://www.puc.texas.gov/industry/water/utilities/gis.aspx |
| Avaliação do terreno para fossa | On-Site Sewage Facility (OSSF) site evaluation, 30 TAC §285.30 | Site Evaluator licenciado pela TCEQ ou engenheiro (PE) | https://www.tceq.texas.gov/licensing/licenses/ossflic |
| Laudo de solo | Geotechnical report / soils report (nome de uso, sem formulário estadual) | Empresa de engenharia geotécnica | sem fonte oficial |
| Certidão de impostos e isenção agrícola | Tax certificate (Tax Code §31.08); 1-d-1 (Open-Space) Agricultural Use Appraisal. É avaliação especial, não "isenção". A certidão não mostra o risco de cobrança retroativa | Tax collector; appraisal district | https://comptroller.texas.gov/taxes/property-tax/ag-timber |
| Direitos minerais e poços | RRC Public GIS Viewer (poços e dutos, não a propriedade mineral); TREC 44-3 (Addendum for Reservation of Oil, Gas, and Other Minerals) | Railroad Commission; title company | https://gis.rrc.texas.gov/GISViewer/ |
| Documentos do financiamento | Promissory note e deed of trust; TREC 40-11 (Third Party Financing Addendum) | Banco; title company | https://www.trec.texas.gov/forms/third-party-financing-addendum-0 |
| Documentos da empresa compradora | Certificate of Formation (Form 205); Certificate of Fact (status); resolução da empresa [memória] | Texas Secretary of State | https://www.sos.state.tx.us/corp/instructions/205.shtml |
| Escritura | General Warranty Deed ou Special Warranty Deed | Advogado da title company; registrada no county clerk | Property Code §5.022 |
| Settlement statement | À vista: ALTA Settlement Statement. Financiado para pessoa física: Closing Disclosure + Form T-64 do TDI | Title company | https://www.alta.org/policies-and-standards/policy-forms/settlement-statements |
| Apólice de seguro de título | Owner's Policy of Title Insurance (Form T-1) | Title company; formulário do TDI | https://www.tdi.texas.gov/title/titlemm2.html |

## Pontos para decidir

1. Trocar "isenção agrícola" por "avaliação agrícola" nas telas (no Texas é avaliação especial, não isenção)?
2. "Determinação de zona de alagamento": para lote sem construção o documento prático é o FIRMette. Renomear?
3. Quem paga seguro de título e survey: no contrato do TREC os dois são campos negociados (parágrafos 6A e 6C), o que confirma os
   seletores "quem paga" do bloco Negociação.

## Cobrança retroativa de imposto (rollback) — para confirmar antes de calcular

- Alcance: **3 anos** anteriores à mudança de uso (HB 1743, 2019).
- Juros: **não há juros** sobre a cobrança em si desde a HB 3833 (2021); só há multa e juros se a conta atrasar.
- Fórmula proposta: soma, nos 3 anos anteriores, de (imposto pelo valor de mercado − imposto pago pela avaliação agrícola).
- Fonte: Comptroller, https://comptroller.texas.gov/taxes/property-tax/bills/landuse-bills.php (vista só em resultado de busca).
- Fontes desatualizadas ainda circulam (5 anos, com juros). Nenhuma fórmula está aplicada na ferramenta.

## Período de opção em terreno (sem padrão na ferramenta)

| Fonte (página aberta) | Prazo citado para terreno |
|---|---|
| Neuhaus Realty Group, https://www.neuhausre.com/land-due-diligence-checklist/ | 30 a 90 dias ("mínimo"); casas 7 a 17 |
| TX Roots Global RE, https://txrootsglobalre.com/land-ranch/land-due-diligence-checklist | 14 a 30; "30 dias é comum" em área simples no Norte do Texas |
| Dunn & Stone Builders, https://www.dunnandstonebuilders.com/knowledge-center/buying-land-in-texas | 7 a 14, às vezes mais |
| Texas A&M Real Estate Research Center, https://trerc.tamu.edu/article/Option-Period-Basics-2360/ | sem número: é negociado |

São corretores e uma construtora; nenhuma fonte oficial dá número. O contrato do TREC deixa o campo em branco.
