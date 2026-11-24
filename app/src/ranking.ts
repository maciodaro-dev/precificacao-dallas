// Leitura dos dados da base (com as correções manuais por cima) e o formato de uma linha de resultado.
// O cálculo da nota fica em parametros.ts, que é o único motor da etapa 1.
import type { Base, Criterio, Indicador, Unidade, Edicao } from "./tipos";

export const LETRAS = ["A", "B", "C", "D", "F"];
export const DIAS_DESATUALIZADO = 183;

export function chave(c: Criterio, faixa: string | null, metrica?: string) {
  const m = metrica ?? c.metrica;
  return `${c.id}|${m}` + (c.por_faixa && m === c.metrica ? `|${faixa}` : "");
}
/** Indicador com a correção manual aplicada por cima do valor da base. A correção é dado privado do dono. */
export function indicador(base: Base, edicoes: Record<string, Edicao>, uid: string, k: string): Indicador | undefined {
  const b = base.indicadores[uid]?.[k]; const e = edicoes[`${uid}|${k}`];
  if (!e) return b;
  return { v: e.v, um: b?.um ?? "", f: "usuario", url: b?.url ?? "", ref: e.data, col: e.data, conf: e.v === null ? "sem_dado" : "media",
    obs: "editado manualmente", editado: true, data_edicao: e.data, original: e.original };
}
export function numero(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return isFinite(v) ? v : null;
  if (v === "sim") return 1; if (v === "nao") return 0;
  const n = Number(v); return isFinite(n) ? n : null;
}
export function desatualizado(ref: string, hoje = new Date()): boolean {
  const d = new Date(ref); if (isNaN(d.getTime())) return false;
  return (hoje.getTime() - d.getTime()) / 86400000 > DIAS_DESATUALIZADO;
}

export interface NotaCriterio { bruto: number | null; nota: number | null; peso: number; texto?: string; fonte?: string; ref?: string; /** "cidade" = dado da cidade inteira, usado numa fatia */ esc?: "cidade" | "fatia"; conf?: string }
export interface Falha { id: string; nome: string; leigo: string; s: number; valor: string; alvo: string; peso: string }
/** Uma unidade no resultado. Nenhuma unidade é eliminada: "falhas" lista o que ela não atende. */
export interface Linha { u: Unidade; nota: number | null; /** peso dos parâmetros em uso com dado nesta unidade ÷ peso de todos os parâmetros em uso */ cobertura: number; /** nº de parâmetros em uso */ emUso: number; porCriterio: Record<string, NotaCriterio>; posicao: number | null; atendidos: number; avaliados: number; falhas: Falha[] }
