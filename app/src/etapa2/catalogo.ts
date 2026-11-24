// Catálogo fixo da etapa 2: itens da triagem, linhas de custo de aquisição, prazos e motivos de descarte.
// Os valores típicos NÃO ficam aqui: vêm da base (estimativas de referência, com fonte) ou do que o usuário informar.

export interface ItemTriagem { id: string; nome: string; /** uma frase */ explicacao: string; quem: string; /** depende de terceiros e pode não ter solução */ podeInviabilizar?: boolean; /** id da estimativa de referência do custo de resolver */ ref?: string }
export const ITENS_TRIAGEM: ItemTriagem[] = [
  { id: "zoneamento", nome: "Zoneamento permite a casa pretendida", explicacao: "A prefeitura define o que pode ser construído em cada lote; se o zoneamento não permitir a casa, é preciso pedir mudança, que pode ser negada.", quem: "Departamento de planejamento (planning and zoning) da prefeitura", podeInviabilizar: true, ref: "tri_zoneamento" },
  { id: "tamanho_minimo", nome: "Lote tem o tamanho mínimo", explicacao: "Cada zona exige área e largura mínimas de lote; abaixo disso é preciso pedir exceção (variance) ou refazer a divisão (replat).", quem: "Departamento de planejamento da prefeitura", ref: "tri_tamanho" },
  { id: "acesso", nome: "Acesso a via pública", explicacao: "O lote precisa ter frente para uma rua pública ou uma servidão de acesso registrada; sem isso não se consegue licença de obra.", quem: "Title company e surveyor (o survey mostra o acesso)", podeInviabilizar: true, ref: "tri_acesso" },
  { id: "agua_esgoto", nome: "Água e esgoto disponíveis (ou poço e fossa viáveis)", explicacao: "Sem rede pública na frente do lote, a casa depende de poço e fossa, que exigem área mínima, teste de solo e licença.", quem: "Concessionária ou prefeitura (rede); condado (licença de fossa)", ref: "tri_agua_esgoto" },
  { id: "alagamento", nome: "Zona de alagamento", explicacao: "Lote em zona de alagamento da FEMA exige construir acima da cota de enchente e costuma exigir seguro; no canal de escoamento (floodway), a regra federal só admite obra com estudo de engenharia que prove que ela não eleva o nível da enchente, e a prefeitura pode ser mais restritiva.", quem: "Mapa de enchente da FEMA e o floodplain administrator da cidade ou do condado", ref: "tri_alagamento" },
  { id: "restricoes", nome: "Restrições registradas (deed restrictions, HOA)", explicacao: "O loteamento pode impor regras registradas em cartório, como tamanho mínimo da casa, materiais e taxas de associação.", quem: "Title company (title commitment) e a associação de moradores", ref: "tri_restricoes" },
  { id: "servidoes", nome: "Servidões no lote", explicacao: "Faixas reservadas para redes, drenagem ou passagem reduzem a área onde se pode construir.", quem: "Surveyor e title company", ref: "tri_servidoes" },
  { id: "isencao_agricola", nome: "Isenção agrícola", explicacao: "Terra tributada pelo valor de produtividade gera cobrança retroativa de imposto (rollback) quando muda de uso.", quem: "Appraisal district do condado", ref: "rollback" },
  { id: "minerais", nome: "Poço de gás ou direitos minerais de terceiros", explicacao: "Poço de gás próximo impõe distância mínima para construir, e direitos minerais de terceiros podem dar acesso à superfície.", quem: "Railroad Commission of Texas (mapa de poços) e title company", ref: "tri_minerais" },
];
export const RESPOSTAS: { v: "ok" | "problema" | "nao_sei"; rotulo: string }[] = [{ v: "ok", rotulo: "Está ok" }, { v: "problema", rotulo: "Tem o problema" }, { v: "nao_sei", rotulo: "Não sei" }];

export interface LinhaCatalogo { id: string; nome: string; ajuda: string; /** como o valor é obtido quando o usuário não informa */ origem: "preco" | "oficial" | "referencia" | "usuario"; /** id da estimativa de referência */ ref?: string;
  /** adiantamento abatido do preço no fechamento: aparece, mas não soma ao total */ naoSoma?: boolean; /** só se aplica quando… */ quando?: "sem_rede" | "isencao_agricola" | "financiado" }
export const LINHAS: LinhaCatalogo[] = [
  { id: "preco", nome: "Preço do terreno", ajuda: "Usa o mais avançado que existir: preço fechado, minha oferta, preço anunciado ou custo de referência da região.", origem: "preco" },
  { id: "sinal", nome: "Sinal (earnest money)", ajuda: "Depósito feito na assinatura do contrato. É abatido do preço no fechamento, por isso não soma ao total.", origem: "usuario", ref: "sinal_pct", naoSoma: true },
  { id: "taxa_opcao", nome: "Taxa de opção", ajuda: "Paga ao vendedor pelo direito de desistir durante o período de opção. Costuma ser abatida do preço no fechamento; se você desistir, é perdida.", origem: "usuario", ref: "taxa_opcao", naoSoma: true },
  { id: "titulo", nome: "Seguro de título (owner's policy)", ajuda: "Prêmio único, definido por tabela do estado do Texas conforme o valor do terreno.", origem: "oficial" },
  { id: "fechamento", nome: "Taxa de fechamento da title company", ajuda: "Cobrada pela title company para conduzir o fechamento (escrow). Não é tabelada pelo estado.", origem: "referencia", ref: "fechamento_escrow" },
  { id: "registro", nome: "Registro da escritura", ajuda: "Taxa do cartório do condado (county clerk) para registrar a escritura.", origem: "referencia", ref: "registro_escritura" },
  { id: "survey", nome: "Survey do lote", ajuda: "Levantamento que confirma divisas, área, servidões e acesso.", origem: "referencia", ref: "survey" },
  { id: "solo", nome: "Laudo de solo", ajuda: "Sondagem que define o tipo de fundação; importante no solo argiloso da região.", origem: "referencia", ref: "laudo_solo" },
  { id: "fossa_teste", nome: "Avaliação do terreno para fossa", ajuda: "Exigida para licenciar fossa quando não há rede de esgoto.", origem: "referencia", ref: "fossa_avaliacao", quando: "sem_rede" },
  { id: "rollback", nome: "Cobrança retroativa de imposto", ajuda: "Devida quando a terra com isenção agrícola muda de uso. A fórmula está em conferência; por ora, informe o valor se já souber.", origem: "usuario", quando: "isencao_agricola" },
  { id: "financiamento", nome: "Custos do financiamento na contratação", ajuda: "Taxa de originação, avaliação e outros custos cobrados pelo banco ao contratar.", origem: "referencia", ref: "financiamento_contratacao", quando: "financiado" },
];
export interface PrazoCatalogo { id: string; nome: string; ref?: string }
export const PRAZOS: PrazoCatalogo[] = [{ id: "opcao", nome: "Período de opção", ref: "prazo_opcao" }, { id: "estudos", nome: "Estudos antes de fechar (survey, solo)", ref: "prazo_estudos" }, { id: "fechamento", nome: "Do fim dos estudos ao fechamento", ref: "prazo_fechamento" }];
export const MOTIVOS_DESCARTE = ["Preço alto demais", "Problema na triagem", "Vendedor desistiu ou vendeu a outro", "Localização", "Tamanho ou formato do lote", "Outro"];
export const AVISO_TRIAGEM = "Esta triagem organiza a verificação. Não substitui a title company, o surveyor nem um advogado no fechamento.";
