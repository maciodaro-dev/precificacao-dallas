// Esquema de dados das 8 etapas. A base de referência (unidades, critérios, indicadores) vem de data/ via base.json.
// Os dados de projeto (abaixo de "Projeto") são gravados pelo usuário e referenciam a base só por ID.

export type Confianca = "alta" | "media" | "baixa" | "sem_dado";
export type Direcao = "maior" | "menor" | "configuravel";

export interface Unidade {
  unidade_id: string; nome: string; tipo: "cidade_isd" | "nao_incorporado"; cidade: string; place_geoid: string;
  isd_id: string; isd_nome: string; condado: string; condado_fips: string; condados_pct: string;
  acres_terra: number; pct_cidade: number | null; lat: number; lon: number; fonte: string;
}
export interface Criterio {
  id: string; grupo: string; nome: string; metrica: string; unidade_medida: string; direcao: Direcao;
  fonte_planejada: string; cobertura: string; aux?: string[]; por_faixa?: boolean; correlacionado?: boolean;
}
/** Valor bruto com unidade. A nota 0–100 nunca é gravada: é calculada a partir daqui. */
export interface Indicador {
  v: number | string | null; um: string; f: string; url: string; ref: string; col: string; conf: Confianca; obs: string;
  editado?: boolean; data_edicao?: string; original?: number | string | null;
}
export interface Faixa { id: string; nome: string; min: number; max: number }
export interface Perfil { id: string; nome: string; pesos: Record<string, number> }
export interface Fonte { id: string; nome: string; orgao: string; url: string; script: string; periodicidade: string; situacao: string; obs: string;
  licenca?: string; uso_comercial?: string; redistribuicao?: string; termos_url?: string; verificacao?: string; criterios?: string; alternativa?: string }
export interface Premissa { premissa_id: string; descricao: string; valor: string; unidade: string; autor: string; data: string; justificativa: string; usada_em: string }
export interface Base {
  gerado_em: string; unidades: Unidade[]; criterios: Criterio[]; indicadores: Record<string, Record<string, Indicador>>;
  faixas: Faixa[]; perfis: Perfil[]; fontes: Fonte[]; premissas: Premissa[];
}

export interface Filtros {
  isd_min: "" | "A" | "B" | "C" | "D"; sem_moratoria: boolean; com_esgoto: boolean; sfha_max: number | null;
  tipo: "todas" | "cidade_isd" | "nao_incorporado"; cobertura_min: number; eliminar_sem_dado: boolean;
}
export interface Tamanho { modo: "maior" | "menor" | "faixa"; min: number; max: number }

/** Resposta do usuário a um critério definido: sim/não, um número, uma letra ou um intervalo. */
/** peso: quanto o critério conta na nota (1 = normal). */
export interface Resposta { /** critério em uso */ ativo?: boolean; /** índice do subcritério escolhido */ opcao?: number | null; v?: number | string | null; min?: number | null; max?: number | null; obrigatorio?: boolean; peso?: number | null; data?: string }

export type Peso = "baixo" | "medio" | "alto";
/** Um parâmetro do motor da etapa 1. alvo null = indiferente / não se aplica. origem = pergunta do modo leigo que o deduziu, "manual" ou "perfil:<nome>". */
export interface ParamResp { alvo: { valor?: string; min?: number; max?: number } | null; peso: Peso; origem: string; ajustado?: boolean }
export interface RespostasLeigo { casas?: "1" | "2a4" | "5a10" | "mais10"; construcao?: "simultaneo" | "sequencia"; preco?: number; vender_rapido?: boolean; valorizacao?: boolean; comecar_logo?: boolean; agua_esgoto?: boolean; escola?: boolean }
/** Combinação do modo expert salva com nome, para reutilizar em outros projetos. Dado privado do dono. */
export interface PerfilSalvo { perfil_id: string; dono_id: string; nome: string; criado_em: string; parametros: Record<string, ParamResp>; n_casas: number; construcao: "simultaneo" | "sequencia"; preco_venda: { min?: number; max?: number } | null; faixa_id: string }

/** Registro central. Nasce na etapa 1 e acumula terrenos, casas, pilha de custos e cronograma. */
export interface Projeto {
  /** Dono do registro. Todo dado privado tem dono; hoje só existe "local" (uso próprio, sem login). */
  dono_id?: string;
  projeto_id: string; nome: string; criado_em: string; alterado_em: string;
  faixa_id: string; perfil_origem: string; pesos: Record<string, number>; tamanho: Tamanho; filtros: Filtros;
  /** Como o lugar é definido: "cidade" = o usuário já sabe onde quer construir; "criterios" = o lugar sai dos critérios. */
  caminho?: "cidade" | "criterios" | null;
  /** Modo de entrada usado por último. Os dois gravam no mesmo conjunto de parâmetros abaixo. */
  modo?: "leigo" | "expert" | null;
  /** Parâmetros lidos pelo motor (src/parametros.ts). */
  parametros?: Record<string, ParamResp>;
  /** Entradas de cálculo: nº de casas, forma de construir e preço de venda pretendido. "sequencia" faz a etapa 6 calcular a terra parada entre uma casa e outra. */
  n_casas?: number; construcao?: "simultaneo" | "sequencia"; preco_venda?: { min?: number; max?: number } | null;
  /** Respostas das perguntas simples, guardadas para refazer a dedução. */
  leigo?: RespostasLeigo;
  /** Critérios definidos (sim/não ou número), por id de src/definicoes.ts. Substituem os pesos. */
  respostas?: Record<string, Resposta>;
  unidade_eleita_id: string | null; eleita_em: string | null;
  margem_alvo_pct: number | null; juros_aa_pct: number | null;
  terrenos: Terreno[]; casas: Casa[]; linhas_custo: LinhaCusto[]; cronograma: Marco[];
}
/** Etapa 2. Herda da unidade: ISD, alíquota, taxas, zoneamento, preço de venda, dias no mercado, prazo de aprovação. */
export interface Terreno {
  terreno_id: string; unidade_id: string; endereco: string; parcel_id: string; acres: number | null; preco_pedido: number | null;
  isd_id_proprio: string | null; mud_pid: string | null; isencao_agricola: boolean; status: "candidato" | "eleito" | "descartado";
}
/** Etapas 3 e 5. Um projeto pode ter uma ou várias casas. */
export interface Casa {
  casa_id: string; terreno_id: string; sqft: number | null; padrao: "economico" | "medio" | "alto" | "luxo" | null;
  quartos: number | null; banheiros: number | null; fundacao: "slab" | "pier_beam" | "post_tension" | null;
}
/** Etapas 2 a 7. Toda linha tem previsto (mín/provável/máx), realizado, data e fonte. */
export interface LinhaCusto {
  linha_id: string; etapa: 2 | 3 | 4 | 5 | 6 | 7; casa_id: string | null; categoria: string; descricao: string;
  previsto_min: number | null; previsto_provavel: number | null; previsto_max: number | null;
  realizado: number | null; data: string | null; fonte: string; formula: string | null; premissa_id: string | null;
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
