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

## 3. Pontos em aberto (a confirmar com o usuário)

- Tamanho alvo: hoje o projeto guarda uma faixa de tamanho, não um número. Proposta: usar o ponto médio da faixa escolhida, editável.
- Vários lotes: com mais de uma casa, comparar com a faixa de investimento o custo de um lote ou o custo de todos os lotes do projeto.
- Fonte: o arquivo estadual (TxGIO) recusou download automático; o campo de valor da terra dele não distingue mercado de produtividade.
  Os cadastros dos condados costumam trazer os dois; depende do levantamento por condado.
