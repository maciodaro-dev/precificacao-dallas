// Motor único da etapa 1. Lê só os parâmetros gravados no Projeto; não sabe se vieram do modo leigo ou do expert.
// Nenhum parâmetro elimina unidades: toda resposta afeta apenas a nota, e o resultado lista o que cada unidade não atende.
import type { Base, Edicao, Indicador, ParamResp, Peso, Projeto, Unidade } from "./tipos";
import { indicador, numero, LETRAS, type Linha } from "./ranking";
import regras from "./config/regrasLeigo.json";

export type Forma = "max" | "min" | "intervalo" | "letra" | "quer_sim" | "quer_nao" | "so_cidade" | "oferta";
export interface Opcao { rotulo: string; a: Alvo | null }
export interface Alvo { valor?: string; min?: number; max?: number }
export interface Param {
  id: string; grupo: string; nome: string; /** nome em linguagem comum */ leigo: string; forma: Forma; chave?: string; um: string; fator?: number;
  opcoes: Opcao[]; ajuda?: string; /** texto quando não atende, em linguagem comum */ falha: string;
}
const k = (n: number) => (n >= 1e6 ? `${(n / 1e6).toLocaleString("pt-BR")} milhão` : `${n / 1000} mil`);
const ate = (vs: number[], um: string, f: (n: number) => string = (n) => n.toLocaleString("pt-BR")): Opcao[] => vs.map((v) => ({ rotulo: `até ${f(v)}${um}`, a: { max: v } }));
const apartir = (vs: number[], um: string, f: (n: number) => string = (n) => n.toLocaleString("pt-BR")): Opcao[] => vs.map((v) => ({ rotulo: `${f(v)}${um} ou mais`, a: { min: v } }));

// As opções com dado real foram recalibradas pelos quartis da base em 2026-11-24 (imposto, alagamento, emprego, valorização, casas novas, renda). As demais são premissa (P-007).
export const PARAMS: Param[] = [
  { id: "faixa", grupo: "Terra", nome: "Terreno à venda na faixa de investimento", leigo: "terreno à venda no seu orçamento", forma: "oferta", um: "anúncios", opcoes: [], falha: "não há terreno anunciado no seu orçamento",
    ajuda: "Atende a unidade que tem ao menos um terreno anunciado na faixa escolhida. Depende dos anúncios, ainda sem dado." },
  { id: "tamanho", grupo: "Terra", nome: "Tamanho do terreno", leigo: "tamanho do terreno", forma: "intervalo", chave: "c02|tamanho_tipico_acres", um: "acres", falha: "os terrenos costumam ter outro tamanho",
    opcoes: [{ rotulo: "até 0,25 acre", a: { max: 0.25 } }, { rotulo: "até 0,5 acre", a: { max: 0.5 } }, { rotulo: "0,5 a 1 acre", a: { min: 0.5, max: 1 } }, { rotulo: "0,5 a 5 acres", a: { min: 0.5, max: 5 } }, { rotulo: "1 a 20 acres", a: { min: 1, max: 20 } }, { rotulo: "5 acres ou mais", a: { min: 5 } }] },
  { id: "lote_pronto", grupo: "Terra", nome: "Lote pronto para construir", leigo: "lote pronto para construir", forma: "quer_sim", chave: "c04|lotes_prontos", um: "lotes", falha: "não há lote pronto disponível",
    opcoes: [{ rotulo: "Sim", a: { valor: "sim" } }, { rotulo: "Indiferente", a: null }], ajuda: "Lote pronto = já registrado, com rua na frente e água, esgoto e energia na divisa." },
  { id: "liquidez_terreno", grupo: "Terra", nome: "Liquidez do terreno (dias anunciado)", leigo: "facilidade de comprar e revender terreno", forma: "max", chave: "c05|dom_terreno", um: "dias", falha: "terreno demora a negociar",
    opcoes: ate([90, 180, 365], " dias") },
  { id: "lote_minimo", grupo: "Viabilidade", nome: "Lote mínimo exigido", leigo: "tamanho mínimo de lote que a prefeitura exige", forma: "max", chave: "c06|lote_minimo_sqft", um: "sqft", falha: "a prefeitura exige lote maior", opcoes: ate([3000, 5000, 7500, 10000], " sqft") },
  { id: "taxas", grupo: "Viabilidade", nome: "Taxas por casa", leigo: "taxas da prefeitura por casa", forma: "max", chave: "c07|taxas_por_casa", um: "US$", falha: "as taxas da prefeitura são mais altas", opcoes: ate([5000, 10000, 20000, 30000], "", (n) => "$" + k(n)) },
  { id: "moratoria", grupo: "Viabilidade", nome: "Moratória de construção", leigo: "cidade sem suspensão de novas obras", forma: "quer_nao", chave: "c08|moratoria_ativa", um: "", falha: "a cidade está com novas obras suspensas",
    opcoes: [{ rotulo: "Só sem moratória", a: { valor: "nao" } }, { rotulo: "Aceito com moratória", a: null }] },
  { id: "prazo", grupo: "Viabilidade", nome: "Prazo de aprovação", leigo: "tempo de aprovação na prefeitura", forma: "max", chave: "c08|prazo_aprovacao_dias", um: "meses", fator: 30, falha: "a aprovação demora mais", opcoes: ate([3, 6, 9, 12], " meses") },
  { id: "rede", grupo: "Viabilidade", nome: "Rede de água e esgoto", leigo: "água e esgoto da cidade", forma: "quer_sim", chave: "c09|rede_esgoto", um: "", falha: "não há rede pública de água e esgoto",
    opcoes: [{ rotulo: "Exijo rede pública", a: { valor: "sim" } }, { rotulo: "Aceito poço e fossa", a: null }] },
  { id: "custo_lotear", grupo: "Viabilidade", nome: "Custo de lotear", leigo: "custo de dividir a terra em lotes", forma: "max", chave: "c10|custo_lotear_por_lote", um: "US$/lote", falha: "lotear custa mais", opcoes: ate([25000, 50000, 75000, 100000], " por lote", (n) => "$" + k(n)) },
  { id: "limites", grupo: "Viabilidade", nome: "Limites da cidade", leigo: "terreno dentro da cidade", forma: "so_cidade", um: "", falha: "fica fora dos limites de uma cidade",
    opcoes: [{ rotulo: "Só dentro da cidade", a: { valor: "nao" } }, { rotulo: "Aceito fora da cidade", a: null }] },
  { id: "dom", grupo: "Mercado", nome: "Dias para vender a casa", leigo: "rapidez para vender a casa", forma: "max", chave: "c14|dom_casa", um: "dias", falha: "as casas demoram mais a vender", opcoes: ate([30, 60, 90, 120], " dias") },
  { id: "casas_novas", grupo: "Mercado", nome: "Casas novas por ano", leigo: "mercado de casa nova ativo", forma: "min", chave: "c15|permits_unifamiliares_ano", um: "casas/ano", falha: "poucas casas novas são construídas",
    opcoes: apartir([50, 150, 400, 1500], " casas/ano") },
  { id: "builders", grupo: "Mercado", nome: "Concorrência de grandes builders", leigo: "pouca concorrência de grandes construtoras", forma: "max", chave: "c17|pct_top_builders", um: "%", falha: "grandes construtoras dominam o mercado", opcoes: ate([25, 50, 75], "%") },
  { id: "valorizacao", grupo: "Valorização", nome: "Valorização em 5 anos", leigo: "valorização dos imóveis", forma: "min", chave: "c18|valorizacao_5a", um: "%", falha: "os imóveis valorizaram menos", opcoes: apartir([5, 10, 15, 20], "%") },
  { id: "emprego", grupo: "Valorização", nome: "Tempo até polo de emprego", leigo: "proximidade de empregos", forma: "max", chave: "c19|min_polo_mais_proximo", um: "min", falha: "fica mais longe dos empregos", opcoes: ate([15, 20, 25, 35], " min"),
    ajuda: "De carro, sem trânsito; no horário de pico é mais." },
  { id: "obra", grupo: "Valorização", nome: "Obra de infraestrutura prevista", leigo: "obra pública prevista na região", forma: "quer_sim", chave: "c20|obras_previstas_usd", um: "", falha: "não há obra pública prevista",
    opcoes: [{ rotulo: "Quero obra prevista", a: { valor: "sim" } }, { rotulo: "Indiferente", a: null }] },
  { id: "isd", grupo: "Comprador", nome: "Nota do distrito escolar (ISD)", leigo: "escola bem avaliada", forma: "letra", chave: "c21|nota_isd_letra", um: "", falha: "a escola tem nota mais baixa",
    opcoes: [{ rotulo: "A", a: { valor: "A" } }, { rotulo: "B ou melhor", a: { valor: "B" } }, { rotulo: "C ou melhor", a: { valor: "C" } }] },
  { id: "seguranca", grupo: "Comprador", nome: "Segurança", leigo: "segurança", forma: "max", chave: "c22|crimes_por_mil", um: "crimes/mil hab.", falha: "há mais crimes", opcoes: ate([10, 20, 30, 40], " crimes por mil hab.") },
  { id: "renda", grupo: "Comprador", nome: "Renda das famílias", leigo: "famílias com renda para comprar", forma: "min", chave: "c23|renda_mediana", um: "US$/ano", falha: "a renda das famílias é menor", opcoes: apartir([75000, 85000, 110000, 130000], "", (n) => "$" + k(n)) },
  { id: "imposto", grupo: "Comprador", nome: "Imposto total (com MUD/PID)", leigo: "imposto anual do imóvel", forma: "max", chave: "c24|aliquota_total", um: "%", falha: "o imposto do imóvel é mais alto", opcoes: ate([1.7, 1.9, 2.0, 2.2], "%") },
  { id: "mud", grupo: "Comprador", nome: "MUD ou PID (taxa extra)", leigo: "sem taxa extra de infraestrutura", forma: "quer_nao", chave: "c24|mud_pid", um: "", falha: "há taxa extra de infraestrutura (MUD/PID)",
    opcoes: [{ rotulo: "Sem MUD ou PID", a: { valor: "nao" } }, { rotulo: "Aceito MUD ou PID", a: null }] },
  { id: "alagamento", grupo: "Risco", nome: "Área em zona de alagamento (FEMA)", leigo: "pouco risco de alagamento", forma: "max", chave: "c25|pct_area_sfha", um: "%", falha: "há mais área sujeita a alagamento", opcoes: ate([5, 10, 20, 35], "%") },
  { id: "seguro", grupo: "Risco", nome: "Seguro residencial", leigo: "seguro da casa", forma: "max", chave: "c26|seguro_medio", um: "US$/ano", falha: "o seguro da casa é mais caro", opcoes: ate([2500, 3500, 4500, 6000], "", (n) => "$" + n.toLocaleString("pt-BR")) },
];
export const GRUPOS_P = [...new Set(PARAMS.map((p) => p.grupo))];
export const PRECOS: { rotulo: string; min?: number; max?: number }[] = [{ rotulo: "até $300 mil", max: 300000 }, { rotulo: "$300 a 500 mil", min: 300000, max: 500000 }, { rotulo: "$500 a 750 mil", min: 500000, max: 750000 }, { rotulo: "$750 mil a 1 milhão", min: 750000, max: 1000000 }, { rotulo: "mais de $1 milhão", min: 1000000 }];
export const PESOS: Record<Peso, number> = regras.pesos;
export const SEM_DADO = regras.nota_sem_dado;
const fin = (x: unknown): x is number => typeof x === "number" && isFinite(x);

/** Parâmetro em uso = tem alvo. "Indiferente" e "não se aplica" ficam sem alvo. */
export function emUso(p: Param, r: ParamResp | undefined): r is ParamResp {
  if (p.forma === "oferta") return true;
  if (!r || !r.alvo) return false; const a = r.alvo;
  if (p.forma === "quer_sim") return a.valor === "sim"; if (p.forma === "quer_nao" || p.forma === "so_cidade") return a.valor === "nao";
  if (p.forma === "letra") return !!a.valor; return fin(a.min) || fin(a.max);
}
export const ativos = (pr: Projeto) => PARAMS.filter((p) => emUso(p, pr.parametros?.[p.id]));
export const pesoDe = (pr: Projeto, id: string): Peso => pr.parametros?.[id]?.peso ?? (id === "faixa" ? "alto" : "medio");
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
  const mn = fin(a.min) ? a.min * f : null, mx = fin(a.max) ? a.max * f : null;
  if (mn !== null && n < mn) return mn > 0 ? Math.max(0, n / mn) : 0;
  if (mx !== null && n > mx) return mx > 0 ? Math.max(0, 1 - (n - mx) / mx) : 0;
  return 1;
}
export function descreveAlvo(p: Param, a: Alvo | null | undefined, pr?: Projeto, base?: Base): string {
  if (p.forma === "oferta") return base?.faixas.find((f) => f.id === pr?.faixa_id)?.nome ?? "";
  if (!a) return "indiferente";
  const o = p.opcoes.find((x) => x.a && x.a.valor === a.valor && x.a.min === a.min && x.a.max === a.max); if (o) return o.rotulo;
  const usd = p.um.startsWith("US$"); const n = (x: number) => (usd ? "$" : "") + x.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  const um = usd ? (p.um === "US$/ano" ? "por ano" : p.um === "US$/lote" ? "por lote" : "") : p.um;
  return ([fin(a.min) && (fin(a.max) ? `de ${n(a.min)}` : `${n(a.min)} ou mais`), fin(a.max) && (fin(a.min) ? `a ${n(a.max)}` : `até ${n(a.max)}`)].filter(Boolean).join(" ") + ` ${um}`).trim();
}
export interface Falha { id: string; nome: string; leigo: string; s: number; valor: string; alvo: string; peso: Peso }

/** Ranking: todas as unidades, ordenadas pela nota. Parâmetro sem dado em nenhuma unidade fica fora da conta; unidade sem dado num parâmetro recebe nota neutra. */
export function avaliar(base: Base, pr: Projeto, edicoes: Record<string, Edicao>): Linha[] {
  const ps = ativos(pr);
  const ind = (u: Unidade, p: Param) => { const c = chaveDe(p, pr); return c ? indicador(base, edicoes, u.unidade_id, c) : undefined; };
  const comDado = new Set(ps.filter((p) => p.forma === "so_cidade" || base.unidades.some((u) => ind(u, p)?.v != null)).map((p) => p.id));
  const total = ps.filter((p) => comDado.has(p.id)).reduce((s, p) => s + PESOS[pesoDe(pr, p.id)], 0);
  const linhas: Linha[] = base.unidades.map((u) => {
    const porCriterio: Linha["porCriterio"] = {}; const falhas: Falha[] = []; let soma = 0, wReal = 0, sim = 0, n = 0;
    for (const p of ps) {
      const r = pr.parametros?.[p.id]; const a = r?.alvo ?? {}; const i = ind(u, p); const s = nota(p, a, u, i); const w = PESOS[pesoDe(pr, p.id)];
      const bruto = p.forma === "so_cidade" ? (u.tipo === "cidade_isd" ? "dentro da cidade" : "fora da cidade") : (i?.v ?? null);
      const texto = typeof bruto === "string" ? (bruto === "sim" ? "Sim" : bruto === "nao" ? "Não" : bruto) : undefined;
      porCriterio[p.id] = { bruto: typeof bruto === "string" ? null : numero(bruto), texto, nota: s === null ? null : Math.round(s * 100), peso: total && comDado.has(p.id) ? w / total : 0 };
      if (!comDado.has(p.id)) continue;
      soma += w * (s ?? SEM_DADO);
      if (s !== null) { wReal += w; n++; if (s >= 1) sim++; else falhas.push({ id: p.id, nome: p.nome, leigo: p.falha, s, peso: pesoDe(pr, p.id), alvo: descreveAlvo(p, r?.alvo, pr, base),
        valor: texto ?? (numero(bruto) === null ? "" : p.um.startsWith("US$") ? `$${Math.round(numero(bruto)!).toLocaleString("pt-BR")}${p.um === "US$/ano" ? " por ano" : p.um === "US$/lote" ? " por lote" : ""}` : `${(numero(bruto)! / (p.fator ?? 1)).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${p.um}`.trim()) }); }
    }
    falhas.sort((x, y) => PESOS[y.peso] - PESOS[x.peso] || x.s - y.s);
    return { u, nota: total ? (100 * soma) / total : null, cobertura: total ? wReal / total : 0, porCriterio, eliminada: [], posicao: null, atendidos: sim, avaliados: n, falhas };
  });
  linhas.sort((a, b) => (b.nota ?? -1) - (a.nota ?? -1) || (a.falhas?.length ?? 0) - (b.falhas?.length ?? 0) || b.cobertura - a.cobertura || a.u.nome.localeCompare(b.u.nome));
  linhas.forEach((l, i) => { l.posicao = l.nota === null ? null : i + 1; });
  return linhas;
}
/** Calculados e apenas exibidos. Peso do terreno no preço = investimento / nº de casas / preço de venda (pontos médios das faixas). */
export function pesoTerreno(base: Base, pr: Projeto): { pct: number | null; alerta: boolean; conta: string } {
  const f = base.faixas.find((x) => x.id === pr.faixa_id); const inv = f ? (f.min + f.max) / 2 : null; const nc = pr.n_casas ?? 1; const pv = pr.preco_venda;
  const preco = pv ? (fin(pv.min) && fin(pv.max) ? (pv.min + pv.max) / 2 : fin(pv.max) ? pv.max : fin(pv.min) ? pv.min : null) : null;
  if (!inv || !preco || !nc) return { pct: null, alerta: false, conta: "" };
  const pct = (100 * inv) / nc / preco; const d = (x: number) => "$" + Math.round(x).toLocaleString("pt-BR");
  return { pct, alerta: pct > regras.alerta_peso_terreno_pct, conta: `${d(inv)} de terreno ÷ ${nc} ${nc === 1 ? "casa" : "casas"} ÷ ${d(preco)} por casa (pontos médios das faixas)` };
}
