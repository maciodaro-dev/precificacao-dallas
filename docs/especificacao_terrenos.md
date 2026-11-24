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
d) forma e tamanho: lote menor… — **a mensagem do usuário chegou cortada aqui; falta o resto do passo d) e o que vier depois.**

## 4. Pontos em aberto

- Completar o passo d) da limpeza (mensagem cortada).
- O arquivo estadual do TxGIO (inclusive o de 2025) devolve HTTP 403 a partir deste ambiente: precisa ser baixado pelo usuário ou liberado de outra forma.

- Com "lote pronto = indiferente", qual dos dois totais entra na nota (proposta: o menor dos dois, mostrando ambos).
- Fonte: o arquivo estadual (TxGIO) recusou download automático; o campo de valor da terra dele não distingue mercado de produtividade.
  Os cadastros dos condados costumam trazer os dois; depende do levantamento por condado.
