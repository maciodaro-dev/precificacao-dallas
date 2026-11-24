// Dados que aparecem em cada linha do ranking e em cada cartão do modo guiado (colunas d a h da tela de resultado).
// "Terrenos vagos no tamanho procurado" e "Custo de referência do terreno" ainda não têm dado: aparecem como "sem dado" desde já.
import type { Base, Edicao } from "../tipos";
import { indicador, type Linha } from "../ranking";
import { fmt } from "../formato";

export interface CelulaResumo { /** região com preço anunciado registrado manualmente */ marca?: boolean; id: string; rotulo: string; curto: string; valor: string | null; cidadeInteira?: boolean; ordem: number | null }
const LETRAS = ["A", "B", "C", "D", "F"];
/** Preço anunciado, registrado manualmente pelo usuário (dado privado do projeto). */
export const CHAVE_PRECO_ANUNCIADO = "c01|preco_terra_acre";
/** Registros manuais do que foi visto em anúncios (preço, tamanho, oferta, dias anunciado): privados, ficam fora das exportações compartilhadas. */
export const ehRegistroPrivado = (chaveEdicao: string) => /\|c0[1235]\|/.test(chaveEdicao);
export function resumoLinha(base: Base, edicoes: Record<string, Edicao>, l: Linha): CelulaResumo[] {
  // quando a nota de escola recorta a região, o valor usado na nota é o da parte que vale (está em porCriterio); senão, o da região
  const de = (pid: string, k: string) => { const x = l.porCriterio[pid]; if (x && (x.bruto !== null || x.texto)) return { v: x.texto ?? x.bruto, esc: x.esc }; const i = indicador(base, edicoes, l.u.unidade_id, k); return { v: i?.v ?? null, esc: i?.esc }; };
  const val = de("valorizacao", "c18|valorizacao_5a"), isd = de("isd", "c21|nota_isd_letra"), imp = de("imposto", "c24|aliquota_total");
  const n = (x: unknown) => (typeof x === "number" ? x : null);
  return [
    { id: "vagos", rotulo: "Terrenos vagos no tamanho procurado", curto: "Terrenos vagos", valor: null, ordem: null },
    { id: "custo", rotulo: "Custo de referência do terreno", curto: "Custo de referência", valor: null, ordem: null, marca: edicoes[`${l.u.unidade_id}|${CHAVE_PRECO_ANUNCIADO}`]?.v != null },
    { id: "valorizacao", rotulo: "Valorização em 5 anos", curto: "Valorização 5 anos", valor: n(val.v) === null ? null : fmt(n(val.v), "%"), cidadeInteira: val.esc === "cidade", ordem: n(val.v) },
    { id: "isd", rotulo: "Nota do distrito escolar", curto: "Distrito escolar", valor: isd.v == null ? null : String(isd.v), ordem: isd.v == null ? null : -LETRAS.indexOf(String(isd.v)) },
    { id: "imposto", rotulo: "Imposto total (com MUD/PID)", curto: "Imposto total", valor: n(imp.v) === null ? null : fmt(n(imp.v), "%"), ordem: n(imp.v) },
  ];
}
