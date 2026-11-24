# Terrenos vagos e custo de referência do terreno — especificação do usuário (2026-11-24)

Registro das instruções do usuário para a parte de terra da etapa 1. Nada aqui está implementado ainda: depende do levantamento
do cadastro dos condados (em andamento) e da aprovação do usuário sobre os códigos de lote vago e o critério de recorte.

## 1. Terrenos vagos

- Universo: todo terreno vago existente no cadastro dos appraisal districts (um dono pode vender ao receber proposta, mesmo sem anunciar).
- Nome do dado nas telas: "terrenos vagos". Não usar "à venda", "anunciado", "preço" nem "preço pedido" em nenhuma tela.
- Não construir agora importação de planilha do MLS nem comparação com preço pedido. Só não bloquear isso no esquema de dados.
- Antes de usar, mostrar ao usuário, por condado: código que identifica lote vago, quantos lotes vagos existem, data do arquivo
  e o que ficou de fora (terra agrícola, lotes de construtoras, áreas comuns, lotes públicos).
- Usar os lotes para desenhar regiões dentro das cidades (o resultado da etapa 1 é região, não cidade inteira). Propor o critério
  de recorte (setor censitário, ZIP ou agrupamento por proximidade) com exemplo em duas cidades antes de aplicar em tudo.
- Por região: nº de terrenos vagos e distribuição por tamanho, usando as faixas de tamanho já definidas.
- O parâmetro "terreno à venda na faixa de investimento" passa a se chamar "terrenos vagos no tamanho procurado" e pontua pela
  quantidade de lotes vagos na faixa de tamanho do projeto.
- Região sem nenhum terreno vago no tamanho procurado não entra nas recomendadas; aparece em lista separada,
  "sem terreno vago no tamanho procurado".

## 2. Custo de referência do terreno por região

A faixa de investimento volta a entrar na nota, comparada a um custo de referência calculado só com dado público.

- Fonte: valor de mercado da terra no cadastro, apenas lotes vagos. Em lotes com isenção agrícola, usar o valor de mercado,
  nunca o valor de produtividade. Mostrar quantos lotes têm os dois valores.
- Cálculo por região e por faixa de tamanho: mediana do valor de cadastro por sqft, com percentis 25 e 75. Não usar média.
- Custo de referência de um terreno = valor por sqft da região na faixa de tamanho do projeto × tamanho alvo × fator de ajuste da região.
- Fator de ajuste: começa em 1,0 em todas as regiões; editável pelo usuário, com data, fonte e justificativa de cada alteração
  (proposta feita, cotação, compra). Dado privado do projeto; não vai para a base pública. Enquanto o fator for 1,0, mostrar:
  "valor de cadastro, sem ajuste; costuma ficar abaixo do que se paga".
- Exibir sempre como intervalo (percentil 25 ao 75), com o nome "custo de referência do terreno". Não chamar de preço nem de valor de venda.
- Nota do parâmetro: cheia quando o intervalo da região cabe na faixa de investimento escolhida, caindo conforme se afasta.
  Região com menos de 10 lotes vagos na faixa de tamanho: sem dado, não pontua.
- O custo de referência da região escolhida segue para a etapa 2 como valor previsto da compra.
- Atualização duas vezes por ano, acompanhando o calendário dos appraisal districts (valores preliminares e certificados).
  Registrar a data de referência de cada condado e sinalizar o que tiver mais de 6 meses.
- Alerta por evento: campo por região para registrar fato que muda o valor da terra (obra viária, extensão de rede, mudança de
  zoneamento, moratória), com data e fonte. Região com evento registrado depois da última atualização aparece com o aviso
  "valor pode estar desatualizado".

## 3. Respostas do usuário (2026-11-24)

### Tamanho alvo
- Ponto médio da faixa de tamanho escolhida, com campo para o usuário trocar.
- Faixa "mais de 20 acres": não tem ponto médio; o campo é obrigatório.
- Valor digitado fora da faixa marcada: avisar e perguntar se quer trocar a faixa. Não aceitar em silêncio.
- Mostrar ao lado do custo de referência qual tamanho foi usado na conta.

### Mais de uma casa
A faixa de investimento é comparada com o custo total de terra do projeto. O total depende de como a terra é comprada:
- Lote pronto = sim: total = custo de referência de um lote (na faixa de tamanho do lote) × nº de casas.
- Lote pronto = não (gleba para dividir): total = custo de referência de uma gleba só.
  Tamanho da gleba = nº de casas × tamanho alvo do lote ÷ 0,70 (30% de perda com rua, drenagem e recuos; premissa editável).
  Usar o valor por sqft da faixa de tamanho da GLEBA, não o do lote.
- Lote pronto = indiferente: calcular os dois e mostrar lado a lado.
- "Em sequência" não muda a conta: a terra é comprada de uma vez.
- Mostrar sempre o total e o custo de terra por casa (total ÷ nº de casas). O custo por casa é o que alimenta o "peso do terreno no preço".
- O custo de lotear não entra aqui; continua na etapa 4. Deixar isso escrito na tela, para a gleba não parecer mais barata do que é.

### Dallas County
- O usuário vai tentar baixar os arquivos do DCAD pelo navegador; quando chegarem, substituem as outras fontes.
- Enquanto isso: camada da Prefeitura de Dallas (2026) onde ela cobre; no restante do condado, o arquivo estadual de 2025 baixado direto do TxGIO.
  Não usar cópia publicada por terceiro. Marcar em cada lote a fonte e o ano, e sinalizar na tela as regiões de Dallas County com dado de 2025.

### Limpeza do código "lote vago" (aprovada)
Filtrar nesta ordem, mostrando por condado quantos lotes saem em cada passo e uma amostra de 20 lotes removidos por passo:
a) dono: associação de moradores/HOA, prefeitura, condado, estado, distrito escolar, distrito de água (MUD/PID), concessionária, igreja;
b) isenção total de imposto;
c) descrição: common area, open space, greenbelt, drainage, detention, easement, right of way, park, amenity e equivalentes;
d) forma e tamanho: sai o lote pequeno demais ou estreito demais para construir. Corte inicial proposto pelo usuário: área menor que 3.000 sqft
   (a menor opção de lote mínimo da ferramenta) ou largura menor que 25 pés. É premissa: antes de aplicar, mostrar a distribuição de área dos lotes
   restantes e quantos saem com esse corte e com 2.500 e 4.000 sqft;
e) valor: só o extremo, depois do d). Mostrar quantos dos lotes de até US$ 1.000 ainda restam e uma amostra de 20; o usuário define o corte.
   Não usar valor baixo como filtro geral: lote barato legítimo existe e interessa à faixa de investimento menor.

Depois dos filtros:
- Nada é apagado da base: cada lote filtrado fica marcado com o motivo.
- Estoque de construtora: identificar por nome do dono e por concentração (muitos lotes do mesmo dono no mesmo loteamento). Não remover: marcar e contar
  separado em cada região. O custo de referência usa só os lotes que não são de construtora. Mostrar quanto há em Grand Prairie.
- Amostra inversa: 20 lotes mantidos, ao acaso, para o usuário conferir se o que sobrou é terreno comprável.
- Passos a), b) e c) em Dallas aprovados, condicionados à conferência da amostra em docs/limpeza_lotes_dallas.md. Os lotes sem localização ficam listados e fora das regiões.

### "Park" e "row" no passo c)
Tirar as palavras soltas. Manter só as formas inequívocas: "right of way", "R.O.W.", "R O W", "city park", "pocket park", "park site", "parkland", "park dedication".

### Lotes isentos em nome de construtora
Saem, com motivo próprio ("isento em nome de construtora"). Antes, dizer qual é o tipo de isenção e mostrar 20 exemplos.

### C14 (rural vago com menos de 5 acres)
Entra como categoria separada, "terreno vago rural": passa pela mesma limpeza, conta nas faixas de tamanho e aparece marcado (costuma ficar fora da cidade
e sem rede de água e esgoto). Usar valor de mercado, nunca o de produtividade.

### Glebas acima de 5 acres
Dizer quais códigos cobrem terra rural e agrícola acima de 5 acres e quantos lotes existem por faixa (5 a 20 acres, mais de 20), por condado.
Não incluir ainda: o usuário decide depois de ver o número (sem elas, as duas maiores faixas de tamanho ficam vazias).

### Arquivo de 2027
Entra depois da limpeza aprovada, para conferir o dono atual e tirar o lote que já recebeu construção.

### Recorte: setor censitário aprovado como bloco de base, com quatro condições
- Região = setor censitário cortado pelos limites de cidade e de ISD (regras, taxas e escola vêm deles). Pedaços muito pequenos são unidos ao vizinho da mesma cidade e ISD.
- Nas franjas, onde o setor é muito grande, propor como subdividir.
- Cada região ganha um nome que uma pessoa reconheça (cidade + bairro ou via de referência), não o número do setor.
- Renda por setor tem margem de erro alta: marcar a confiança.
- Continua valendo: mostrar o exemplo em duas cidades antes de aplicar.

## 3b. Decisões do usuário (2026-11-24, segunda rodada)

### Recorte das regiões
a) Pedaço pequeno: menos de 80 acres. A regra dos 10% só vale quando o pedaço também tiver menos de 320 acres. Sem vizinho da mesma cidade e ISD, o pedaço
   não é unido a ninguém: fica como região própria marcada "fatia pequena", oculta por padrão.
b) Franja: limite de 2.500 acres, cortando por vias principais (rodovias, tollways, FM roads) e barreiras naturais (rios, lagos, ferrovias), nunca por grade e
   nunca dividindo um loteamento. Alvo de 640 a 2.500 acres por região. Não cortar região com menos de 50 terrenos vagos. Grade só onde não houver via que
   sirva, com a região marcada.
c) Renda: confiança baixa quando a margem de erro passar de 20%. Região que é pedaço de um setor mostra "renda do setor inteiro". Informar quantas regiões
   ficam com confiança baixa.
d) Regiões sem terreno vago vão para a lista separada.
Refazer o exemplo das duas cidades com essas regras e mostrar o mapa antes de aplicar no restante.

### Nome das regiões
- Pode baixar o cadastro completo; guardá-lo (servirá depois para valor de casas construídas).
- Cidade + loteamento mais comum entre TODOS os lotes da região; sem loteamento claro, cidade + via principal; por último, cidade + posição.
- Nome repetido na mesma cidade é desempatado por posição ("norte", "sul"), nunca por "(2)".
- Descartar nomes de proprietário ou genéricos ("City Of", "Unplatted", "Abstract").
- **Nome de proprietário nunca aparece em tela nem em exportação.**

### Passo d) — forma e tamanho
Corte: área menor que 3.000 sqft, ou largura menor que 25 pés. Lotes entre 3.000 e 4.000 sqft ficam, marcados "lote pequeno".

### Passo e) — valor
Corte em valor de terra de até US$ 1.000, desde que na amostra de 20 pelo menos 18 sejam claramente não construíveis. Se não, não aplicar e mostrar os que parecem terreno de verdade.

### Dono concentrado
- "Grand Prairie Strata": não classificar como construtora ainda. Marcar "dono concentrado": conta separado e fica fora do custo de referência, como o estoque de construtora.
  Mostrar tamanho e valor típicos, loteamento, desde quando o dono é o mesmo e onde ficam no mapa.
- Regra geral: qualquer dono com mais de 50 lotes vagos no mesmo condado recebe a marca e entra numa lista para revisão do usuário.

### Glebas acima de 5 acres
Entram em três categorias separadas, nunca somadas aos lotes: "gleba residencial vaga", "gleba agrícola" (D1/D10) e "gleba rural" (E/E4).
- Só entra parcela com valor de benfeitoria zero (mostrar quanto o número cai em Collin).
- Mesma limpeza de dono, isenção e descrição.
- Gleba agrícola: sempre valor de mercado, nunca o de produtividade; marcar e mostrar o aviso de rollback tax.
- Contam só nas faixas de 5 acres para cima e só aparecem quando o projeto pede esse tamanho. Custo de referência à parte, por categoria e por faixa.
- Conferir Tarrant (2.570 vagos residenciais de 5 a 20 acres): mostrar 20 exemplos e o que o código inclui lá.
- Completar a contagem em Johnson, Kaufman, Rockwall, Hunt, Ellis, Parker e Wise.

## 4. Pontos em aberto

- O arquivo estadual do TxGIO (inclusive o de 2025) devolve HTTP 403 a partir deste ambiente: precisa ser baixado pelo usuário ou liberado de outra forma.

- Com "lote pronto = indiferente", qual dos dois totais entra na nota (proposta: o menor dos dois, mostrando ambos).
- Fonte: o arquivo estadual (TxGIO) recusou download automático; o campo de valor da terra dele não distingue mercado de produtividade.
  Os cadastros dos condados costumam trazer os dois; depende do levantamento por condado.
