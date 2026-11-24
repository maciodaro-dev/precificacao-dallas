// Motor único da etapa 1. Lê só os parâmetros gravados no Projeto; não sabe se vieram do modo leigo ou do expert.
// Nenhum parâmetro elimina unidades: toda resposta afeta apenas a nota, e o resultado lista o que cada unidade não atende.
import type { Base, Edicao, Indicador, ParamResp, ParteInfo, Peso, Projeto, Unidade } from "./tipos";
import { indicador, numero, LETRAS, type Falha, type Linha, type Recorte } from "./ranking";
import regras from "./config/regrasLeigo.json";

export type Forma = "max" | "min" | "intervalo" | "letra" | "quer_sim" | "quer_nao" | "so_cidade" | "oferta";
export interface Opcao { rotulo: string; a: Alvo | null }
export interface Alvo { valor?: string; min?: number; max?: number; /** opção aberta "mais de X" num parâmetro do tipo "até X": a pessoa aceita qualquer valor; toda região com dado recebe nota cheia */ qualquer?: boolean }
export interface Param {
  id: string; grupo: string; nome: string; /** nome em linguagem comum */ leigo: string; forma: Forma; chave?: string; um: string; fator?: number;
  opcoes: Opcao[]; /** aceita marcar opções vizinhas, formando um intervalo */ vizinhas?: boolean; ajuda?: string; /** texto quando não atende, em linguagem comum */ falha: string;
}
const k = (n: number) => (n >= 1e6 ? `${(n / 1e6).toLocaleString("pt-BR")} milhão` : `${n / 1000} mil`);
const ate = (vs: number[], um: string, f: (n: number) => string = (n) => n.toLocaleString("pt-BR")): Opcao[] => [...vs.map((v) => ({ rotulo: `até ${f(v)}${um}`, a: { max: v } as Alvo })), ABERTA(vs[vs.length - 1], um, f)];
/** Regra geral: a última opção nunca tem teto. Em parâmetro "até X", "mais de X" = aceita qualquer valor. */
function ABERTA(ultimo: number, um: string, f: (n: number) => string): Opcao { return { rotulo: `mais de ${f(ultimo)}${um}`, a: { min: ultimo, qualquer: true } }; }
const apartir = (vs: number[], um: string, f: (n: number) => string = (n) => n.toLocaleString("pt-BR")): Opcao[] => vs.map((v) => ({ rotulo: `${f(v)}${um} ou mais`, a: { min: v } }));

// Opções iniciais em números redondos, registradas como premissa (P-007). A comparação com os quartis reais está em docs/proposta_consolidada.md; trocar as opções é decisão do usuário.
export const PARAMS: Param[] = [
  { id: "faixa", grupo: "Terra", nome: "Terreno à venda na faixa de investimento", leigo: "terreno à venda no seu orçamento", forma: "oferta", um: "anúncios", opcoes: [], falha: "não há terreno anunciado no seu orçamento",
    ajuda: "Atende a unidade que tem ao menos um terreno anunciado na faixa escolhida. Depende dos anúncios, ainda sem dado." },
  { id: "tamanho", grupo: "Terra", nome: "Tamanho do terreno", leigo: "tamanho do terreno", forma: "intervalo", chave: "c02|tamanho_tipico_acres", um: "acres", falha: "os terrenos costumam ter outro tamanho",
    vizinhas: true, opcoes: [{ rotulo: "até 0,25 acre", a: { max: 0.25 } }, { rotulo: "0,25 a 0,5 acre", a: { min: 0.25, max: 0.5 } }, { rotulo: "0,5 a 1 acre", a: { min: 0.5, max: 1 } }, { rotulo: "1 a 5 acres", a: { min: 1, max: 5 } }, { rotulo: "5 a 20 acres", a: { min: 5, max: 20 } }, { rotulo: "mais de 20 acres", a: { min: 20 } }],
    ajuda: "Pode marcar faixas vizinhas para formar um intervalo maior (ex.: 0,5 a 1 e 1 a 5 = de 0,5 a 5 acres)." },
  { id: "lote_pronto", grupo: "Terra", nome: "Lote pronto para construir", leigo: "lote pronto para construir", forma: "quer_sim", chave: "c04|lotes_prontos", um: "lotes", falha: "não há lote pronto disponível",
    opcoes: [{ rotulo: "Sim", a: { valor: "sim" } }, { rotulo: "Não", a: null }], ajuda: "Lote pronto = já registrado, com rua na frente e água, esgoto e energia na divisa." },
  { id: "liquidez_terreno", grupo: "Terra", nome: "Liquidez do terreno (dias anunciado)", leigo: "facilidade de comprar e revender terreno", forma: "max", chave: "c05|dom_terreno", um: "dias", falha: "terreno demora a negociar",
    opcoes: ate([90, 180, 365], " dias") },
  { id: "lote_minimo", grupo: "Viabilidade", nome: "Lote mínimo exigido", leigo: "tamanho mínimo de lote que a prefeitura exige", forma: "max", chave: "c06|lote_minimo_sqft", um: "sqft", falha: "a prefeitura exige lote maior", opcoes: ate([3000, 5000, 7500, 10000], " sqft") },
  { id: "taxas", grupo: "Viabilidade", nome: "Taxas por casa", leigo: "taxas da prefeitura por casa", forma: "max", chave: "c07|taxas_por_casa", um: "US$", falha: "as taxas da prefeitura são mais altas", opcoes: ate([5000, 10000, 20000, 30000], "", (n) => "$" + k(n)) },
  { id: "moratoria", grupo: "Viabilidade", nome: "Moratória de construção", leigo: "cidade sem suspensão de novas obras", forma: "quer_nao", chave: "c08|moratoria_ativa", um: "", falha: "a cidade está com novas obras suspensas",
    opcoes: [{ rotulo: "Só sem moratória", a: { valor: "nao" } }, { rotulo: "Aceito com moratória", a: null }] },
  { id: "prazo", grupo: "Viabilidade", nome: "Prazo de aprovação", leigo: "tempo de aprovação na prefeitura", forma: "max", chave: "c08|prazo_aprovacao_dias", um: "meses", fator: 30, falha: "a aprovação demora mais", opcoes: ate([3, 6, 9, 12], " meses") },
  { id: "rede", grupo: "Viabilidade", nome: "Rede de água e esgoto", leigo: "água e esgoto da cidade", forma: "quer_sim", chave: "c09|rede_esgoto", um: "", falha: "não há rede pública de água e esgoto",
    opcoes: [{ rotulo: "Exijo rede pública", a: { valor: "sim" } }, { rotulo: "Aceito poço e fossa", a: null }] },
  { id: "custo_lotear", grupo: "Viabilidade", nome: "Custo de lotear", leigo: "custo de dividir a terra em lotes", forma: "max", chave: "c10|custo_lotear_por_lote", um: "US$/lote", falha: "lotear custa mais", opcoes: ate([25000, 50000, 75000], " por lote", (n) => "$" + k(n)),
    ajuda: "Funciona como teto: atende a unidade onde lotear custa até esse valor por lote. Sem fonte pública; depende de premissa sua." },
  { id: "limites", grupo: "Viabilidade", nome: "Limites da cidade", leigo: "terreno dentro da cidade", forma: "so_cidade", um: "", falha: "fica fora dos limites de uma cidade",
    opcoes: [{ rotulo: "Só dentro da cidade", a: { valor: "nao" } }, { rotulo: "Aceito fora da cidade", a: null }] },
  { id: "dom", grupo: "Mercado", nome: "Dias para vender a casa", leigo: "rapidez para vender a casa", forma: "max", chave: "c14|dom_casa", um: "dias", falha: "as casas demoram mais a vender", opcoes: ate([30, 60, 90, 120], " dias") },
  { id: "casas_novas", grupo: "Mercado", nome: "Casas novas por ano", leigo: "mercado de casa nova ativo", forma: "min", chave: "c15|permits_unifamiliares_ano", um: "casas/ano", falha: "poucas casas novas são construídas",
    opcoes: apartir([50, 200, 500, 1000], " casas/ano"),
    ajuda: "Casas unifamiliares licenciadas no último ano, na cidade inteira. Não separa por faixa de preço." },
  { id: "builders", grupo: "Mercado", nome: "Concorrência de grandes builders", leigo: "pouca concorrência de grandes construtoras", forma: "max", chave: "c17|pct_top_builders", um: "%", falha: "grandes construtoras dominam o mercado", opcoes: ate([25, 50, 75], "%") },
  { id: "valorizacao", grupo: "Valorização", nome: "Valorização em 5 anos", leigo: "valorização dos imóveis", forma: "min", chave: "c18|valorizacao_5a", um: "%", falha: "os imóveis valorizaram menos", opcoes: [{ rotulo: "aceito negativa ou zero", a: null }, ...apartir([5, 10, 20, 30], "%")] },
  { id: "emprego", grupo: "Valorização", nome: "Tempo até polo de emprego", leigo: "proximidade de empregos", forma: "max", chave: "c19|min_polo_mais_proximo", um: "min", falha: "fica mais longe dos empregos", opcoes: ate([15, 25, 35, 45], " min"),
    ajuda: "De carro, sem trânsito; no horário de pico é mais." },
  { id: "obra", grupo: "Valorização", nome: "Obra de infraestrutura prevista", leigo: "obra pública prevista na região", forma: "quer_sim", chave: "c20|obras_previstas_usd", um: "", falha: "não há obra pública prevista",
    opcoes: [{ rotulo: "Quero obra prevista", a: { valor: "sim" } }, { rotulo: "Indiferente", a: null }] },
  { id: "isd", grupo: "Comprador", nome: "Nota do distrito escolar (ISD)", leigo: "escola bem avaliada", forma: "letra", chave: "c21|nota_isd_letra", um: "", falha: "a escola tem nota mais baixa",
    opcoes: [{ rotulo: "A", a: { valor: "A" } }, { rotulo: "B ou melhor", a: { valor: "B" } }, { rotulo: "C ou melhor", a: { valor: "C" } }] },
  { id: "seguranca", grupo: "Comprador", nome: "Segurança", leigo: "segurança", forma: "max", chave: "c22|crimes_por_mil", um: "crimes/mil hab.", falha: "há mais crimes", opcoes: ate([10, 20, 30, 40], " crimes por mil hab.") },
  { id: "renda", grupo: "Comprador", nome: "Renda das famílias", leigo: "famílias com renda para comprar", forma: "min", chave: "c23|renda_mediana", um: "US$/ano", falha: "a renda das famílias é menor", opcoes: apartir([75000, 100000, 125000, 150000], "", (n) => "$" + k(n)) },
  { id: "imposto", grupo: "Comprador", nome: "Imposto total (com MUD/PID)", leigo: "imposto anual do imóvel", forma: "max", chave: "c24|aliquota_total", um: "%", falha: "o imposto do imóvel é mais alto", opcoes: ate([1.8, 2.0, 2.2, 2.5], "%", (n) => n.toLocaleString("pt-BR", { minimumFractionDigits: 1 })) },
  { id: "mud", grupo: "Comprador", nome: "MUD ou PID (taxa extra)", leigo: "sem taxa extra de infraestrutura", forma: "quer_nao", chave: "c24|mud_pid", um: "", falha: "há taxa extra de infraestrutura (MUD/PID)",
    opcoes: [{ rotulo: "Sem MUD ou PID", a: { valor: "nao" } }, { rotulo: "Aceito MUD ou PID", a: null }] },
  { id: "alagamento", grupo: "Risco", nome: "Área em zona de alagamento (FEMA)", leigo: "pouco risco de alagamento", forma: "max", chave: "c25|pct_area_sfha", um: "%", falha: "há mais área sujeita a alagamento", opcoes: ate([5, 10, 15, 25], "%") },
  { id: "seguro", grupo: "Risco", nome: "Seguro residencial", leigo: "seguro da casa", forma: "max", chave: "c26|seguro_medio", um: "US$/ano", falha: "o seguro da casa é mais caro", opcoes: ate([2500, 3500, 4500, 6000], "", (n) => "$" + n.toLocaleString("pt-BR")) },
];
export const GRUPOS_P = [...new Set(PARAMS.map((p) => p.grupo))];
export const PRECOS: { rotulo: string; min?: number; max?: number }[] = [{ rotulo: "até $300 mil", max: 300000 }, { rotulo: "$300 a 500 mil", min: 300000, max: 500000 }, { rotulo: "$500 a 750 mil", min: 500000, max: 750000 }, { rotulo: "$750 mil a 1 milhão", min: 750000, max: 1000000 }, { rotulo: "mais de $1 milhão", min: 1000000 }];
export const PESOS: Record<Peso, number> = regras.pesos;
/** Cobertura mínima (fração do peso dos parâmetros que têm dado em alguma região) para a região não ser marcada "poucos dados". */
export const COBERTURA_MINIMA = regras.cobertura_minima_pct / 100;
const fin = (x: unknown): x is number => typeof x === "number" && isFinite(x);

/** Parâmetro em uso = tem alvo. "Indiferente" e "não se aplica" ficam sem alvo. */
export function emUso(p: Param, r: ParamResp | undefined): r is ParamResp {
  if (p.forma === "oferta") return true;
  if (!r || !r.alvo) return false; const a = r.alvo;
  if (p.forma === "quer_sim") return a.valor === "sim"; if (p.forma === "quer_nao" || p.forma === "so_cidade") return a.valor === "nao";
  if (p.forma === "letra") return !!a.valor; return fin(a.min) || fin(a.max);
}
export const ativos = (pr: Projeto) => PARAMS.filter((p) => emUso(p, pr.parametros?.[p.id]));
/** Peso alto por padrão nos parâmetros que antes eram eliminatórios. */
export const PESO_ALTO = ["faixa", "moratoria", "rede", "limites", "isd", "mud"];
export const pesoPadrao = (id: string): Peso => (PESO_ALTO.includes(id) ? "alto" : "medio");
export const pesoDe = (pr: Projeto, id: string): Peso => pr.parametros?.[id]?.peso ?? pesoPadrao(id);
export function chaveDe(p: Param, pr: Projeto) { return p.forma === "oferta" ? `c03|anuncios_na_faixa|${pr.faixa_id}` : p.chave; }

/** Nota do parâmetro, de 0 a 1; null = sem dado. Sim/não: 1 ou 0. Valor: 1 se atende, caindo com a distância ao alvo. */
export function nota(p: Param, a: Alvo, u: Unidade, i: Indicador | undefined): number | null {
  if (p.forma === "so_cidade") return u.tipo === "cidade_isd" ? 1 : 0;
  const v = i?.v; if (v === null || v === undefined || v === "") return null;
  if (p.forma === "quer_nao") return v === "nao" || v === 0 ? 1 : 0;
  if (p.forma === "quer_sim") return v === "sim" || (typeof v === "number" && v > 0) ? 1 : 0;
  if (p.forma === "oferta") { const n = numero(v); return n === null ? null : n > 0 ? 1 : 0; }
  if (p.forma === "letra") { const d = LETRAS.indexOf(String(v)) - LETRAS.indexOf(String(a.valor)); return LETRAS.indexOf(String(v)) < 0 ? null : d <= 0 ? 1 : d === 1 ? 0.5 : 0; }
  const n = numero(v); if (n === null) return null; const f = p.fator ?? 1;
  if (a.qualquer) return 1;
  const mn = fin(a.min) ? a.min * f : null, mx = fin(a.max) ? a.max * f : null;
  if (mn !== null && n < mn) return mn > 0 ? Math.max(0, n / mn) : 0;
  if (mx !== null && n > mx) return mx > 0 ? Math.max(0, 1 - (n - mx) / mx) : 0;
  return 1;
}
export function descreveAlvo(p: Param, a: Alvo | null | undefined, pr?: Projeto, base?: Base): string {
  if (p.forma === "oferta") return base?.faixas.find((f) => f.id === pr?.faixa_id)?.nome ?? "";
  if (!a) return "indiferente";
  const o = p.opcoes.find((x) => x.a && x.a.valor === a.valor && x.a.min === a.min && x.a.max === a.max && !!x.a.qualquer === !!a.qualquer); if (o) return o.rotulo;
  const usd = p.um.startsWith("US$"); const n = (x: number) => (usd ? "$" : "") + x.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  const um = usd ? (p.um === "US$/ano" ? "por ano" : p.um === "US$/lote" ? "por lote" : "") : p.um;
  return ([fin(a.min) && (fin(a.max) ? `de ${n(a.min)}` : `${n(a.min)} ou mais`), fin(a.max) && (fin(a.min) ? `a ${n(a.max)}` : `até ${n(a.max)}`)].filter(Boolean).join(" ") + ` ${um}`).trim();
}
export type { Falha };

/** A pergunta da escola é a única que divide a região. Se a nota pedida só existe em parte da cidade, valem só as partes que atendem;
 *  o resto da cidade fica de fora (no mapa, transparente). Partes pequenas demais não bastam. Se nenhuma parte atende, vale a região inteira. */
export function recortar(base: Base, edicoes: Record<string, Edicao>, u: Unidade, isdP: Param, alvo: Alvo): Recorte | undefined {
  const ps = u.partes; if (!ps || ps.length < 2 || !isdP.chave) return undefined;
  const ok = ps.filter((pt) => !pt.pequena && nota(isdP, alvo, u, indicador(base, edicoes, pt.parte_id, isdP.chave!)) === 1);
  if (!ok.length || ok.length === ps.length) return undefined;
  const soma = (f: (p: ParteInfo) => number | null) => (ok.some((p) => f(p) === null) ? null : Math.round(ok.reduce((s, p) => s + f(p)!, 0) * 10) / 10);
  const pa = soma((p) => p.pct_area), pd = soma((p) => p.pct_domicilios); const onde = u.tipo === "cidade_isd" ? "da cidade" : "fora de cidade";
  return { partes: ok, pct_area: pa, pct_domicilios: pd, texto: `só a parte no ${ok.map((p) => p.isd_nome).join(" e no ")}${pa !== null ? ` (${pa.toLocaleString("pt-BR")}% da área ${onde})` : ""}` };
}
const SO_CIDADE = ["census_acs", "census_bps", "zillow", "derivado"];
/** Valor de um indicador só para as partes do recorte. O que muda dentro da cidade (imposto, alagamento, renda por setor, tempo até o emprego) acompanha as partes;
 *  o que só existe para a cidade inteira continua o da cidade, com a marca "cidade". */
function daParte(base: Base, edicoes: Record<string, Edicao>, u: Unidade, r: Recorte, k: string): Indicador | undefined {
  const reg = indicador(base, edicoes, u.unidade_id, k); if (reg?.editado) return reg;
  const xs = r.partes.map((pt) => ({ pt, i: base.indicadores[pt.parte_id]?.[k] ?? (edicoes[`${pt.parte_id}|${k}`] ? indicador(base, edicoes, pt.parte_id, k) : undefined) }));
  if (xs.every((x) => !x.i)) return reg && reg.v != null && u.tipo === "cidade_isd" && SO_CIDADE.includes(reg.f) ? { ...reg, esc: "cidade" } : reg;
  const com = xs.map((x) => ({ pt: x.pt, i: x.i ?? reg })).filter((x): x is { pt: (typeof xs)[number]["pt"]; i: Indicador } => !!x.i && x.i.v != null);
  if (!com.length) return reg; const p0 = com[0].i; const obs = `${r.texto}. ${p0.obs}`;
  if (com.every((x) => typeof x.i.v === "number")) { const dom = (k.startsWith("c24|") || k.startsWith("c23|")) && com.every((x) => x.pt.pct_domicilios);
    const w = com.map((x) => (dom ? x.pt.pct_domicilios! : x.pt.acres) || 1e-9); const v = com.reduce((s, x, j) => s + (x.i.v as number) * w[j], 0) / w.reduce((a, b) => a + b, 0);
    return { ...p0, v: Math.round(v * 1e4) / 1e4, esc: "fatia", obs }; }
  const letras = com.map((x) => LETRAS.indexOf(String(x.i.v))); const melhor = letras.every((n) => n >= 0) ? com[letras.indexOf(Math.min(...letras))].i : p0;
  return { ...melhor, esc: "fatia", obs };
}
/** Ranking: todas as unidades, ordenadas pela nota. Sem dado não pontua: parâmetro sem dado na região sai da conta só dela. Região com cobertura abaixo do mínimo fica marcada "poucos dados" e vem depois das demais. */
export function avaliar(base: Base, pr: Projeto, edicoes: Record<string, Edicao>): Linha[] {
  const ps = ativos(pr);
  const isdP = PARAMS.find((p) => p.id === "isd")!; const isdOn = ps.includes(isdP);
  const recortes = new Map<string, Recorte>();
  if (isdOn) for (const u of base.unidades) { const r = recortar(base, edicoes, u, isdP, pr.parametros!.isd.alvo ?? {}); if (r) recortes.set(u.unidade_id, r); }
  const ind = (u: Unidade, p: Param) => { const c = chaveDe(p, pr); if (!c) return undefined; const r = recortes.get(u.unidade_id); return r ? daParte(base, edicoes, u, r, c) : indicador(base, edicoes, u.unidade_id, c); };
  const comDado = new Set(ps.filter((p) => p.forma === "so_cidade" || base.unidades.some((u) => ind(u, p)?.v != null)).map((p) => p.id));
  const total = ps.filter((p) => comDado.has(p.id)).reduce((s, p) => s + PESOS[pesoDe(pr, p.id)], 0);
  const totalUso = ps.reduce((s, p) => s + PESOS[pesoDe(pr, p.id)], 0);
  const linhas: Linha[] = base.unidades.map((u) => {
    const porCriterio: Linha["porCriterio"] = {}; const falhas: Falha[] = []; const faltam: string[] = []; let soma = 0, wReal = 0, sim = 0, n = 0, tot = total;
    for (const p of ps) {
      const r = pr.parametros?.[p.id]; const a = r?.alvo ?? {}; const i = ind(u, p); const s = nota(p, a, u, i); const w = PESOS[pesoDe(pr, p.id)];
      const bruto = p.forma === "so_cidade" ? (u.tipo === "cidade_isd" ? "dentro da cidade" : "fora da cidade") : (i?.v ?? null);
      const texto = typeof bruto === "string" ? (bruto === "sim" ? "Sim" : bruto === "nao" ? "Não" : bruto) : undefined;
      porCriterio[p.id] = { bruto: typeof bruto === "string" ? null : numero(bruto), texto, nota: s === null ? null : Math.round(s * 100), peso: total && comDado.has(p.id) ? w / total : 0, fonte: i?.v != null ? i.f : undefined, ref: i?.v != null ? i.ref : undefined, conf: i?.v != null ? i.conf : undefined, esc: i?.v != null ? i.esc : undefined };
      if (!comDado.has(p.id)) continue;
      if (s === null) { tot -= w; faltam.push(p.nome); continue; }   // sem dado não pontua: o parâmetro sai da conta só desta região
      soma += w * s;
      { wReal += w; n++; if (s >= 1) sim++; else falhas.push({ id: p.id, nome: p.nome, leigo: p.falha, s, peso: pesoDe(pr, p.id), alvo: descreveAlvo(p, r?.alvo, pr, base),
        valor: texto ?? (numero(bruto) === null ? "" : p.um.startsWith("US$") ? `$${Math.round(numero(bruto)!).toLocaleString("pt-BR")}${p.um === "US$/ano" ? " por ano" : p.um === "US$/lote" ? " por lote" : ""}` : `${(numero(bruto)! / (p.fator ?? 1)).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${p.um}`.trim()) }); }
    }
    falhas.sort((x, y) => PESOS[y.peso as Peso] - PESOS[x.peso as Peso] || x.s - y.s);
    return { u, nota: tot > 0 ? (100 * soma) / tot : null, poucosDados: total > 0 && tot / total < COBERTURA_MINIMA, faltam, cobertura: totalUso ? wReal / totalUso : 0, emUso: ps.length, porCriterio, posicao: null, recorte: recortes.get(u.unidade_id), atendidos: sim, avaliados: n, falhas };
  });
  linhas.sort((a, b) => Number(a.poucosDados) - Number(b.poucosDados) || (b.nota ?? -1) - (a.nota ?? -1) || (a.falhas?.length ?? 0) - (b.falhas?.length ?? 0) || b.cobertura - a.cobertura || a.u.nome.localeCompare(b.u.nome));
  // a posição só existe na lista principal; quem tem dados insuficientes fica numa lista separada, sem posição
  let pos = 0; linhas.forEach((l) => { l.posicao = l.nota === null || l.poucosDados ? null : ++pos; });
  return linhas;
}
/** Quantos parâmetros em uso têm dado em alguma unidade, e quais faltam. Base do aviso no topo do resultado. */
export function coberturaGeral(base: Base, pr: Projeto, edicoes: Record<string, Edicao>): { usados: number; total: number; faltam: Param[] } {
  const ps = ativos(pr);
  const tem = (p: Param) => { if (p.forma === "so_cidade") return true; const c = chaveDe(p, pr); return !!c && base.unidades.some((u) => indicador(base, edicoes, u.unidade_id, c)?.v != null); };
  const faltam = ps.filter((p) => !tem(p));
  return { usados: ps.length - faltam.length, total: ps.length, faltam };
}
/** Cobertura de uma unidade, por extenso: "45% (9 de 20)". */
export const textoCobertura = (l: Linha) => `${l.avaliados} de ${l.emUso} parâmetros, ${Math.round(l.cobertura * 100)}% do peso`;

/** Calculado e apenas exibido. Peso do terreno no preço = investimento no terreno ÷ nº de casas ÷ preço de venda. Mostra o intervalo da faixa (mínimo e máximo), não só o ponto médio. Sem faixa escolhida, não calcula. */
export function pesoTerreno(base: Base, pr: Projeto): { pct: number | null; min: number | null; max: number | null; alerta: boolean; conta: string; oQueFazer: string; semFaixa: boolean; avisos: string[] } {
  const vazio = { pct: null, min: null, max: null, alerta: false, conta: "", oQueFazer: "", avisos: [] as string[] };
  const f = base.faixas.find((x) => x.id === pr.faixa_id); if (!f) return { ...vazio, semFaixa: true };
  const nc = pr.n_casas ?? 1; const pv = pr.preco_venda; const va = pr.valores_abertos ?? {}; const avisos: string[] = []; const d = (x: number) => "$" + Math.round(x).toLocaleString("pt-BR");
  // opção aberta que entra em cálculo: usa o valor informado; sem valor, usa o piso da opção e avisa
  const invAberto = f.max === null; const invMin = invAberto ? (fin(va.investimento) ? va.investimento : f.min) : f.min, invMax = invAberto ? invMin : f.max!;
  if (invAberto && !fin(va.investimento)) avisos.push(`Investimento no terreno: você escolheu "${f.nome}" e não informou o valor. A conta está usando o mínimo, ${d(f.min)}.`);
  const pvAberto = !!pv && fin(pv.min) && !fin(pv.max);
  const preco = pv ? (fin(pv.min) && fin(pv.max) ? (pv.min + pv.max) / 2 : pvAberto ? (fin(va.preco_venda) ? va.preco_venda : pv.min!) : fin(pv.max) ? pv.max : null) : null;
  if (pvAberto && !fin(va.preco_venda)) avisos.push(`Preço de venda: você escolheu a opção aberta e não informou o valor. A conta está usando o mínimo, ${d(pv!.min!)}.`);
  if (!preco || !nc) return { ...vazio, semFaixa: false, avisos };
  const de = (inv: number) => (100 * inv) / nc / preco;
  const min = de(invMin), max = de(invMax), pct = de((invMin + invMax) / 2); const lim = regras.alerta_peso_terreno_pct;
  return { pct, min, max, semFaixa: false, alerta: max > lim, avisos,
    conta: `terreno de ${invMin === invMax ? d(invMin) : `${d(invMin)} a ${d(invMax)}`} ÷ ${nc} ${nc === 1 ? "casa" : "casas"} ÷ ${d(preco)} por casa`,
    oQueFazer: max > lim ? `Acima de ${lim}% o terreno pesa demais no preço da casa: reduza o investimento no terreno, aumente o nº de casas ou suba o preço de venda.` : "" };
}
