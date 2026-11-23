import type { Base, Criterio, Filtros, Indicador, Projeto, Unidade, Edicao } from "./tipos";

export const LETRAS = ["A", "B", "C", "D", "F"];
export const DIAS_DESATUALIZADO = 183;

export function chave(c: Criterio, faixa: string, metrica?: string) {
  const m = metrica ?? c.metrica;
  return `${c.id}|${m}` + (c.por_faixa && m === c.metrica ? `|${faixa}` : "");
}
/** Indicador com a edição manual aplicada por cima do valor da base. */
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
export function percentil(ordenado: number[], p: number): number {
  if (!ordenado.length) return NaN;
  const i = (ordenado.length - 1) * p, a = Math.floor(i), b = Math.ceil(i);
  return ordenado[a] + (ordenado[b] - ordenado[a]) * (i - a);
}
/** Pesos normalizados para somar 1 (só os positivos). */
export function normalizar(pesos: Record<string, number>): Record<string, number> {
  const s = Object.values(pesos).reduce((a, b) => a + Math.max(0, b || 0), 0);
  const r: Record<string, number> = {};
  for (const [k, v] of Object.entries(pesos)) if (v > 0) r[k] = v / s;
  return r;
}
export function pesoCorrelacionado(base: Base, pesos: Record<string, number>): number {
  const n = normalizar(pesos);
  return base.criterios.filter((c) => c.correlacionado).reduce((a, c) => a + (n[c.id] ?? 0), 0);
}

export interface Motivo { filtro: string; semDado: boolean }
export function passaFiltros(val: (k: string) => Indicador | undefined, u: Unidade, f: Filtros): Motivo[] {
  const m: Motivo[] = [];
  const testa = (nome: string, k: string, ok: (v: number | string) => boolean) => {
    const v = val(k)?.v;
    if (v === null || v === undefined) { if (f.eliminar_sem_dado) m.push({ filtro: nome, semDado: true }); }
    else if (!ok(v)) m.push({ filtro: nome, semDado: false });
  };
  if (f.tipo !== "todas" && u.tipo !== f.tipo) m.push({ filtro: "tipo de unidade", semDado: false });
  if (f.isd_min) testa(`ISD mínimo ${f.isd_min}`, "c21|nota_isd_letra", (v) => LETRAS.indexOf(String(v)) >= 0 && LETRAS.indexOf(String(v)) <= LETRAS.indexOf(f.isd_min));
  if (f.sem_moratoria) testa("sem moratória", "c08|moratoria_ativa", (v) => v === "nao");
  if (f.com_esgoto) testa("com rede de esgoto", "c09|rede_esgoto", (v) => v === "sim" || v === 1);
  if (f.sfha_max !== null) testa(`alagamento ≤ ${f.sfha_max}%`, "c25|pct_area_sfha", (v) => Number(v) <= f.sfha_max!);
  return m;
}

export interface NotaCriterio { bruto: number | null; nota: number | null; peso: number }
export interface Linha { u: Unidade; nota: number | null; cobertura: number; porCriterio: Record<string, NotaCriterio>; eliminada: Motivo[]; posicao: number | null }

function notaTamanho(v: number, p: Projeto, lo: number, hi: number): number {
  const t = p.tamanho;
  if (t.modo === "faixa") {
    if (v >= t.min && v <= t.max) return 100;
    const larg = Math.max(t.max - t.min, 1e-9), dist = v < t.min ? t.min - v : v - t.max;
    return Math.max(0, 100 * (1 - dist / larg));
  }
  const s = hi === lo ? 50 : (100 * (Math.min(Math.max(v, lo), hi) - lo)) / (hi - lo);
  return t.modo === "maior" ? s : 100 - s;
}

/** Ranking multicritério. Nota por critério = min–max entre as unidades que passam nos filtros, com corte em p5/p95.
 *  Nota final = média ponderada só dos critérios com dado; "cobertura" = fração do peso que tinha dado. */
export function calcular(base: Base, p: Projeto, edicoes: Record<string, Edicao>): Linha[] {
  const pesos = normalizar(p.pesos);
  const crits = base.criterios.filter((c) => pesos[c.id] > 0);
  const pre = base.unidades.map((u) => {
    const val = (k: string) => indicador(base, edicoes, u.unidade_id, k);
    return { u, val, eliminada: passaFiltros(val, u, p.filtros) };
  });
  const vivos = pre.filter((x) => !x.eliminada.length);
  const lim: Record<string, [number, number]> = {};
  for (const c of crits) {
    const vs = vivos.map((x) => numero(x.val(chave(c, p.faixa_id))?.v)).filter((v): v is number => v !== null).sort((a, b) => a - b);
    lim[c.id] = [percentil(vs, 0.05), percentil(vs, 0.95)];
  }
  const linhas: Linha[] = pre.map(({ u, val, eliminada }) => {
    const porCriterio: Record<string, NotaCriterio> = {}; let soma = 0, cob = 0;
    for (const c of crits) {
      const bruto = numero(val(chave(c, p.faixa_id))?.v); let nota: number | null = null;
      const [lo, hi] = lim[c.id];
      if (bruto !== null && !isNaN(lo)) {
        if (c.direcao === "configuravel") nota = notaTamanho(bruto, p, lo, hi);
        else { const s = hi === lo ? 50 : (100 * (Math.min(Math.max(bruto, lo), hi) - lo)) / (hi - lo); nota = c.direcao === "maior" ? s : 100 - s; }
        soma += nota * pesos[c.id]; cob += pesos[c.id];
      }
      porCriterio[c.id] = { bruto, nota, peso: pesos[c.id] };
    }
    const elim = [...eliminada];
    if (!elim.length && cob * 100 < p.filtros.cobertura_min) elim.push({ filtro: `cobertura mínima ${p.filtros.cobertura_min}%`, semDado: true });
    return { u, nota: cob > 0 ? soma / cob : null, cobertura: cob, porCriterio, eliminada: elim, posicao: null };
  });
  linhas.sort((a, b) => (a.eliminada.length ? 1 : 0) - (b.eliminada.length ? 1 : 0) || (b.nota ?? -1) - (a.nota ?? -1) || a.u.nome.localeCompare(b.u.nome));
  let pos = 0; for (const l of linhas) if (!l.eliminada.length && l.nota !== null) l.posicao = ++pos;
  return linhas;
}
