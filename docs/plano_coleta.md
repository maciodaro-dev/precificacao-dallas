# Plano de coleta dos 11 parâmetros sem dado

Situação em 2026-11-24: o ranking padrão usa 9 de 20 parâmetros. Este plano diz, para cada um dos 11 que faltam, de onde o dado
pode vir, em que escala ele existe e o que ainda precisa ser conferido antes de coletar. Nada aqui foi coletado ainda.

Regras que valem para todos: valor bruto com fonte, data e confiança; nada estimado sem marca; onde a fonte só existe para a
cidade inteira, a fatia recebe a marca "dado da cidade inteira"; antes de usar cada fonte, registrar licença e uso comercial
em `data/fontes.json`.

## Parte 1 — Fonte única para toda a área (uma coleta cobre a DFW inteira)

| Ordem | Parâmetro | Fonte proposta | Escala | O que falta conferir |
|--:|---|---|---|---|
| 1 | Segurança (crimes por mil hab.) | Texas DPS, relatório anual "Crime in Texas" (crimes por agência policial); alternativa: FBI Crime Data Explorer | Cidade inteira (delegacia municipal). Área não incorporada: xerife do condado | O FBI exige chave gratuita de acesso; o DPS publica planilha. Cidades pequenas sem polícia própria ficam "sem dado" |
| 2 | Seguro residencial (custo médio por ano) | Texas Department of Insurance (prêmio médio de seguro residencial) | A confirmar: condado ou CEP | Ver em que escala o TDI publica. Se só houver por condado, o dado entra com confiança baixa e marca "dado do condado" |
| 3 | Dias para vender a casa | Realtor.com Research (dias no mercado, mensal, por CEP e por condado) | CEP, agregado para cada unidade | A fonte planejada (Redfin) recusa acesso automático. Conferir se o Realtor.com permite baixar e quais os termos de uso; se não, usar o dado por condado do Texas Real Estate Research Center (Texas A&M) |
| 4 | Rede de água e esgoto | PUC do Texas (mapa das áreas de concessão de água e esgoto, CCN) e TCEQ (distritos de água) | Polígono: dá para calcular a parcela de cada unidade atendida | Mapas públicos em formato de mapa digital; conferir acesso. Informa quem atende, não se há capacidade sobrando: capacidade só na prefeitura (parte 2) |
| 5 | Obra de infraestrutura prevista | TxDOT Project Tracker e NCTCOG (programa de obras de transporte) | Ponto ou trecho no mapa, cruzado com cada unidade | Definir o que conta como "obra prevista" (premissa): proponho obras com verba aprovada e início em até 5 anos |

## Parte 2 — Cadastro de imóveis dos condados (11 fontes, uma por condado)

| Ordem | Parâmetro | Fonte proposta | O que falta conferir |
|--:|---|---|---|
| 6 | Lote pronto para construir | Cadastros dos appraisal districts (terrenos residenciais vagos dentro de loteamento registrado) | Cada condado publica de um jeito; começar pelos 4 do lado Dallas com mais unidades (Collin, Dallas, Denton, Rockwall) |
| 7 | Tamanho do terreno | Mesmo cadastro (tamanho dos terrenos vagos) | Idem |
| 8 | Terreno à venda na faixa de investimento | Anúncios de terrenos: coleta adiada por decisão sua. Enquanto isso, o valor de cadastro dos terrenos vagos pode servir de indicação, marcado como "valor de cadastro, não preço de anúncio" | Você decide se quer essa indicação ou se o parâmetro fica "sem dado" até haver anúncios |

## Parte 3 — Pesquisa por prefeitura (uma a uma, começando pelo lado Dallas)

| Ordem | Parâmetro | Onde está | Observação |
|--:|---|---|---|
| 9 | Taxas por casa | Tabela de taxas (fee schedule) e estudo de impact fee de cada prefeitura | Somar as taxas de uma casa-tipo; a casa-tipo é premissa a registrar |
| 10 | Prazo de aprovação | Relatórios de licenças da prefeitura, quando existem; senão, prazo declarado no site | Poucas cidades publicam o prazo real: esperar muitos "sem dado" e confiança baixa |
| 11 | Concorrência de grandes builders | Bases abertas de licenças de obra das prefeituras (nome do construtor por licença) | Só as cidades maiores publicam; nas demais fica "sem dado" |

Junto com a parte 3 entra a **moratória** das cidades que ainda não foram conferidas.

### Ordem das prefeituras

1. As cidades do lado Dallas que aparecem nas 50 primeiras do ranking: Allen, Frisco, Prosper, McKinney, Dallas, Rockwall,
   Lowry Crossing, Wylie, Celina, Melissa, Plano, Red Oak, Lavon, Northlake, Midlothian, Ferris, Heath, Fate, Princeton,
   Balch Springs, Rowlett, Justin, Denton.
2. As do lado Fort Worth nas 50 primeiras: Arlington, Mansfield, Fort Worth, Haslet.
3. Demais cidades do lado Dallas, por posição no ranking; depois as demais do lado Fort Worth.

## O que cada parte destrava

- Parte 1 completa: o ranking passa de 9 para até 14 de 20 parâmetros.
- Parte 2: até 16 ou 17.
- Parte 3: os 20, mas só nas cidades pesquisadas; as outras continuam com "sem dado" e cobertura menor, visível na coluna "Com dado".
