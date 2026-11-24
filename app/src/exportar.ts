import * as XLSX from "xlsx";
import type { Base, Edicao, Projeto } from "./tipos";
import { chave, indicador, type Linha } from "./ranking";
import { ativas, descreve, DEFS } from "./definicoes";

type L = Record<string, string | number | null>;
export function tabelas(base: Base, p: Projeto, linhas: Linha[], edicoes: Record<string, Edicao>) {
  const defs = ativas(p); const resp = p.respostas ?? {};
  const ranking: L[] = linhas.map((l) => {
    const r: L = { posicao: l.posicao, unidade_id: l.u.unidade_id, unidade: l.u.nome, tipo: l.u.tipo, condado: l.u.condado, isd: l.u.isd_nome,
      nota: l.nota === null ? null : Math.round(l.nota * 10) / 10, criterios_atendidos: l.atendidos ?? null, criterios_com_dado: l.avaliados ?? null, criterios_definidos: defs.length, eliminada_por: l.eliminada.map((m) => m.filtro).join("; ") };
    for (const d of defs) { const x = l.porCriterio[d.id]; r[`${d.pergunta} (valor)`] = x?.texto ?? x?.bruto ?? null; r[`${d.pergunta} (atende)`] = x?.nota == null ? "sem dado" : x.nota === 100 ? "sim" : "não"; }
    return r;
  });
  const dados: L[] = []; const pend: L[] = [];
  for (const u of base.unidades) {
    const ks = new Set(Object.keys(base.indicadores[u.unidade_id] ?? {}));
    for (const c of base.criterios) ks.add(chave(c, p.faixa_id));
    for (const k of [...ks].sort()) {
      const i = indicador(base, edicoes, u.unidade_id, k); const [cid, metrica, faixa] = k.split("|");
      const c = base.criterios.find((x) => x.id === cid);
      const linha: L = { unidade_id: u.unidade_id, unidade: u.nome, criterio_id: cid, criterio: c?.nome ?? "contexto", metrica, faixa: faixa ?? "", valor: i?.v ?? null,
        unidade_medida: i?.um || c?.unidade_medida || "", fonte: i?.f ?? "", url: i?.url ?? "", data_referencia: i?.ref ?? "", data_coleta: i?.col ?? "",
        confianca: i?.conf ?? "sem_dado", editado_manualmente: i?.editado ? "sim" : "", valor_original: i?.editado ? (i.original ?? null) : null, observacao: i?.obs ?? "" };
      dados.push(linha);
      if (c && metrica === c.metrica && (i?.v ?? null) === null) pend.push({ unidade_id: u.unidade_id, unidade: u.nome, criterio_id: cid, criterio: c.nome, unidade_medida: c.unidade_medida, motivo: i?.obs || c.fonte_planejada, valor: null, fonte: null, data: null });
    }
  }
  const projeto: L[] = [
    { campo: "projeto", valor: p.nome }, { campo: "faixa de investimento", valor: base.faixas.find((f) => f.id === p.faixa_id)?.nome ?? p.faixa_id },
    { campo: "caminho", valor: p.caminho ?? "" }, { campo: "unidade eleita", valor: p.unidade_eleita_id },
    ...DEFS.filter((d) => resp[d.id]?.ativo).map((d) => { const r = resp[d.id]; const cen = d.tipo.startsWith("cenario");
      return { campo: d.pergunta, valor: (cen || d.tipo === "exige" || d.tipo === "nao_aceita" || d.tipo === "so_cidade" ? String(r.v ?? "") : defs.includes(d) ? descreve(d, r) : "") + (cen ? "" : ` · peso ${r.peso ?? 1}`) + (r.obrigatorio ? " (obrigatório)" : "") + (r.data ? ` · definido em ${r.data}` : "") }; }),
    { campo: "base gerada em", valor: base.gerado_em },
  ];
  return { ranking, dados, pend, projeto };
}
const nomeArq = (p: Projeto, s: string) => `${p.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\-]+/g, "_")}_${s}_${new Date().toISOString().slice(0, 10)}`;
export function exportarXlsx(base: Base, p: Projeto, linhas: Linha[], e: Record<string, Edicao>) {
  const t = tabelas(base, p, linhas, e); const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(t.ranking), "Ranking");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(t.dados), "Dados brutos");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(t.pend), "Pendências");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(t.projeto), "Projeto");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(base.premissas as unknown as L[]), "Premissas");
  XLSX.writeFile(wb, nomeArq(p, "etapa1") + ".xlsx");
}
export function exportarCsv(base: Base, p: Projeto, linhas: Linha[], e: Record<string, Edicao>, qual: "ranking" | "dados") {
  const t = tabelas(base, p, linhas, e); const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(t[qual]), { FS: ";" });
  baixar(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }), nomeArq(p, qual) + ".csv");
}
export function baixar(blob: Blob, nome: string) {
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nome; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
