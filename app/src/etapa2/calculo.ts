// Cálculos da etapa 2 (aquisição do terreno). Funções puras, testadas em calculo.test.ts.
// Regra de valores: o que o usuário informa vale para o projeto ("informado por mim"); senão o cálculo oficial (seguro de título);
// senão a estimativa de referência da ferramenta; senão a linha fica SEM VALOR e o resultado diz qual ficou de fora.
import type { Base, DadosEtapa2, Faixa3, Projeto, Referencia, Terreno } from "../tipos";
import tdi from "./titulo_tdi.json";
import { ITENS_TRIAGEM, LINHAS, PRAZOS, type ItemTriagem, type LinhaCatalogo } from "./catalogo";

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

export interface LinhaResolvida { linha: LinhaCatalogo; aplica: boolean; valor: Faixa3 | null; /** de onde veio o valor */ origem: "informado por mim" | "tabela oficial" | "estimativa de referência" | "preço em uso" | "sem valor"; ref?: Referencia; realizado?: number | null }
const refDe = (base: Base, id?: string) => (id ? base.referencias?.find((r) => r.id === id) : undefined);
const semRede = (t: Terreno) => t.e2?.agua_esgoto === "poco_fossa" || t.e2?.triagem?.agua_esgoto?.resposta === "problema";
/** Linhas de custo de aquisição de um terreno, cada uma com a origem do valor. */
export function linhasDe(base: Base, t: Terreno): LinhaResolvida[] {
  const e = t.e2 ?? {}; const pr = precoEmUso(t);
  return LINHAS.map((l): LinhaResolvida => {
    const aplica = !l.quando || (l.quando === "sem_rede" ? semRede(t) : l.quando === "isencao_agricola" ? t.isencao_agricola || e.triagem?.isencao_agricola?.resposta === "problema" : e.pagamento?.forma === "financiado");
    if (l.id === "preco") return { linha: l, aplica: true, valor: pr ? { min: pr.valor, provavel: pr.valor, max: pr.valor } : null, origem: pr ? "preço em uso" : "sem valor" };
    const inf = e.custos?.[l.id]; if (inf && completa(inf)) return { linha: l, aplica, valor: completa(inf), origem: "informado por mim", realizado: inf.realizado };
    if (l.id === "sinal" && fin(e.sinal)) return { linha: l, aplica, valor: { min: e.sinal, provavel: e.sinal, max: e.sinal }, origem: "informado por mim" };
    if (l.id === "taxa_opcao" && fin(e.taxa_opcao)) return { linha: l, aplica, valor: { min: e.taxa_opcao, provavel: e.taxa_opcao, max: e.taxa_opcao }, origem: "informado por mim" };
    if (l.id === "titulo") { const v = pr ? seguroTitulo(pr.valor) : null; return { linha: l, aplica, valor: v === null ? null : { min: v, provavel: v, max: v }, origem: v === null ? "sem valor" : "tabela oficial" }; }
    const r = refDe(base, l.ref); let v = r ? completa(r) : null;
    if (v && r && r.unidade === "% do preço") v = pr ? { min: (v.min! * pr.valor) / 100, provavel: (v.provavel! * pr.valor) / 100, max: (v.max! * pr.valor) / 100 } : null;
    return { linha: l, aplica, valor: v, origem: v ? "estimativa de referência" : "sem valor", ref: v ? r : undefined };
  });
}

export type ResultadoTriagem = "nao_respondida" | "segue" | "condicoes" | "inviabilizar";
export const ROTULO_TRIAGEM: Record<ResultadoTriagem, string> = { nao_respondida: "triagem não respondida", segue: "segue", condicoes: "segue com condições", inviabilizar: "atenção: pode inviabilizar" };
export interface ItemResolvido { item: ItemTriagem; resposta: "ok" | "problema" | "nao_sei" | null; custo: Faixa3 | null; prazo: Faixa3 | null; origemCusto: "informado por mim" | "estimativa de referência" | "sem valor"; ref?: Referencia; inviabiliza: boolean }
export function triagemDe(base: Base, t: Terreno): ItemResolvido[] {
  const e = t.e2 ?? {};
  return ITENS_TRIAGEM.map((item): ItemResolvido => { const r = e.triagem?.[item.id]; const resposta = r?.resposta ?? null; const ref = refDe(base, item.ref);
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
  let aquisicao = F0; for (const l of linhas) { if (!l.aplica || l.linha.naoSoma) continue; if (l.valor) aquisicao = soma(aquisicao, l.valor); else semValor.push(l.linha.nome); }
  let riscoConfirmado = F0, exposicao = F0; let naoVerificados = 0;
  for (const i of itens) { if (i.resposta === "problema") { if (i.custo) riscoConfirmado = soma(riscoConfirmado, i.custo); else semValor.push(`custo de resolver: ${i.item.nome}`); }
    if (i.resposta === "nao_sei" || i.resposta === null) { naoVerificados++; if (i.resposta === "nao_sei" && i.custo) exposicao = soma(exposicao, i.custo); } }
  const comRisco: Faixa3 = { min: aquisicao.min! + riscoConfirmado.min!, provavel: aquisicao.provavel! + riscoConfirmado.provavel!, max: aquisicao.max! + riscoConfirmado.max! + exposicao.max! };
  const n = Math.max(1, pr.n_casas ?? 1); const porCasa: Faixa3 = { min: comRisco.min! / n, provavel: comRisco.provavel! / n, max: comRisco.max! / n };
  const respondidos = itens.filter((i) => i.resposta !== null).length; const podeInviabilizar = itens.some((i) => i.inviabiliza);
  const resultado: ResultadoTriagem = respondidos === 0 ? "nao_respondida" : podeInviabilizar ? "inviabilizar" : itens.some((i) => i.resposta === "problema") ? "condicoes" : "segue";
  // prazo: período de opção + estudos + fechamento + prazos extras dos problemas confirmados; o máximo inclui os itens "não sei"
  let prazoDias = F0; const e = t.e2 ?? {};
  for (const p of PRAZOS) { const v = completa(e.prazos?.[p.id]) ?? (refDe(base, p.ref) ? completa(refDe(base, p.ref)) : null); if (v) prazoDias = soma(prazoDias, v); else if (!t.ja_possuido) semValor.push(`prazo: ${p.nome}`); }
  for (const i of itens) { if (!i.prazo) continue; if (i.resposta === "problema") prazoDias = soma(prazoDias, i.prazo); else if (i.resposta === "nao_sei") prazoDias = { ...prazoDias, max: prazoDias.max! + i.prazo.max! }; }
  return { preco, linhas, itens, aquisicao, riscoConfirmado, exposicao, comRisco, porCasa, resultado, podeInviabilizar, naoVerificados, semValor, prazoDias, financiamento: financiamento(preco?.valor ?? null, t.e2), completo: !!preco && semValor.length === 0 };
}

/** Texto pronto para enviar ao corretor e à title company, a partir dos itens "não sei". Em português e em inglês. */
const PERGUNTA_EN: Record<string, string> = {
  zoneamento: "What is the current zoning of the lot, and does it allow a single-family home as intended?", tamanho_minimo: "Does the lot meet the minimum lot size and width required by the zoning district?",
  acesso: "Does the lot have legal access to a public road (frontage or a recorded access easement)?", agua_esgoto: "Are public water and sewer available at the lot line? If not, is a well and septic system feasible here?",
  alagamento: "Is any part of the lot in a FEMA flood zone or floodway? Is there an elevation certificate?", restricoes: "Are there recorded deed restrictions or an HOA? Please send the documents and current dues.",
  servidoes: "What easements are recorded on the lot, and where are they located?", isencao_agricola: "Does the land have an agricultural (open-space) valuation? Who pays the rollback tax if the use changes?",
  minerais: "Are the mineral rights included in the sale? Are there gas wells, pipelines or surface-use rights of third parties on or near the lot?" };
const PERGUNTA_PT: Record<string, string> = {
  zoneamento: "Qual é o zoneamento atual do lote, e ele permite a casa unifamiliar pretendida?", tamanho_minimo: "O lote atende à área e à largura mínimas exigidas pelo zoneamento?",
  acesso: "O lote tem acesso legal a uma via pública (frente para a rua ou servidão de acesso registrada)?", agua_esgoto: "Há rede pública de água e de esgoto na frente do lote? Se não houver, poço e fossa são viáveis ali?",
  alagamento: "Alguma parte do lote está em zona de alagamento ou no floodway da FEMA? Existe certificado de elevação?", restricoes: "Há restrições registradas (deed restrictions) ou associação de moradores (HOA)? Por favor, envie os documentos e o valor das taxas.",
  servidoes: "Quais servidões estão registradas no lote, e onde ficam?", isencao_agricola: "A terra tem avaliação agrícola (isenção agrícola)? Quem paga a cobrança retroativa de imposto se o uso mudar?",
  minerais: "Os direitos minerais entram na venda? Há poços de gás, dutos ou direitos de uso da superfície de terceiros no lote ou perto dele?" };
export function perguntas(t: Terreno, base: Base, lingua: "pt" | "en"): string {
  const pend = triagemDe(base, t).filter((i) => i.resposta === "nao_sei" || i.resposta === null); const id = t.endereco || t.parcel_id || "the lot";
  if (!pend.length) return lingua === "pt" ? "Não há itens em aberto na triagem deste terreno." : "There are no open screening items for this lot.";
  const cab = lingua === "pt" ? `Olá. Estou avaliando a compra do terreno em ${id}${t.parcel_id && t.endereco ? ` (lote ${t.parcel_id})` : ""}. Antes de avançar, preciso confirmar os pontos abaixo:` : `Hello. I am evaluating the purchase of the lot at ${id}${t.parcel_id && t.endereco ? ` (parcel ${t.parcel_id})` : ""}. Before moving forward, I need to confirm the following:`;
  const fim = lingua === "pt" ? "Obrigado." : "Thank you.";
  return [cab, "", ...pend.map((i, k) => `${k + 1}. ${(lingua === "pt" ? PERGUNTA_PT : PERGUNTA_EN)[i.item.id]}`), "", fim].join("\n");
}

/** O que verificar primeiro: itens sem resposta ou "não sei"; primeiro os que podem inviabilizar, depois os de maior custo máximo de resolver. */
export function verificarPrimeiro(itens: ItemResolvido[]): ItemResolvido[] {
  return itens.filter((i) => i.resposta === null || i.resposta === "nao_sei").sort((a, b) => Number(!!b.item.podeInviabilizar) - Number(!!a.item.podeInviabilizar) || (b.custo?.max ?? -1) - (a.custo?.max ?? -1));
}
/** Estimativa de referência com mais de 6 meses: fica sinalizada. */
export const refVelha = (data: string | undefined, hoje: string) => !!data && (new Date(hoje).getTime() - new Date(data).getTime()) / 864e5 > 183;
