// Critérios definidos: cada um é um botão. Ligado, vale como critério; os que pedem número abrem um campo para digitar.
// "cenario" = a resposta não avalia a cidade; ela muda o que entra como custo ou prazo nas etapas seguintes.
import type { Base, Edicao, Indicador, Projeto, Resposta, Unidade } from "./tipos";
import { indicador, numero, LETRAS, type Linha, type Motivo } from "./ranking";

export type TipoDef = "max" | "min" | "intervalo" | "letra" | "exige" | "nao_aceita" | "so_cidade" | "cenario_simnao" | "cenario_numero";
export interface Definicao {
  id: string; rotulo: string; crit: string; grupo: string; pergunta: string; tipo: TipoDef; chave?: string; um?: string; ajuda?: string;
  /** só aparece quando a resposta "lote pronto" é não */ so_terra_bruta?: boolean; passo?: number; fator?: number;
}
export const DEFS: Definicao[] = [
  { id: "tamanho", rotulo: "Tamanho do terreno", crit: "c02", grupo: "Terra", pergunta: "Tamanho do terreno", tipo: "intervalo", chave: "c02|tamanho_tipico_acres", um: "acres", passo: 0.05,
    ajuda: "Mínimo e máximo que você procura. Atende a cidade cujo tamanho típico de terreno anunciado cai nesse intervalo." },
  { id: "lote_pronto", rotulo: "Lote pronto para construir", crit: "c04", grupo: "Terra", pergunta: "Quer lote pronto para construir?", tipo: "cenario_simnao",
    ajuda: "Lote pronto = já registrado (platted), com rua na frente e água, esgoto e energia na divisa. Se sim, saem os critérios de rede, custo de lotear e terra fora da cidade. Se não, o que falta (platting, redes, rua, drenagem, supressão de vegetação, terraplenagem) entra como custo nas etapas 3 e 4." },
  { id: "tempo_compra", rotulo: "Contar o tempo de compra como custo", crit: "c05", grupo: "Terra", pergunta: "Contar como custo o tempo de procurar e fechar a compra do terreno?", tipo: "cenario_simnao",
    ajuda: "Se sim, esses meses entram no carregamento (etapa 6), usando os dias que um terreno fica anunciado na cidade." },
  { id: "lote_minimo", rotulo: "Lote mínimo exigido", crit: "c06", grupo: "Viabilidade", pergunta: "Lote mínimo que a cidade pode exigir, no máximo", tipo: "max", chave: "c06|lote_minimo_sqft", um: "sqft",
    ajuda: "Atende a cidade cujo zoneamento unifamiliar exige lote igual ou menor que este número." },
  { id: "taxas", rotulo: "Taxas por casa", crit: "c07", grupo: "Viabilidade", pergunta: "Taxas municipais por casa, no máximo", tipo: "max", chave: "c07|taxas_por_casa", um: "US$",
    ajuda: "Impact fees, permit e parkland somados. O valor real da cidade entra como custo na etapa 3." },
  { id: "moratoria", rotulo: "Sem moratória ativa", crit: "c08", grupo: "Viabilidade", pergunta: "Aceita cidade com moratória de construção ativa?", tipo: "nao_aceita", chave: "c08|moratoria_ativa",
    ajuda: "Se não, só atende a cidade sem moratória em vigor." },
  { id: "prazo", rotulo: "Prazo de aprovação", crit: "c08", grupo: "Viabilidade", pergunta: "Prazo de aprovação, no máximo", tipo: "max", chave: "c08|prazo_aprovacao_dias", um: "meses", fator: 30,
    ajuda: "Do protocolo ao permit. O prazo real da cidade entra como custo de carregamento na etapa 6." },
  { id: "rede", rotulo: "Com rede pública de água e esgoto", crit: "c09", grupo: "Viabilidade", pergunta: "Exige rede pública de água e esgoto?", tipo: "exige", chave: "c09|rede_esgoto", so_terra_bruta: true,
    ajuda: "Se sim, só atende onde há rede. Se não, poço e fossa entram como custo na etapa 4." },
  { id: "custo_lotear", rotulo: "Custo de lotear", crit: "c10", grupo: "Viabilidade", pergunta: "Quanto você estima para lotear, por lote", tipo: "cenario_numero", um: "US$", so_terra_bruta: true,
    ajuda: "Não tem fonte pública: é premissa sua, registrada com data. Entra como custo na etapa 4." },
  { id: "etj", rotulo: "Só dentro dos limites da cidade", crit: "c11", grupo: "Viabilidade", pergunta: "Aceita terreno fora dos limites da cidade (área não incorporada)?", tipo: "so_cidade", so_terra_bruta: true,
    ajuda: "Fora da cidade há menos regra municipal, mas pode faltar rede e existir taxa de MUD. Se não, as áreas não incorporadas saem do resultado." },
  { id: "margem", rotulo: "Margem potencial", crit: "c12", grupo: "Mercado", pergunta: "Margem potencial, no mínimo", tipo: "min", chave: "c12|margem_potencial", um: "%", ajuda: "Preço de venda menos terreno, construção e taxas. Depende de dados ainda não coletados." },
  { id: "terreno_preco", rotulo: "Peso do terreno no preço", crit: "c13", grupo: "Mercado", pergunta: "Peso do terreno no preço final da casa, no máximo", tipo: "max", chave: "c13|relacao_terreno_preco", um: "%" },
  { id: "dom", rotulo: "Dias para vender a casa", crit: "c14", grupo: "Mercado", pergunta: "Dias para vender a casa, no máximo", tipo: "max", chave: "c14|dom_casa", um: "dias", ajuda: "Dias no mercado da cidade. O valor real entra como custo de carregamento na etapa 6." },
  { id: "absorcao", rotulo: "Casas novas por ano", crit: "c15", grupo: "Mercado", pergunta: "Casas novas licenciadas por ano, no mínimo", tipo: "min", chave: "c15|permits_unifamiliares_ano", um: "casas/ano", ajuda: "Mostra se o mercado de casa nova da cidade é ativo." },
  { id: "preco_casa", rotulo: "Preço de venda da casa", crit: "c16", grupo: "Mercado", pergunta: "Preço de venda da casa que você quer construir", tipo: "intervalo", chave: "c16|valor_tipico_casa", um: "US$", passo: 10000,
    ajuda: "Atende a cidade cujo valor típico de casa cai nesse intervalo." },
  { id: "builders", rotulo: "Concorrência de grandes builders", crit: "c17", grupo: "Mercado", pergunta: "Participação dos grandes builders nos permits, no máximo", tipo: "max", chave: "c17|pct_top_builders", um: "%" },
  { id: "valorizacao", rotulo: "Valorização em 5 anos", crit: "c18", grupo: "Valorização", pergunta: "Valorização em 5 anos, no mínimo", tipo: "min", chave: "c18|valorizacao_5a", um: "%" },
  { id: "emprego", rotulo: "Perto de polo de emprego", crit: "c19", grupo: "Valorização", pergunta: "Tempo de carro até um polo de emprego, no máximo", tipo: "max", chave: "c19|min_polo_mais_proximo", um: "min", ajuda: "Sem trânsito; no horário de pico é mais." },
  { id: "obras", rotulo: "Com obra de infraestrutura prevista", crit: "c20", grupo: "Valorização", pergunta: "Exige obra de infraestrutura prevista na região?", tipo: "exige", chave: "c20|obras_previstas_usd" },
  { id: "isd", rotulo: "Nota do distrito escolar", crit: "c21", grupo: "Comprador", pergunta: "Nota mínima do distrito escolar (TEA)", tipo: "letra", chave: "c21|nota_isd_letra" },
  { id: "crime", rotulo: "Segurança", crit: "c22", grupo: "Comprador", pergunta: "Crimes por mil habitantes, no máximo", tipo: "max", chave: "c22|crimes_por_mil", um: "por mil" },
  { id: "renda", rotulo: "Renda das famílias", crit: "c23", grupo: "Comprador", pergunta: "Renda mediana das famílias, no mínimo", tipo: "min", chave: "c23|renda_mediana", um: "US$/ano", passo: 5000 },
  { id: "imposto", rotulo: "Property tax", crit: "c24", grupo: "Comprador", pergunta: "Property tax total, no máximo", tipo: "max", chave: "c24|aliquota_total", um: "%", passo: 0.05, ajuda: "A alíquota real entra como custo na etapa 6 e pesa na parcela do comprador." },
  { id: "mud", rotulo: "Sem MUD ou PID", crit: "c24", grupo: "Comprador", pergunta: "Aceita terreno em MUD ou PID (taxa extra de infraestrutura)?", tipo: "nao_aceita", chave: "c24|mud_pid" },
  { id: "alagamento", rotulo: "Fora de zona de alagamento", crit: "c25", grupo: "Risco", pergunta: "Área da cidade em zona de alagamento (FEMA), no máximo", tipo: "max", chave: "c25|pct_area_sfha", um: "%" },
  { id: "seguro", rotulo: "Seguro residencial", crit: "c26", grupo: "Risco", pergunta: "Seguro residencial médio, no máximo", tipo: "max", chave: "c26|seguro_medio", um: "US$/ano" },
];
export const GRUPOS_DEF = [...new Set(DEFS.map((d) => d.grupo))];
const num = (x: unknown): number | null => (typeof x === "number" && isFinite(x) ? x : null);

/** A definição restringe alguma coisa com a resposta dada? (cenários nunca restringem) */
export function ativa(d: Definicao, r: Resposta | undefined, resp: Record<string, Resposta>): boolean {
  if (!r || !r.ativo || d.tipo === "cenario_simnao" || d.tipo === "cenario_numero") return false;
  if (d.so_terra_bruta && lotePronto(resp)) return false;
  if (d.tipo === "intervalo") return num(r.min) !== null || num(r.max) !== null;
  if (d.tipo === "exige") return r.v === "sim";
  if (d.tipo === "nao_aceita" || d.tipo === "so_cidade") return r.v === "nao";
  if (d.tipo === "letra") return typeof r.v === "string" && r.v !== "";
  return num(r.v) !== null;
}
export const lotePronto = (resp: Record<string, Resposta>) => !!resp.lote_pronto?.ativo && resp.lote_pronto.v === "sim";
export const visivel = (d: Definicao, resp: Record<string, Resposta>) => !(d.so_terra_bruta && lotePronto(resp));
/** Valor que o botão assume ao ser ligado, para os critérios em que ligar já é a resposta. */
export const aoLigar = (d: Definicao): Partial<Resposta> => d.tipo === "exige" || d.tipo === "cenario_simnao" ? { v: "sim" } : d.tipo === "nao_aceita" || d.tipo === "so_cidade" ? { v: "nao" } : {};
export const soBotao = (d: Definicao) => ["exige", "nao_aceita", "so_cidade", "cenario_simnao"].includes(d.tipo);
export function ativas(p: Projeto): Definicao[] { const r = p.respostas ?? {}; return DEFS.filter((d) => ativa(d, r[d.id], r)); }

/** true = atende, false = não atende, null = sem dado */
export function atende(d: Definicao, r: Resposta, u: Unidade, i: Indicador | undefined): boolean | null {
  if (d.tipo === "so_cidade") return u.tipo === "cidade_isd";
  const v = i?.v; if (v === null || v === undefined || v === "") return null;
  if (d.tipo === "letra") { const a = LETRAS.indexOf(String(v)), b = LETRAS.indexOf(String(r.v)); return a < 0 || b < 0 ? null : a <= b; }
  if (d.tipo === "nao_aceita") return v === "nao" || v === 0;
  if (d.tipo === "exige") return v === "sim" || (typeof v === "number" && v > 0);
  const n = numero(v); if (n === null) return null; const f = d.fator ?? 1;
  if (d.tipo === "max") return n <= num(r.v)! * f;
  if (d.tipo === "min") return n >= num(r.v)! * f;
  return (num(r.min) === null || n >= num(r.min)!) && (num(r.max) === null || n <= num(r.max)!);
}
export function descreve(d: Definicao, r: Resposta): string {
  const n = (x: unknown) => (typeof x === "number" ? x.toLocaleString("pt-BR") : "");
  if (d.tipo === "intervalo") return [num(r.min) !== null && `de ${n(r.min)}`, num(r.max) !== null && `até ${n(r.max)}`].filter(Boolean).join(" ") + ` ${d.um}`;
  if (d.tipo === "max") return `até ${n(r.v)} ${d.um}`; if (d.tipo === "min") return `a partir de ${n(r.v)} ${d.um}`;
  if (d.tipo === "letra") return `${r.v} ou melhor`; if (d.tipo === "exige") return "exige"; return "não aceita";
}

/** Resultado por critérios definidos. "nota" = % do peso dos critérios com dado que a unidade atende; "cobertura" = fração do peso que tinha dado.
 *  A ordem é pelo peso total atendido (pontos), para que uma cidade com pouco dado não passe na frente só por ter 1 de 1.
 *  Critério marcado como obrigatório elimina quem não atende. */
export function avaliar(base: Base, p: Projeto, edicoes: Record<string, Edicao>): Linha[] {
  const resp = p.respostas ?? {}; const defs = ativas(p);
  const peso = (id: string) => { const w = resp[id]?.peso; return typeof w === "number" && isFinite(w) && w >= 0 ? w : 1; };
  const total = defs.reduce((a, d) => a + peso(d.id), 0);
  const linhas: Linha[] = base.unidades.map((u) => {
    const porCriterio: Linha["porCriterio"] = {}; const eliminada: Motivo[] = []; let sim = 0, comDado = 0, wSim = 0, wDado = 0;
    for (const d of defs) {
      const i = d.chave ? indicador(base, edicoes, u.unidade_id, d.chave) : undefined; const r = resp[d.id]; const ok = atende(d, r, u, i); const w = peso(d.id);
      const bruto = d.tipo === "so_cidade" ? (u.tipo === "cidade_isd" ? "cidade" : "não incorporada") : (i?.v ?? null);
      porCriterio[d.id] = { bruto: typeof bruto === "string" ? null : numero(bruto), texto: typeof bruto === "string" ? (bruto === "sim" ? "Sim" : bruto === "nao" ? "Não" : bruto) : undefined,
        nota: ok === null ? null : ok ? 100 : 0, peso: total ? w / total : 0 };
      if (ok !== null) { comDado++; wDado += w; if (ok) { sim++; wSim += w; } }
      if (r.obrigatorio && (ok === false || (ok === null && p.filtros.eliminar_sem_dado))) eliminada.push({ filtro: d.pergunta, semDado: ok === null });
    }
    return { u, nota: wDado > 0 ? (100 * wSim) / wDado : comDado ? 0 : null, cobertura: total ? wDado / total : 0, porCriterio, eliminada, posicao: null, atendidos: sim, avaliados: comDado, pontos: wSim };
  });
  linhas.sort((a, b) => (a.eliminada.length ? 1 : 0) - (b.eliminada.length ? 1 : 0) || (b.pontos ?? 0) - (a.pontos ?? 0) || (b.nota ?? -1) - (a.nota ?? -1) || a.u.nome.localeCompare(b.u.nome));
  let pos = 0; for (const l of linhas) if (!l.eliminada.length && l.nota !== null) l.posicao = ++pos;
  return linhas;
}
