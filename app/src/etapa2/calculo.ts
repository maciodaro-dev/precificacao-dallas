// Cálculos da etapa 2 (aquisição do terreno). Funções puras, testadas em calculo.test.ts.
// Regra de valores: o que o usuário informa vale para o projeto ("informado por mim"); senão o cálculo oficial (seguro de título);
// senão a estimativa de referência da ferramenta; senão a linha fica SEM VALOR e o resultado diz qual ficou de fora.
import type { Base, DadosEtapa2, Faixa3, Projeto, Referencia, Terreno } from "../tipos";
import tdi from "./titulo_tdi.json";
import type { DocResp, SituacaoDoc } from "../tipos";
import { DOCS, ITENS_TRIAGEM, LINHAS, MOMENTOS, SITUACOES_DOC, type DocCatalogo, type ItemTriagem, type LinhaCatalogo } from "./catalogo";

const fin = (x: unknown): x is number => typeof x === "number" && isFinite(x);
export const F0: Faixa3 = { min: 0, provavel: 0, max: 0 };
const soma = (a: Faixa3, b: Faixa3): Faixa3 => ({ min: (a.min ?? 0) + (b.min ?? 0), provavel: (a.provavel ?? 0) + (b.provavel ?? 0), max: (a.max ?? 0) + (b.max ?? 0) });
const completa = (f: Partial<Faixa3> | undefined | null): Faixa3 | null => { if (!f) return null; const p = f.provavel ?? f.min ?? f.max; if (!fin(p)) return null; return { min: fin(f.min) ? f.min : p, provavel: p, max: fin(f.max) ? f.max : p }; };

/** Prêmio do seguro de título no Texas (tabela oficial do TDI). Até US$ 100 mil vale a tabela em degraus de US$ 500; acima, a fórmula por faixa. */
export function seguroTitulo(valor: number): number | null {
  if (!fin(valor) || valor <= 0) return null;
  if (valor <= 100000) { const t = tdi.ate_100k as [number, number][]; return (t.find(([teto]) => valor <= teto) ?? t[t.length - 1])[1]; }
  const faixas = tdi.acima as [number, number, number][]; const f = [...faixas].reverse().find(([piso]) => valor > piso)!;
  return Math.round((valor - f[0]) * f[1]) + f[2];
}
export const FONTE_TITULO = { nome: tdi.fonte, url: tdi.url, data: tdi.data_referencia, obs: tdi.obs };

/** Parcela mensal fixa (tabela Price). Juros zero: principal dividido pelas parcelas. */
export function parcela(principal: number, jurosAaPct: number, n: number): number | null {
  if (!fin(principal) || !fin(n) || n <= 0 || principal <= 0 || !fin(jurosAaPct) || jurosAaPct < 0) return null;
  const i = jurosAaPct / 100 / 12; return i === 0 ? principal / n : (principal * i) / (1 - Math.pow(1 + i, -n));
}
export interface Financiamento { financiado: number; entrada: number; parcela: number; totalJuros: number; saldo: { mes: number; juros: number; amortizacao: number; saldo: number }[] }
/** Financiamento do terreno. Informa-se a entrada OU o valor financiado; o outro sai do preço. Os juros pagos durante o projeto seguem para a etapa 6, não entram na pilha da etapa 2. */
export function financiamento(preco: number | null, e: DadosEtapa2 | undefined): Financiamento | null {
  const pg = e?.pagamento; if (!pg || pg.forma !== "financiado" || !fin(preco)) return null;
  const financiado = fin(pg.financiado) ? pg.financiado : fin(pg.entrada) ? preco - pg.entrada : null; if (!fin(financiado) || financiado <= 0 || !fin(pg.juros_aa_pct) || !fin(pg.parcelas)) return null;
  const p = parcela(financiado, pg.juros_aa_pct, pg.parcelas); if (p === null) return null; const i = pg.juros_aa_pct / 100 / 12; let s = financiado; const saldo: Financiamento["saldo"] = [];
  for (let m = 1; m <= pg.parcelas; m++) { const j = s * i; const a = p - j; s = Math.max(0, s - a); saldo.push({ mes: m, juros: j, amortizacao: a, saldo: s }); }
  return { financiado, entrada: preco - financiado, parcela: p, totalJuros: p * pg.parcelas - financiado, saldo };
}

export type TipoPreco = "fechado" | "oferta" | "anunciado" | "referencia" | "pago";
export const ROTULO_PRECO: Record<TipoPreco, string> = { fechado: "preço fechado", oferta: "minha oferta", anunciado: "preço anunciado, registrado manualmente", referencia: "custo de referência da região", pago: "preço pago" };
/** Preço em uso: o mais avançado que existir. O custo de referência da região ainda não existe na base, então hoje a ordem termina no preço anunciado. */
export function precoEmUso(t: Terreno): { valor: number; tipo: TipoPreco } | null {
  if (t.ja_possuido && fin(t.preco_pago)) return { valor: t.preco_pago, tipo: "pago" };
  const e = t.e2 ?? {}; if (fin(e.preco_fechado)) return { valor: e.preco_fechado, tipo: "fechado" }; if (fin(e.oferta)) return { valor: e.oferta, tipo: "oferta" };
  if (fin(t.preco_pedido)) return { valor: t.preco_pedido, tipo: "anunciado" }; return null;
}

export interface LinhaResolvida { linha: LinhaCatalogo; aplica: boolean; /** fora da soma do comprador (ex.: seguro de título enquanto "a negociar") */ aParte?: string; valor: Faixa3 | null; /** de onde veio o valor */ origem: "informado por mim" | "tabela oficial" | "estimativa de referência" | "preço em uso" | "sem valor"; ref?: Referencia; realizado?: number | null }
const refDe = (base: Base, id?: string) => (id ? base.referencias?.find((r) => r.id === id) : undefined);
export const semRede = (t: Terreno) => t.e2?.agua_esgoto === "poco_fossa" || respostaItem(t, "agua_esgoto") === "problema";
/** Documentos que valem para este terreno (fossa só sem rede; banco só se financiado; empresa só se o comprador for pessoa jurídica). */
export function docsDe(t: Terreno): { doc: DocCatalogo; r: DocResp }[] {
  const e = t.e2 ?? {}; const rede = e.agua_esgoto === "poco_fossa" || e.documentos?.agua_esgoto_disp?.situacao === "recebido_problema";
  return DOCS.filter((d) => !d.quando || (d.quando === "sem_rede" ? rede : d.quando === "financiado" ? e.pagamento?.forma === "financiado" : !!e.comprador_pj)).map((doc) => ({ doc, r: e.documentos?.[doc.id] ?? { situacao: "nao_pedido" as SituacaoDoc } }));
}
/** Resposta de um item de risco, a partir dos documentos que o respondem.
 * Problema: algum documento recebido marcou o item. Ok: todos os documentos ligados que se aplicam foram recebidos sem marcar o item.
 * Senão "não sei" ("não pedido" e "pedido" equivalem a "não sei"). Respostas da triagem antiga valem enquanto nenhum documento ligado tiver sido recebido. */
export function respostaItem(t: Terreno, itemId: string): "ok" | "problema" | "nao_sei" {
  const e = t.e2 ?? {}; const ds = DOCS.filter((d) => d.itens.includes(itemId)).map((d) => ({ d, r: e.documentos?.[d.id] })); const sit = (x: (typeof ds)[number]) => x.r?.situacao ?? "nao_pedido";
  if (ds.some((x) => sit(x) === "recebido_problema" && (x.r!.problemas ?? (x.d.itens.length === 1 ? x.d.itens : [])).includes(itemId))) return "problema";
  const aplicaveis = ds.filter((x) => sit(x) !== "nao_se_aplica" && !(x.d.quando === "sem_rede" && e.agua_esgoto !== "poco_fossa" && e.documentos?.agua_esgoto_disp?.situacao !== "recebido_problema"));
  const recebidos = aplicaveis.filter((x) => sit(x) === "recebido_ok" || sit(x) === "recebido_problema");
  if (recebidos.length === 0) { const antiga = e.triagem?.[itemId]?.resposta; if (antiga) return antiga; return ds.length > 0 && aplicaveis.length === 0 ? "ok" : "nao_sei"; }
  return recebidos.length === aplicaveis.length ? "ok" : "nao_sei";
}
/** Linhas de custo de aquisição de um terreno, cada uma com a origem do valor. */
export function linhasDe(base: Base, t: Terreno): LinhaResolvida[] {
  const e = t.e2 ?? {}; const pr = precoEmUso(t);
  const resolve = (l: LinhaCatalogo): LinhaResolvida & { _ap?: string } => {
    const aplica = !l.quando || (l.quando === "sem_rede" ? semRede(t) : l.quando === "isencao_agricola" ? t.isencao_agricola || respostaItem(t, "isencao_agricola") === "problema" : e.pagamento?.forma === "financiado");
    // quem paga: o seguro de título só entra no custo do comprador quando o contrato diz "comprador" (padrão: a negociar, valor mostrado à parte); o survey sai da soma só quando o vendedor paga
    const pt = e.negociacao?.paga_titulo ?? "a_negociar", ps = e.negociacao?.paga_survey ?? "a_negociar";
    const aParte = l.id === "titulo" && pt !== "comprador" ? (pt === "vendedor" ? "pago pelo vendedor" : pt === "dividido" ? "dividido: informe a sua parte" : "a negociar") : l.id === "survey" && ps === "vendedor" ? "pago pelo vendedor" : undefined;
    if (l.id === "preco") return { linha: l, aplica: true, valor: pr ? { min: pr.valor, provavel: pr.valor, max: pr.valor } : null, origem: pr ? "preço em uso" : "sem valor" };
    const inf = e.custos?.[l.id]; if (inf && completa(inf)) return { linha: l, aplica, aParte: l.id === "titulo" && aParte === "dividido: informe a sua parte" ? undefined : aParte, valor: completa(inf), origem: "informado por mim", realizado: inf.realizado };
    if (l.id === "sinal" && fin(e.sinal)) return { linha: l, aplica, valor: { min: e.sinal, provavel: e.sinal, max: e.sinal }, origem: "informado por mim" };
    if (l.id === "taxa_opcao" && fin(e.taxa_opcao)) return { linha: l, aplica, valor: { min: e.taxa_opcao, provavel: e.taxa_opcao, max: e.taxa_opcao }, origem: "informado por mim" };
    if (l.id === "titulo") { const v = pr ? seguroTitulo(pr.valor) : null; return { linha: l, aplica, aParte, valor: v === null ? null : { min: v, provavel: v, max: v }, origem: v === null ? "sem valor" : "tabela oficial" }; }
    const r = refDe(base, l.ref); let v = r ? completa(r) : null;
    if (v && r && r.unidade === "% do preço") v = pr ? { min: (v.min! * pr.valor) / 100, provavel: (v.provavel! * pr.valor) / 100, max: (v.max! * pr.valor) / 100 } : null;
    const fin2 = financiamento(pr?.valor ?? null, e);
    if (v && r && r.unidade === "% do valor financiado") v = fin2 ? { min: (v.min! * fin2.financiado) / 100, provavel: (v.provavel! * fin2.financiado) / 100, max: (v.max! * fin2.financiado) / 100 } : null;
    return { linha: l, aplica, aParte, valor: v, origem: v ? "estimativa de referência" : "sem valor", ref: v ? r : undefined };
  };
  return LINHAS.map((l) => { const x = resolve(l); return x; });
}

export type ResultadoTriagem = "nao_respondida" | "segue" | "condicoes" | "inviabilizar";
export const ROTULO_TRIAGEM: Record<ResultadoTriagem, string> = { nao_respondida: "checklist não iniciado", segue: "segue", condicoes: "segue com condições", inviabilizar: "atenção: pode inviabilizar" };
export interface ItemResolvido { item: ItemTriagem; resposta: "ok" | "problema" | "nao_sei" | null; custo: Faixa3 | null; prazo: Faixa3 | null; origemCusto: "informado por mim" | "estimativa de referência" | "sem valor"; ref?: Referencia; inviabiliza: boolean }
export function triagemDe(base: Base, t: Terreno): ItemResolvido[] {
  const e = t.e2 ?? {};
  return ITENS_TRIAGEM.map((item): ItemResolvido => { const r = e.triagem?.[item.id]; const resposta = respostaItem(t, item.id); const ref = refDe(base, item.ref);
    const custoInf = completa(r?.custo); const custo = custoInf ?? (ref ? completa(ref) : null); const prazo = completa(r?.prazo_dias) ?? (refDe(base, item.ref + "_prazo") ? completa(refDe(base, item.ref + "_prazo")) : null);
    const inviabiliza = resposta === "problema" && (!!item.podeInviabilizar || (item.id === "alagamento" && !!e.floodway_total));
    return { item, resposta, custo, prazo, origemCusto: custoInf ? "informado por mim" : custo ? "estimativa de referência" : "sem valor", ref: custoInf ? undefined : ref, inviabiliza }; });
}

export interface ResumoTerreno {
  preco: ReturnType<typeof precoEmUso>; linhas: LinhaResolvida[]; itens: ItemResolvido[];
  aquisicao: Faixa3; riscoConfirmado: Faixa3; exposicao: Faixa3; /** aquisição + risco confirmado; o máximo inclui a exposição não verificada */ comRisco: Faixa3; porCasa: Faixa3;
  resultado: ResultadoTriagem; podeInviabilizar: boolean; naoVerificados: number; /** linhas e itens que deveriam ter valor e não têm: o total está incompleto */ semValor: string[];
  prazoDias: Faixa3; financiamento: Financiamento | null; completo: boolean;
}
export function resumoTerreno(base: Base, pr: Projeto, t: Terreno): ResumoTerreno {
  const linhas = linhasDe(base, t); const itens = triagemDe(base, t); const preco = precoEmUso(t); const semValor: string[] = [];
  let aquisicao = F0; for (const l of linhas) { if (!l.aplica || l.linha.naoSoma || l.aParte) continue; if (l.valor) aquisicao = soma(aquisicao, l.valor); else semValor.push(l.linha.nome); }
  let riscoConfirmado = F0, exposicao = F0; let naoVerificados = 0;
  for (const i of itens) { if (i.resposta === "problema") { if (i.custo) riscoConfirmado = soma(riscoConfirmado, i.custo); else semValor.push(`custo de resolver: ${i.item.nome}`); }
    if (i.resposta === "nao_sei" || i.resposta === null) { naoVerificados++; if (i.resposta === "nao_sei" && i.custo) exposicao = soma(exposicao, i.custo); } }
  const comRisco: Faixa3 = { min: aquisicao.min! + riscoConfirmado.min!, provavel: aquisicao.provavel! + riscoConfirmado.provavel!, max: aquisicao.max! + riscoConfirmado.max! + exposicao.max! };
  const n = Math.max(1, pr.n_casas ?? 1); const porCasa: Faixa3 = { min: comRisco.min! / n, provavel: comRisco.provavel! / n, max: comRisco.max! / n };
  const tocou = docsDe(t).some((d) => d.r.situacao !== "nao_pedido") || Object.values(t.e2?.triagem ?? {}).some((x) => x.resposta); const respondidos = tocou ? 1 : 0; const podeInviabilizar = itens.some((i) => i.inviabiliza);
  const resultado: ResultadoTriagem = respondidos === 0 ? "nao_respondida" : podeInviabilizar ? "inviabilizar" : itens.some((i) => i.resposta === "problema") ? "condicoes" : "segue";
  // prazo até fechar: dias de hoje até a data de fechamento do contrato, quando informada
  const fech = t.e2?.negociacao?.data_fechamento; const d = fech ? Math.round((new Date(fech).getTime() - new Date(new Date().toISOString().slice(0, 10)).getTime()) / 864e5) : null;
  const prazoDias: Faixa3 = d === null ? F0 : { min: d, provavel: d, max: d };
  return { preco, linhas, itens, aquisicao, riscoConfirmado, exposicao, comRisco, porCasa, resultado, podeInviabilizar, naoVerificados, semValor, prazoDias, financiamento: financiamento(preco?.valor ?? null, t.e2), completo: !!preco && semValor.length === 0 };
}

/** Progresso do checklist: documentos recebidos ou marcados "não se aplica", sobre os que valem para o terreno. */
export function progresso(t: Terreno): { feitos: number; total: number; pct: number; problemas: number } {
  const ds = docsDe(t); const feitos = ds.filter((d) => ["recebido_ok", "recebido_problema", "nao_se_aplica"].includes(d.r.situacao)).length;
  return { feitos, total: ds.length, pct: ds.length ? Math.round((100 * feitos) / ds.length) : 0, problemas: ds.filter((d) => d.r.situacao === "recebido_problema").length };
}
export interface Vencimento { id: "opcao" | "fechamento"; nome: string; data: string; dias: number; /** documentos ainda não recebidos que dependem deste prazo */ pendentes: string[] }
/** Prazos do contrato como datas, do que vence primeiro ao que vence por último. dias < 0 = vencido. */
export function vencimentos(t: Terreno, hoje: string): Vencimento[] {
  const n = t.e2?.negociacao ?? {}; const ds = docsDe(t).filter((d) => d.r.situacao === "nao_pedido" || d.r.situacao === "pedido"); const dif = (x: string) => Math.round((new Date(x).getTime() - new Date(hoje).getTime()) / 864e5);
  const v: Vencimento[] = [];
  if (n.fim_opcao) v.push({ id: "opcao", nome: "Fim do período de opção", data: n.fim_opcao, dias: dif(n.fim_opcao), pendentes: ds.filter((d) => d.doc.momento !== "fechamento").map((d) => d.doc.nome) });
  if (n.data_fechamento) v.push({ id: "fechamento", nome: "Fechamento", data: n.data_fechamento, dias: dif(n.data_fechamento), pendentes: ds.map((d) => d.doc.nome) });
  return v.sort((a, b) => a.data.localeCompare(b.data));
}
/** Tempo estimado para receber os documentos do período de opção (o maior prazo de referência entre os pendentes). null = sem estimativa publicada. */
export function tempoDocumentos(base: Base, t: Terreno): { dias: number; ate: number; doc: string } | null {
  let m: { dias: number; ate: number; doc: string } | null = null;
  for (const d of docsDe(t)) { if (d.doc.momento !== "opcao" || !d.doc.prazoRef || d.r.situacao === "recebido_ok" || d.r.situacao === "recebido_problema" || d.r.situacao === "nao_se_aplica") continue;
    const r = refDe(base, d.doc.prazoRef); if (r?.provavel != null && (!m || r.provavel > m.dias)) m = { dias: r.provavel, ate: r.max ?? r.provavel, doc: d.doc.nome }; }
  return m;
}
/** Alerta: período de opção menor que o tempo estimado para receber os documentos do checklist. */
export function opcaoCurta(base: Base, t: Terreno): { dias: number; ate: number; doc: string } | null {
  const p = t.e2?.negociacao?.periodo_opcao_dias; const m = tempoDocumentos(base, t); return fin(p) && m && p < m.dias ? m : null;
}
/** Argumentos para negociar: problemas confirmados no checklist, com o custo estimado de resolver, e a soma. */
export function argumentos(itens: ItemResolvido[]): { itens: ItemResolvido[]; soma: Faixa3; semCusto: number } {
  const ps = itens.filter((i) => i.resposta === "problema"); let s = F0; for (const i of ps) if (i.custo) s = soma(s, i.custo);
  return { itens: ps, soma: s, semCusto: ps.filter((i) => !i.custo).length };
}
/** Mesmo terreno à vista e financiado: o que sai do bolso no fechamento, os juros do contrato e o total pago. */
export function avistaXfinanciado(r: { aquisicao: Faixa3; financiamento: Financiamento | null }): { avista: number; entradaMaisCustos: number; juros: number; totalFinanciado: number } | null {
  const f = r.financiamento; const a = r.aquisicao.provavel; if (!f || !fin(a)) return null;
  return { avista: a, entradaMaisCustos: a - f.financiado, juros: f.totalJuros, totalFinanciado: a + f.totalJuros };
}
const ROT_SIT: Record<string, { pt: string; en: string }> = { nao_pedido: { pt: "ainda não pedido", en: "not yet requested" }, pedido: { pt: "pedido, aguardando", en: "requested, waiting" } };
const MOM_EN: Record<string, string> = { antes: "Before the offer", opcao: "During the option period", fechamento: "At closing" };
/** Lista de pendências pronta para enviar ao corretor e à title company: documentos ainda não recebidos, por momento. Em português e em inglês. */
export function pendencias(t: Terreno, lingua: "pt" | "en"): string {
  const pend = docsDe(t).filter((d) => d.r.situacao === "nao_pedido" || d.r.situacao === "pedido"); const id = t.endereco || t.parcel_id || (lingua === "pt" ? "o terreno" : "the lot");
  if (!pend.length) return lingua === "pt" ? "Não há documentos pendentes no checklist deste terreno." : "There are no pending documents on the checklist for this lot.";
  const L: string[] = [lingua === "pt" ? `Olá. Sobre o terreno em ${id}${t.parcel_id && t.endereco ? ` (lote ${t.parcel_id})` : ""}, estes documentos ainda estão pendentes:` : `Hello. Regarding the lot at ${id}${t.parcel_id && t.endereco ? ` (parcel ${t.parcel_id})` : ""}, the following documents are still pending:`];
  for (const m of MOMENTOS) { const ds = pend.filter((d) => d.doc.momento === m.id); if (!ds.length) continue; L.push("", lingua === "pt" ? m.nome + ":" : MOM_EN[m.id] + ":");
    ds.forEach((d) => L.push(`- ${lingua === "pt" ? `${d.doc.nome} (${d.doc.en})` : d.doc.en} — ${ROT_SIT[d.r.situacao][lingua]}`)); }
  L.push("", lingua === "pt" ? "Pode me dizer quando cada um fica pronto? Obrigado." : "Could you let me know when each one will be ready? Thank you."); return L.join("\n");
}
export const rotuloDoc = (s: SituacaoDoc) => SITUACOES_DOC.find((x) => x.v === s)!.rotulo;
/** O que verificar primeiro: itens sem resposta ou "não sei"; primeiro os que podem inviabilizar, depois os de maior custo máximo de resolver. */
export function verificarPrimeiro(itens: ItemResolvido[]): ItemResolvido[] {
  return itens.filter((i) => i.resposta === null || i.resposta === "nao_sei").sort((a, b) => Number(!!b.item.podeInviabilizar) - Number(!!a.item.podeInviabilizar) || (b.custo?.max ?? -1) - (a.custo?.max ?? -1));
}
/** Estimativa de referência com mais de 6 meses: fica sinalizada. */
export const refVelha = (data: string | undefined, hoje: string) => !!data && (new Date(hoje).getTime() - new Date(data).getTime()) / 864e5 > 183;
