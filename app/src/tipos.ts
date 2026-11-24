// Esquema de dados das 8 etapas. A base de referência (unidades, critérios, indicadores) vem de data/ via base.json.
// Os dados de projeto (abaixo de "Projeto") são gravados pelo usuário e referenciam a base só por ID.

export type Confianca = "alta" | "media" | "baixa" | "sem_dado";
export type Direcao = "maior" | "menor" | "configuravel";

/** Parte de uma região: o pedaço da cidade (ou da área fora de cidade do condado) que cai num distrito escolar. */
export interface ParteInfo { parte_id: string; isd_id: string; isd_nome: string; acres: number; pct_area: number | null; pct_domicilios: number | null; /** pequena demais para a região "atender" à nota de escola só por ela */ pequena: boolean }
/** Unidade do ranking = região: a cidade inteira, ou a área fora de cidade de um condado. O ISD só divide a região na pergunta da escola. */
export interface Unidade {
  /** partes da região por distrito escolar */ partes?: ParteInfo[]; /** só nas partes: região a que pertence */ regiao_id?: string;
  unidade_id: string; nome: string; tipo: "cidade_isd" | "nao_incorporado"; cidade: string; place_geoid: string;
  isd_id: string; isd_nome: string; condado: string; condado_fips: string; condados_pct: string; /** lado da área metropolitana; só recorta a exibição */ lado?: "dallas" | "fort_worth";
  acres_terra: number; /** parcela da área da cidade que esta unidade representa */ pct_cidade: number | null; /** parcela dos domicílios da cidade (setores censitários), quando calculada */ pct_domicilios?: number | null; /** fatia pequena: oculta por padrão na exibição, nunca excluída da base */ fatia_pequena?: boolean; lat: number; lon: number; fonte: string;
}
export interface Criterio {
  id: string; grupo: string; nome: string; metrica: string; unidade_medida: string; direcao: Direcao;
  fonte_planejada: string; cobertura: string; aux?: string[]; por_faixa?: boolean; correlacionado?: boolean;
}
/** Valor bruto com unidade. A nota 0–100 nunca é gravada: é calculada a partir daqui. */
export interface Indicador {
  v: number | string | null; um: string; f: string; url: string; ref: string; col: string; conf: Confianca; obs: string; /** "cidade" = o dado é da cidade inteira e a unidade é só uma fatia dela */ esc?: "cidade" | "fatia";
  editado?: boolean; data_edicao?: string; original?: number | string | null;
}
export interface Faixa { id: string; nome: string; min: number; /** null = faixa aberta ("mais de X") */ max: number | null }
export interface Fonte { id: string; nome: string; orgao: string; url: string; script: string; periodicidade: string; situacao: string; obs: string;
  licenca?: string; uso_comercial?: string; redistribuicao?: string; termos_url?: string; verificacao?: string; criterios?: string; alternativa?: string }
export interface Premissa { premissa_id: string; descricao: string; valor: string; unidade: string; autor: string; data: string; justificativa: string; usada_em: string }
/** Estimativa de referência de um custo sem fonte oficial: faixa publicada por guias do setor, empresas ou associações. Nunca é valor oficial. */
export interface Referencia { id: string; nome: string; min: number | null; provavel: number | null; max: number | null; unidade: string; confianca: "baixa" | "media"; geografia: string; data: string; fontes: { nome: string; url: string; data: string; min?: number | null; max?: number | null; tipico?: number | null; obs?: string }[]; obs?: string; /** como o "provável" foi obtido */ regra?: string; /** etapa a que o custo pertence */ etapa?: number; provisorio?: boolean }
export interface Base { /** estimativas de referência da etapa 2 (data/referencias_etapa2.json) */ referencias?: Referencia[];
  gerado_em: string; unidades: Unidade[]; /** partes (cidade × ISD) de cada região; usadas no mapa, na pergunta da escola e no fluxo "já tenho o terreno" */ partes?: Unidade[]; criterios: Criterio[]; indicadores: Record<string, Record<string, Indicador>>;
  faixas: Faixa[]; fontes: Fonte[]; premissas: Premissa[];
}

export type Peso = "baixo" | "medio" | "alto";
/** Um parâmetro do motor da etapa 1. alvo null = indiferente / não se aplica. origem = pergunta do modo leigo que o deduziu, "manual" ou "perfil:<nome>". */
export interface ParamResp { alvo: { valor?: string; min?: number; max?: number; /** opção aberta: aceita qualquer valor */ qualquer?: boolean } | null; peso: Peso; origem: string; ajustado?: boolean }
export interface RespostasLeigo { /** a faixa de investimento já foi escolhida na pergunta 1 */ faixa_ok?: boolean; casas?: "1" | "2a4" | "5a10" | "mais10"; construcao?: "simultaneo" | "sequencia"; preco?: number; vender_rapido?: boolean; valorizacao?: boolean; comecar_logo?: boolean; agua_esgoto?: boolean; escola?: boolean }
/** Combinação do modo expert salva com nome, para reutilizar em outros projetos. Dado privado do dono. */
export interface ValoresAbertos { investimento?: number; preco_venda?: number; tamanho_acres?: number }
export interface PerfilSalvo { valores_abertos?: ValoresAbertos; exigencia?: number; perfil_id: string; dono_id: string; nome: string; criado_em: string; parametros: Record<string, ParamResp>; n_casas: number; construcao: "simultaneo" | "sequencia"; preco_venda: { min?: number; max?: number } | null; faixa_id: string | null }

export type SimNaoNaoSei = "sim" | "nao" | "nao_sei";
/** Ponto de partida: primeira tela do aplicativo. "não sei" é tratado como "não", com aviso para confirmar. */
export interface PontoPartida {
  tem_terreno: boolean | null; endereco?: string;
  /** perguntas 2, 3 e 4 do caminho "já tenho o terreno" */
  aprovacoes?: SimNaoNaoSei; projeto_casa?: SimNaoNaoSei; terreno_pronto?: SimNaoNaoSei; concluido?: boolean; data?: string;
}
/** Situação de uma parte de etapa que o usuário declarou já feita. A etapa não é removida: fica "já realizada" e o valor entra na pilha como realizado. */
export interface ParteRealizada {
  /** "aquisicao" = etapa 2; "aprovacoes" e "projeto_casa" = partes da etapa 3; "preparacao" = etapa 4 */
  parte: "aquisicao" | "aprovacoes" | "projeto_casa" | "preparacao"; etapa: 2 | 3 | 4;
  /** valor gasto informado; null = "não sei" (as etapas de custo usam estimativa marcada como premissa) */
  valor_gasto: number | null; nao_sei: boolean; data: string;
}
/** Registro central. Guarda ponto de partida, respostas, terrenos, pilha de custos e cronograma. Pode ter uma ou várias casas. */
export interface Projeto {
  /** Dono do registro. Todo dado privado tem dono; hoje só existe "local" (uso próprio, sem login). */
  dono_id?: string;
  projeto_id: string; nome: string; criado_em: string; alterado_em: string;
  ponto_partida?: PontoPartida; realizadas?: ParteRealizada[];
  /** null = a pessoa ainda não escolheu a faixa de investimento */ faixa_id: string | null;
  /** "cidade" = o usuário abriu o retrato de uma cidade que tem em mente */
  caminho?: "cidade" | null;
  /** Modo de entrada usado por último. Os dois gravam no mesmo conjunto de parâmetros abaixo. */
  modo?: "leigo" | "expert" | null;
  /** etapa 2: modo de entrada e terrenos marcados para comparar lado a lado (até 4) */ modo_e2?: "leigo" | "expert"; e2_comparar?: string[];
  /** Parâmetros lidos pelo motor (src/parametros.ts). */
  parametros?: Record<string, ParamResp>;
  /** Entradas de cálculo, usadas também nas etapas 3, 5, 6 e 8. "sequencia" faz a etapa 6 calcular a terra parada entre uma casa e outra. */
  n_casas?: number; construcao?: "simultaneo" | "sequencia"; preco_venda?: { min?: number; max?: number } | null;
  /** valores informados quando a pessoa escolhe uma opção aberta ("mais de X") que entra em cálculo; sem valor, a conta usa o piso da opção e avisa */
  valores_abertos?: ValoresAbertos;
  /** nível de exigência do resultado: % mínimo dos critérios com dado que a região precisa atender (100 = o máximo possível). Padrão 50. */
  exigencia?: number;
  /** Respostas das perguntas do modo guiado, gravadas a cada clique. */
  leigo?: RespostasLeigo;
  unidade_eleita_id: string | null; eleita_em: string | null;
  margem_alvo_pct: number | null; juros_aa_pct: number | null;
  terrenos: Terreno[]; casas: Casa[]; linhas_custo: LinhaCusto[]; cronograma: Marco[];
}
/** Item da due diligence do terreno (etapa 2). */
export interface ItemDiligencia {
  item: "zona_fema_lote" | "laudo_solo" | "easements" | "deed_restrictions_hoa" | "acesso" | "distancia_rede" | "direitos_minerais" | "rollback_tax" | "area_minima_fossa";
  situacao: "a_verificar" | "ok" | "problema"; valor: string | null; data: string | null; fonte: string;
}
/** Etapa 2. Herda da unidade: ISD, imposto, taxas, zoneamento, preço de venda, dias no mercado, prazo de aprovação. */
export interface Terreno {
  terreno_id: string; unidade_id: string; endereco: string; parcel_id: string; acres: number | null; preco_pedido: number | null;
  isd_id_proprio: string | null; mud_pid: string | null; isencao_agricola: boolean; status: "candidato" | "eleito" | "descartado";
  /** Terreno que o usuário já possui: a etapa 8 mostra a margem sobre o preço pago e sobre o valor atual; o tempo desde a compra não entra no carregamento. */
  /** dados da etapa 2 (candidato, triagem, custos, pagamento) */ e2?: DadosEtapa2; ja_possuido?: boolean; preco_pago?: number | null; data_compra?: string | null; valor_atual?: number | null; valor_atual_origem?: "informado" | "estimado" | null;
  due_diligence?: ItemDiligencia[];
}
/** Etapas 3 e 5. Um projeto pode ter uma ou várias casas. */
/** Etapa 2 — faixa de valor: mínimo, provável e máximo. */
export interface Faixa3 { min: number | null; provavel: number | null; max: number | null }
export type RespostaTriagem = "ok" | "problema" | "nao_sei";
/** Resposta de um item da triagem do terreno. O custo e o prazo de resolver só são gravados quando o usuário informa; senão valem os da referência da ferramenta. */
export interface RespTriagem { resposta: RespostaTriagem | null; origem?: "base" | "usuario"; fonte?: string; data?: string; custo?: Faixa3; prazo_dias?: Faixa3; obs?: string }
/** Valor de uma linha de custo informado pelo usuário: vale só para este projeto, marcado "informado por mim". */
export interface ValorInformado extends Faixa3 { realizado?: number | null; data: string; fonte?: string }
export interface Pagamento { forma: "a_vista" | "financiado"; /** informa-se a entrada ou o valor financiado; o outro é calculado */ entrada?: number | null; financiado?: number | null; juros_aa_pct?: number | null; parcelas?: number | null }
/** Dados da etapa 2 de um terreno candidato. Tudo aqui é dado privado do projeto. */
export type SituacaoDoc = "nao_pedido" | "pedido" | "recebido_ok" | "recebido_problema" | "nao_se_aplica";
/** Situação de um documento do checklist. "problemas" lista os itens de risco (zoneamento, acesso…) em que o documento mostrou problema. */
export interface DocResp { situacao: SituacaoDoc; data?: string; nota?: string; problemas?: string[] }
export type QuemPaga = "a_negociar" | "comprador" | "vendedor" | "dividido";
export type SituacaoNeg = "em_analise" | "oferta_enviada" | "contraproposta" | "sob_contrato" | "fechado" | "desistencia";
export interface Lance { id: string; data: string; tipo: "oferta" | "contraproposta"; valor: number | null; obs?: string }
/** Negociação do terreno: histórico, termos e prazos do contrato. */
export interface Negociacao { situacao?: SituacaoNeg; historico?: Lance[]; periodo_opcao_dias?: number | null; fim_opcao?: string | null; data_fechamento?: string | null;
  condicoes?: string[]; condicoes_texto?: string; paga_titulo?: QuemPaga; paga_survey?: QuemPaga }
export interface DadosEtapa2 {
  condado?: string; tamanho_sqft?: number | null; valor_cadastro?: number | null; dentro_cidade?: boolean | null; isd_nome?: string; loteamento?: string; zoneamento?: string;
  agua_esgoto?: "rede" | "poco_fossa" | "nao_sei" | null; /** campos que o usuário preencheu ou corrigiu: "informado por mim" */ informado?: string[];
  link_anuncio?: string; observacoes?: string; oferta?: number | null; preco_fechado?: number | null; sinal?: number | null; taxa_opcao?: number | null;
  pagamento?: Pagamento; triagem?: Record<string, RespTriagem>; /** lote inteiramente em floodway: entra na marca "pode inviabilizar" */ floodway_total?: boolean;
  /** checklist de documentos: substitui a triagem */ documentos?: Record<string, DocResp>; negociacao?: Negociacao; /** comprador é empresa: pede os documentos da pessoa jurídica */ comprador_pj?: boolean;
  custos?: Record<string, ValorInformado>; prazos?: Record<string, Faixa3>; descarte?: { motivo: string; texto: string; data: string }; /** terreno de exemplo, para testar o fluxo */ exemplo?: boolean;
}
export interface Casa {
  casa_id: string; terreno_id: string; sqft: number | null; padrao: "economico" | "medio" | "alto" | "luxo" | null;
  quartos: number | null; banheiros: number | null; fundacao: "slab" | "pier_beam" | "post_tension" | null;
}
/** Etapas 2 a 7. Toda linha tem previsto (mín/provável/máx), realizado, data e fonte. */
export interface LinhaCusto {
  linha_id: string; etapa: 2 | 3 | 4 | 5 | 6 | 7; casa_id: string | null; categoria: string; descricao: string;
  previsto_min: number | null; previsto_provavel: number | null; previsto_max: number | null;
  realizado: number | null; data: string | null; fonte: string; formula: string | null; premissa_id: string | null;
  /** "ponto_partida" = valor de etapa já realizada, informado na primeira tela */ origem?: "ponto_partida" | "etapa";
}
/** Prazo é custo: as durações alimentam o carregamento (etapa 6). */
export interface Marco {
  marco_id: string; etapa: number; descricao: string; dias_min: number | null; dias_provavel: number | null; dias_max: number | null;
  inicio_real: string | null; fim_real: string | null; origem: "herdado_unidade" | "manual";
}
/** Etapa 8: casas novas realmente vendidas, para medir o desvio do preço calculado. */
export interface VendaReferencia { venda_id: string; unidade_id: string; endereco: string; sqft: number; lote_sqft: number; data_venda: string; preco_venda: number; builder: string; fonte: string }
/** Edição manual de um valor da base pública. É dado privado do dono: nunca volta para a base pública. */
export interface Edicao { v: number | string | null; data: string; original: number | string | null; dono_id?: string }
/** Dados privados das próximas etapas (ainda sem tela): cotações recebidas e custos reais de obra. Sempre ligados a um dono e a um projeto. */
export interface Cotacao { cotacao_id: string; dono_id: string; projeto_id: string; linha_id: string | null; fornecedor: string; descricao: string; valor: number; data: string; validade: string | null; arquivo: string | null }
export interface CustoReal { custo_id: string; dono_id: string; projeto_id: string; linha_id: string; valor: number; data: string; documento: string | null; obs: string }
