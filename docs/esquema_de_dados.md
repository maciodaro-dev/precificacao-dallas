# Esquema de dados das 8 etapas

Os tipos correspondentes estão em `app/src/tipos.ts`. Critérios por faixa, métricas auxiliares e contexto usam a chave `criterio|metrica|faixa`.


Princípio: uma base única em arquivos versionados (`data/`), separada do código. As telas não guardam cópia: leem da base por ID. Dois tipos de dado:
- **Base de referência** (igual para todos os projetos): unidades, indicadores, fontes.
- **Dados de projeto** (o que você cria): projetos, terrenos, casas, linhas de custo, cronograma, premissas.

### 3.1 Entidades e chaves

| Entidade | Chave | Campos principais | Referencia |
|---|---|---|---|
| `unidade` | `unidade_id` | nome, tipo (cidade×ISD / ETJ), place_geoid, isd_id, condado predominante, condados (%), área terra/água, geometria (GeoJSON), coberta_sb15 | `isd`, `condado` |
| `isd` | `isd_id` (GEOID) | nome, nota TEA (letra e 0–100), ano da nota | — |
| `condado` | `fips` | nome, appraisal district | — |
| `jurisdicao_fiscal` | `jur_id` | tipo (condado, cidade, ISD, MUD, PID, college, hospital), alíquota por $100, ano | `unidade` (N:N) |
| `criterio` | `criterio_id` (c01…c26) | nome, grupo, unidade de medida, direção padrão, depende_da_faixa (s/n), correlacionado (s/n), fonte planejada | — |
| `indicador` | `unidade_id + criterio_id + faixa_id?` | **valor_bruto, unidade_medida**, valores auxiliares (mediana, mín, máx, n), fonte_id, url, data_referencia, data_coleta, confiança (alta/média/baixa/sem dado), editado_manualmente, data_edição, valor_original | `unidade`, `criterio`, `fonte` |
| `fonte` | `fonte_id` | nome, órgão, url, script de atualização, periodicidade, última execução | — |
| `faixa` | `faixa_id` (F1…F4) | mín, máx em US$ | — |
| `perfil_estrategia` | `perfil_id` | nome, pesos por critério, editável | `criterio` |
| `projeto` | `projeto_id` | nome, faixa_id, pesos, perfil de origem, direção do critério 2 (+ faixa-alvo), filtros eliminatórios, unidade_eleita_id, margem alvo, taxa de juros, datas | `faixa`, `unidade` |
| `terreno` | `terreno_id` | projeto_id, unidade_id, endereço/parcel ID, acres, preço pedido, isd/MUD/PID próprios (para ETJ), isenção agrícola (s/n), status (candidato/eleito/descartado) | `projeto`, `unidade` |
| `casa` | `casa_id` | projeto_id, terreno_id, sqft, padrão de acabamento, quartos/banhos, tipo de fundação | `projeto`, `terreno` |
| `linha_custo` | `linha_id` | projeto_id, casa_id (ou rateio), etapa (2–7), categoria, descrição, **previsto (mín / provável / máx)**, **realizado**, **data**, **fonte**, fórmula opcional (ex.: % do preço, $/sqft × sqft), premissa_id | `projeto`, `casa`, `premissa` |
| `marco_cronograma` | `marco_id` | projeto_id, etapa, descrição, duração prevista (mín/provável/máx, dias), início e fim realizados, origem (herdado da unidade / manual) | `projeto` |
| `premissa` | `premissa_id` | descrição, valor, unidade, autor, data, justificativa, onde é usada | — |
| `pendencia` | `unidade_id + criterio_id` | motivo (não encontrado / fonte paga / exige leitura manual), responsável, data | `indicador` |
| `venda_referencia` | `venda_id` | endereço, unidade_id, sqft, lote, data e preço de venda, builder, fonte (para o teste da etapa 8) | `unidade` |
| `log_alteracao` | sequencial | entidade, chave, campo, valor antigo, valor novo, data, autor | todas |

Regras embutidas:
- Nota 0–100 **não é gravada**: é calculada a partir do valor bruto, da direção e do conjunto de unidades que passou nos filtros. Só o valor bruto com unidade fica na base.
- Critérios que dependem da faixa (3 e 12, e o 13 por consequência) têm um registro por faixa.
- Valor com `data_referencia` > 6 meses aparece como desatualizado.
- Valor ausente = `null` + confiança "sem dado" + linha em `pendencia`. Unidade com critério sem dado é ranqueada com o peso redistribuído e um selo de cobertura (ex.: "18 de 26 critérios").
- Edição manual preserva `valor_original` e grava data; tudo vai para `log_alteracao`.

### 3.2 O que cada etapa lê e grava

| Etapa | Lê | Grava |
|---|---|---|
| 1 Território | `unidade`, `indicador`, `criterio`, `faixa`, `perfil_estrategia` | `projeto` (faixa, pesos, filtros, estratégia, unidade eleita); edições em `indicador` |
| 2 Aquisição | `projeto.unidade_eleita`; da unidade: preço da terra (c01), alíquotas (c24), FEMA; `premissa` | `terreno`; `linha_custo` etapa 2 (preço, closing, title, survey, due diligence, rollback tax); marcos de due diligence e fechamento |
| 3 Aprovações e projeto | da unidade: zoneamento e lote mínimo (c06), taxas por casa (c07), prazo de aprovação (c08), água/esgoto (c09); `terreno` | `casa` (nº de casas, sqft); `linha_custo` etapa 3 (platting, engenharia, arquitetura, permits, impact fees); marcos de aprovação |
| 4 Preparação do lote | custo de lotear (c10), água/esgoto (c09), FEMA; `terreno`, `casa` | `linha_custo` etapa 4; marcos de obra de infraestrutura |
| 5 Construção | `casa` (sqft, padrão, fundação); `premissa` ($/sqft por padrão) | `linha_custo` etapa 5 (incl. contingência); marcos de obra |
| 6 Carregamento | `marco_cronograma` (todas as durações), dias no mercado da unidade (c14), alíquota (c24), seguro (c26), soma das `linha_custo` 2–5, juros do projeto | `linha_custo` etapa 6 (juros, imposto, seguro, overhead) — calculadas por fórmula, recalculam quando prazo ou custo muda |
| 7 Venda e entrega | preço de mercado da unidade ($/sqft, c16), dias no mercado (c14); `casa` | `linha_custo` etapa 7 (comissão, closing do vendedor, concessões, garantia, marketing) |
| 8 Preço final | todas as `linha_custo`, margem alvo do projeto, $/sqft de mercado da unidade, `venda_referencia` | nada de novo: mostra preço por custo (mín/provável/máx) × preço de mercado, diferença, margem resultante, sensibilidade; grava só o resultado do teste contra vendas reais |

Prazos como custo: `marco_cronograma` das etapas 2–5 + prazo de aprovação herdado (c08) + dias no mercado herdados (c14) = meses de carregamento da etapa 6.

