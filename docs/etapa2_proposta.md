# Etapa 2 — Aquisição do terreno: proposta para aprovação

Nada foi construído. Este documento mostra o esquema de dados, as telas e a lista de valores típicos a levantar, com a fonte de cada um.
Regras que continuam valendo: valor bruto com fonte, data e confiança; nada estimado sem marca; sem fonte, o campo fica vazio e vai para as pendências;
dado informado pelo usuário é privado do projeto; a triagem só avisa, nunca impede de avançar.

## 1. Esquema de dados

O que já existe no projeto e será aproveitado: `Terreno`, `ItemDiligencia`, `LinhaCusto` (mínimo, provável, máximo, realizado, data, fonte, premissa) e `Marco` (prazos).
O que muda ou entra:

### Terreno (candidato) — campos novos
| Campo | Conteúdo | Origem |
|---|---|---|
| `identificacao` | endereço e/ou número do lote no cadastro do condado, e o condado | usuário |
| `regiao_id`, `parte_id` | região da etapa 1 e a parte (cidade × ISD) onde o lote cai; vazio quando o lote está fora das regiões cadastradas | base |
| `herdado` | tamanho, valor de cadastro da terra, dentro ou fora de cidade, ISD, % em zona de alagamento, isenção agrícola, loteamento | cadastro do condado e base da etapa 1 |
| `informado` | os mesmos campos quando o usuário corrige; cada um com data e a marca "informado por mim" | usuário |
| `preco_anunciado`, `link_anuncio`, `observacoes` | o que o usuário viu no anúncio | usuário (privado) |
| `oferta`, `preco_fechado` | minha oferta e preço fechado, com data | usuário (privado) |
| `pagamento` | à vista ou financiado; se financiado: valor financiado ou entrada, taxa de juros anual, nº de parcelas | usuário |
| `triagem` | uma resposta por item (ver abaixo) | base + usuário |
| `status` | candidato, escolhido ou descartado | usuário |

O preço usado no cálculo é o mais avançado que existir, nesta ordem: preço fechado, minha oferta, preço anunciado, custo de referência da região. A tela sempre diz qual está em uso.

### Item de triagem (9 itens por terreno)
| Campo | Conteúdo |
|---|---|
| `item` | zoneamento permite a casa; tamanho mínimo do lote; acesso a via pública; água e esgoto (ou poço e fossa viáveis); zona de alagamento; restrições registradas (deed restrictions, HOA); servidões; isenção agrícola; poço de gás ou direitos minerais de terceiros |
| `resposta` | está ok, tem o problema, não sei |
| `origem` | "base" (com fonte e data) ou "informado por mim" |
| `explicacao`, `quem_consultar` | texto fixo do catálogo de itens |
| `custo_resolver` | mínimo, provável, máximo, com fonte e premissa; vazio quando não há fonte |
| `prazo_extra_dias` | mínimo, provável, máximo |
| `pode_inviabilizar` | sim nos itens que dependem de terceiros e podem não ter solução (zoneamento, acesso) |

### Linhas de custo da etapa 2 (uma `LinhaCusto` por linha, por terreno)
Preço do terreno; sinal e taxa de opção; fechamento do comprador (title, escritura, registro); estudos antes de fechar (survey, laudo de solo, teste para fossa);
cobrança retroativa de imposto; custos do financiamento na contratação; uma linha de risco por item de triagem com "tem o problema".
Cada linha tem a categoria "aquisição", "risco confirmado" ou "exposição não verificada".

### Resultados calculados por terreno (não gravados; recalculados)
- custo de aquisição (soma das linhas de aquisição, em faixa);
- custo de risco confirmado (itens com "tem o problema");
- exposição não verificada (itens com "não sei": entra só no máximo);
- custo com risco = aquisição + confirmado, com a faixa até o máximo;
- custo por casa; resultado da triagem ("segue", "segue com condições", "atenção: pode inviabilizar"); nº de itens não verificados;
- financiamento: parcela, total de juros do contrato e saldo devedor mês a mês. Os juros pagos durante o projeto não entram aqui: seguem para a etapa 6.

### O que segue para as outras etapas
- Etapa 3 e 4: tamanho, zoneamento, situação de água e esgoto, zona de alagamento, respostas da triagem.
- Etapa 6: prazo total da etapa e o financiamento (saldo e juros por mês).
- Etapa 8: custo de aquisição e custo com risco, total e por casa.

## 2. Telas propostas

1. **Entrada da etapa**: região escolhida na etapa 1, com o custo de referência e os preços anunciados já registrados. Aviso fixo:
   "Esta triagem organiza a verificação. Não substitui a title company, o surveyor nem um advogado no fechamento."
   Quem já tem o terreno cai direto no cadastro de um terreno só (preço pago, data, valor atual) e segue para a triagem.
2. **Candidatos (lista)**: de 1 a 10. Colunas: preço em uso, custo de aquisição, custo com risco, custo por casa, resultado da triagem, itens não verificados.
   Ordem padrão pelo custo com risco. Botões: adicionar, comparar (até 4), marcar como escolhido.
3. **Cadastro do candidato**: endereço ou número do lote; o que a base tem vem preenchido, com a fonte, e pode ser corrigido; campos do anúncio.
   Lote fora das regiões cadastradas: aceito, com o aviso de que não herda dados.
4. **Triagem**: no modo guiado, um item por tela, com a explicação, quem consultar e as três respostas. No modo especialista, os nove itens numa tabela, com custo e prazo editáveis.
5. **Custos de aquisição**: no guiado, os valores típicos já preenchidos e marcados como estimativa; no especialista, todas as linhas com faixa, previsto e realizado.
6. **Forma de pagamento**: à vista ou financiado; parcela, total de juros e saldo mês a mês; comparação do mesmo terreno nas duas formas.
7. **Prazo**: período de opção, estudos, fechamento e prazos extras da triagem.
8. **Comparação lado a lado** (até 4 candidatos).
9. **Resumo da etapa**: custo de aquisição e custo com risco, total e por casa; quanto do custo vem de problemas confirmados e quanto está em aberto;
   o que verificar primeiro (maior exposição no topo); lista de verificação; exportar a comparação em .xlsx.
   No guiado, a frase: "este terreno custa X; se os problemas apontados se confirmarem, pode chegar a Y".

A marca "pode inviabilizar" aparece ao lado do total em todas as telas que mostram total.

## 3. Valores típicos a levantar

Nenhum número abaixo foi levantado ainda. A coluna "situação" diz o que espero encontrar; onde não houver fonte, o campo fica vazio e vai para as pendências.

### Custos de aquisição
| Valor | Fonte proposta | Situação esperada |
|---|---|---|
| Prêmio do seguro de título (owner's policy) | Texas Department of Insurance, tabela oficial de prêmios de title insurance (tarifa única no estado, por faixa de valor) | Fonte oficial; calculável a partir do preço |
| Taxas de registro da escritura | Tabela de taxas do cartório de cada condado (county clerk) | Fonte oficial, uma por condado (11) |
| Taxa de fechamento da title company (escrow/settlement) | Não há tabela oficial; depende de cotação | Sem fonte pública: fica vazio até haver cotações |
| Survey do lote | Não há tabela oficial | Sem fonte pública: cotações |
| Laudo de solo (geotécnico) | Não há tabela oficial | Sem fonte pública: cotações |
| Avaliação do terreno para fossa e licença de fossa (OSSF) | Licença: tabela de taxas do condado ou da cidade. Avaliação do terreno: cotação | Licença com fonte oficial; avaliação sem fonte pública |
| Cobrança retroativa de imposto (rollback) | Texas Tax Code, seção 23.55, e os valores de mercado e de produtividade do cadastro; alíquota oficial da etapa 1 | Calculável por lote onde o cadastro traz os dois valores. A regra atual (número de anos e juros) precisa ser conferida no texto da lei |
| Sinal (earnest money) e taxa de opção | Formulários de contrato da Texas Real Estate Commission definem o mecanismo; o valor é negociado | Sem valor oficial: campo do usuário |
| Custos do financiamento na contratação (originação, avaliação) | Não há tabela oficial; depende do banco | Sem fonte pública: cotações |
| Taxa de juros de financiamento de terreno | Não há série pública específica para terreno | Sem fonte pública: campo do usuário |

### Custo e prazo de resolver cada item da triagem
| Item | O que levantar | Fonte proposta | Situação esperada |
|---|---|---|---|
| Zoneamento não permite | Taxa e prazo do pedido de mudança de zoneamento ou de variance | Tabela de taxas e calendário de cada prefeitura | Fonte oficial por cidade; entra na pesquisa por prefeitura já planejada |
| Lote abaixo do mínimo | Taxa e prazo de variance ou de replat | Idem | Idem |
| Sem acesso a via pública | Custo de obter servidão de acesso | Não há fonte pública | Vazio; marca "pode inviabilizar" |
| Sem rede de água e esgoto | Custo de poço e de fossa; taxa de ligação à rede quando houver | Poço e fossa: cotações. Taxa de ligação: tabela da concessionária ou da prefeitura | Parte com fonte oficial, parte sem |
| Zona de alagamento | Certificado de elevação, pedido de revisão de mapa (LOMA/LOMR-F) e prêmio de seguro de enchente | FEMA (tabela de taxas dos pedidos de revisão); certificado e seguro por cotação | Taxas da FEMA com fonte oficial; o resto sem |
| Restrições registradas e HOA | Taxas da associação; custo de consulta jurídica | Documentos da associação; cotação | Caso a caso; campo do usuário |
| Servidões no lote | Custo de realocar ou liberar | Não há fonte pública | Vazio |
| Isenção agrícola | Mesma conta da cobrança retroativa, acima | Lei e cadastro | Calculável |
| Poço de gás ou direitos minerais | Distância mínima exigida entre poço e casa; custo de acordo de uso da superfície | Código de cada prefeitura (distâncias); Railroad Commission of Texas (localização dos poços) | Localização e distâncias com fonte oficial; custo do acordo sem fonte |

### Prazos
| Prazo | Fonte proposta | Situação esperada |
|---|---|---|
| Período de opção e prazo até o fechamento | Não há valor oficial; é negociado no contrato | Campo do usuário, com o típico registrado como premissa só se houver fonte |
| Mudança de zoneamento, variance, replat | Calendário de cada prefeitura | Fonte oficial por cidade |
| Revisão de mapa da FEMA | FEMA | Fonte oficial |

## 4. O que a base consegue responder sozinha na triagem
- Dentro ou fora de cidade, ISD, % da área em zona de alagamento (onde a coleta da FEMA cobriu), isenção agrícola e loteamento: sim, pelo cadastro e pela etapa 1.
- Zoneamento e lote mínimo: só nas cidades já pesquisadas; hoje, quase nenhuma.
- Acesso a via pública, servidões, restrições registradas, direitos minerais: a base não sabe; vêm como "não sei".

## 5. Dependências e pontos a decidir
1. O preenchimento automático por número do lote depende do cadastro dos condados, que hoje está completo só em parte (Dallas com arquivo próprio; Collin, Denton, Tarrant e Johnson por serviço; os demais com lacunas).
2. O custo de referência da região ainda não existe: enquanto não houver, o preço em uso começa pelo preço anunciado ou fica vazio.
3. Várias linhas não têm fonte pública (survey, laudo de solo, taxa de fechamento, poço, fossa). Decidir: ficam vazias até o usuário informar, ou aceitam-se cotações coletadas pelo usuário como fonte, com data.
4. Ordem de construção sugerida: (a) candidatos, triagem e pilha de custo com campos do usuário; (b) valores com fonte oficial (title insurance, registro, rollback, FEMA); (c) preenchimento automático pelo cadastro; (d) taxas por prefeitura.
