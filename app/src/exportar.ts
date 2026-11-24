import * as XLSX from "xlsx";
import type { Base, Edicao, Projeto } from "./tipos";
import { chave, indicador, type Linha } from "./ranking";
import { ativos, descreveAlvo, pesoDe, pesoTerreno } from "./parametros";

type L = Record<string, string | number | null>;
export function tabelas(base: Base, p: Projeto, linhas: Linha[], edicoes: Record<string, Edicao>) {
  const defs = ativos(p);
  const ranking: L[] = linhas.map((l) => {
    const r: L = { posicao: l.posicao, unidade_id: l.u.unidade_id, unidade: l.u.nome, tipo: l.u.tipo, condado: l.u.condado, isd: l.u.isd_nome, regiao_considerada: l.recorte?.texto ?? "região inteira",
      nota: l.nota === null ? null : Math.round(l.nota * 10) / 10, com_dado_pct: Math.round(l.cobertura * 100), parametros_com_dado: l.avaliados, parametros_em_uso: l.emUso, poucos_dados: l.poucosDados ? "sim" : "nao", nao_atende: (l.falhas ?? []).map((f) => `${f.nome} (${f.valor}; alvo ${f.alvo})`).join("; ") };
    for (const d of defs) { const x = l.porCriterio[d.id]; r[`${d.nome} (valor, ${d.um || "sim/não"})`] = x?.texto ?? (x?.bruto == null ? null : x.bruto / (d.fator ?? 1)); r[`${d.nome} (nota)`] = x?.nota ?? "sem dado"; if (x?.esc === "cidade") r[`${d.nome} (escala)`] = "dado da cidade inteira"; }
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
  const pt = pesoTerreno(base, p);
  const projeto: L[] = [
    { campo: "projeto", valor: p.nome }, { campo: "modo de entrada", valor: p.modo === "leigo" ? "guiado" : p.modo === "expert" ? "especialista" : "" },
    { campo: "faixa de investimento no terreno", valor: base.faixas.find((f) => f.id === p.faixa_id)?.nome ?? p.faixa_id ?? "não escolhida" },
    { campo: "número de casas", valor: p.n_casas ?? 1 }, { campo: "construção", valor: p.construcao === "sequencia" ? "em sequência" : "ao mesmo tempo" },
    { campo: "preço de venda por casa", valor: p.preco_venda ? `${p.preco_venda.min ?? ""} – ${p.preco_venda.max ?? ""}` : "" },
    { campo: "peso do terreno no preço (%)", valor: pt.pct === null ? null : Math.round(pt.pct) }, { campo: "unidade eleita", valor: p.unidade_eleita_id },
    ...defs.map((d) => ({ campo: `parâmetro: ${d.nome}`, valor: `${descreveAlvo(d, p.parametros?.[d.id]?.alvo, p, base)} · peso ${pesoDe(p, d.id)} · origem: ${p.parametros?.[d.id]?.ajustado ? "ajustado manualmente" : p.parametros?.[d.id]?.origem ?? ""}` })),
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
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(base.fontes.map((f) => ({ fonte: f.nome, orgao: f.orgao, licenca: f.licenca ?? "", uso_comercial: f.uso_comercial ?? "", redistribuicao: f.redistribuicao ?? "", atualizacao: f.periodicidade, criterios: f.criterios ?? "", url: f.url }))), "Fontes e licenças");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ aviso: "Esta planilha é apoio à decisão. Não é recomendação de investimento nem avaliação de imóvel." }, { aviso: `Base de dados gerada em ${base.gerado_em}. A fonte e a data de referência de cada valor estão na aba "Dados brutos".` }]), "Aviso");
  XLSX.writeFile(wb, nomeArq(p, "etapa1") + ".xlsx");
}
export function exportarCsv(base: Base, p: Projeto, linhas: Linha[], e: Record<string, Edicao>, qual: "ranking" | "dados") {
  const t = tabelas(base, p, linhas, e); const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(t[qual]), { FS: ";" });
  baixar(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }), nomeArq(p, qual) + ".csv");
}
export function baixar(blob: Blob, nome: string) {
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nome; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
