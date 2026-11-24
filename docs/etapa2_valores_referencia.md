# Etapa 2 — estimativas de referência (proposta, aguardando aprovação)

Situação em 2026-11-24: **nenhum destes valores está em uso na ferramenta.** `data/referencias_etapa2.json` está vazio; as linhas
correspondentes aparecem como "sem valor" e o resultado diz quais ficaram de fora. Os valores só entram depois de aprovados.

Limite da pesquisa: os números abaixo foram vistos em **resultados de busca**; as páginas não puderam ser abertas daqui (os sites
recusam a conexão a partir deste ambiente). Datas de página, quando não visíveis, ficam "sem data". Antes de chamar qualquer taxa de
condado de "oficial", alguém precisa abrir a página do condado e confirmar valor e data de vigência.

Como seriam gravados: mínimo, provável e máximo; fonte, link e data; confiança baixa ou média; rótulo "estimativa de referência".
O "provável" é escolha minha dentro da faixa das fontes, não um número publicado por uma fonte só. Revisão a cada 6 meses.

## Proposta por linha

| Linha | Mín. | Provável | Máx. | Unidade | Geografia | Confiança | Fontes (divergência) |
|---|--:|--:|--:|---|---|---|---|
| Survey de lote residencial | 450 | 700 | 1.800 | US$ | DFW / Texas | média | FindLandSurveyor Dallas Co. 500–2.000; Tarrant Co. 450–1.800; LRG Realty 400–700; HomeAdvisor Fort Worth 300–572 (média 420). Divergem no teto. |
| Survey de gleba de 1 a 10 acres | 1.000 | 2.000 | 4.500 | US$ | Texas / nacional | baixa | Guias do Texas 800–3.000; guias nacionais 1.500–6.500 para 5 a 10 acres. |
| Laudo de solo (geotécnico) | 1.000 | 2.500 | 4.500 | US$ | nacional | baixa | Angi 1.000–5.000 (média 2.700); CostToBuildHouse 2.000–3.500 nacional, mas 800–1.200 na página de Dallas (o mesmo site se contradiz). Sem fonte de DFW. |
| Avaliação do terreno para fossa | 300 | 500 | 800 | US$ | Texas | baixa | Uma fonte só (SepticAndWell 300–800). |
| Licença de fossa do condado | 277 | 375 | 480 | US$ | DFW | média | Tarrant 277; Collin 310/335; Johnson 375/475; Parker 480; Denton 410 (não confirmado); Ellis e Kaufman sem valor encontrado. Proponho usar o valor do condado do terreno quando houver. |
| Poço completo | 10.000 | 18.000 | 25.000 | US$ | Norte do Texas | baixa | SepticAndWell 14.000–25.000 (poço de 400 a 900 pés); Fort Worth Weekly 10.000–20.000+. Médias nacionais (3.000–9.000) supõem poço raso e não servem para DFW. |
| Fossa convencional instalada | 5.000 | 7.000 | 10.000 | US$ | DFW | média | Angi Dallas 5.312–8.675 (média 6.720); Wholesale Septic Supply 5.000–8.000; nacional 3.000–8.500. |
| Fossa aeróbica instalada | 10.000 | 16.000 | 25.000 | US$ | Texas / nacional | baixa | Angi 10.000–20.000; LatestCost Texas 11.000–28.000; HomeGuide 20.000–40.000+ (fora da curva). |
| Taxa de fechamento da title company (parte do comprador) | 300 | 500 | 1.000 | US$ | Texas | baixa | Neuhaus 300–600; LRG 500–1.200; outras guias 250–750; formulário Texas National Title 525. Nenhuma tabela de title company de DFW encontrada. |
| Registro da escritura | 28 | 35 | 41 | US$ | DFW | média | Dallas, Collin e Denton: 25 a primeira página + 4 por página adicional; Tarrant: 20 + 4. Conta feita para escritura de 3 a 4 páginas. |
| Financiamento: custos de contratação | 0,5 | 1,0 | 1,5 | % do valor financiado | nacional / Texas | baixa | FBN 0,5–1,5% (originação); LRG 0,5–1%. Custos totais de fechamento do empréstimo: Texas Farm Credit 3–5%; FCS America 2–5%. |
| Financiamento: avaliação do lote pelo banco | 400 | 1.000 | 2.000 | US$ | nacional | baixa | CostHelper 300–500; Angi 1.000–3.000; FBN 1.500–3.000 (fazendas). Divergência grande. |
| Juros de financiamento de terreno | 6,5 | 7,5 | 10,0 | % ao ano | Texas | baixa | Texas VLB 7,25 (só veteranos); Members Choice CU 7,99; pesquisa do Dallas Fed cerca de 7,7; guias 6,5–10. Nenhum banco de DFW com taxa publicada. |
| Entrada no financiamento | 15 | 20 | 35 | % do preço | Texas | baixa | Texas Farm Credit 20 mínimo; Herring Bank 20–50; VLB 5; Texans CU até 80% financiado. |
| Prazo do financiamento | 5 | 15 | 30 | anos | Texas | baixa | Capital Farm Credit 5–30; Members Choice 5–20; Texans CU 5 anos com balão. |
| Sinal (earnest money) | 1 | 1 | 3 | % do preço | Texas | média | Redfin 1–3; LRG 1, 2 ou mais em mercado disputado. |
| Taxa de opção | 100 | 250 | 500 | US$ | Texas | baixa | 100–200 (Wikipedia, sem citação); 100–500; 250–1.000 (Houston). TREC e Texas A&M não publicam número. |
| Período de opção | 5 | 7 | 10 | dias | Texas / DFW | média | LRG 5–10; Nuncio (Dallas) 7–10. Normas de contrato de casa; nada específico de terreno. |
| Prazo até fechar, à vista | 7 | 14 | 30 | dias | Texas | média | 7–14 e 10–14 com título limpo. |
| Prazo até fechar, financiado | 30 | 45 | 90 | dias | Texas / nacional | baixa a média | LRG 30–45; LandHub 30–90. |

## Sem fonte encontrada (ficam vazios)

- Custo de resolver cada item da triagem (mudança de zoneamento, variance ou replat, servidão de acesso, extensão de rede, obra em zona
  de alagamento, restrições, servidões, direitos minerais). Ainda não pesquisado.
- Cobrança retroativa de imposto (rollback): a regra ainda está em conferência; nenhuma fórmula é aplicada.

## Seguro de título

Não é estimativa: é a tabela de prêmios básicos do Texas Department of Insurance (`app/src/etapa2/titulo_tdi.json`), aplicada sobre
o preço em uso. O documento-fonte é a versão de audiência marcada como rascunho; confere com as taxas em vigor desde 2026-03-01.
Confiança média até ser conferido com a tabela final publicada.
