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
export interface Fonte { id: string; nome: string; orgao: string; url: string; script: string; periodicidade: string; situacao: string; obs: string }
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
export interface Resposta { v?: number | string | null; min?: number | null; max?: number | null; obrigatorio?: boolean; data?: string }

/** Registro central. Nasce na etapa 1 e acumula terrenos, casas, pilha de custos e cronograma. */
export interface Projeto {
  projeto_id: string; nome: string; criado_em: string; alterado_em: string;
  faixa_id: string; perfil_origem: string; pesos: Record<string, number>; tamanho: Tamanho; filtros: Filtros;
  /** Como o lugar é definido: "cidade" = o usuário já sabe onde quer construir; "criterios" = o lugar sai dos critérios. */
  caminho?: "cidade" | "criterios" | null;
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
export interface Edicao { v: number | string | null; data: string; original: number | string | null }
