// Retrato de uma unidade para quem já tem o terreno: pontos fortes e pontos de atenção, sem ranking, posição ou sugestão de outras unidades.
// Um dado é ponto forte quando a unidade está no melhor quarto das unidades com dado, e ponto de atenção quando está no pior quarto.
import type { Base, Edicao } from "./tipos";
import { indicador, numero } from "./ranking";
import { fmt } from "./formato";

interface Item { chave: string; nome: string; melhor: "maior" | "menor"; forte: string; atencao: string }
export const ITENS_RETRATO: Item[] = [
  { chave: "c21|nota_isd_score", nome: "Escola (nota do distrito)", melhor: "maior", forte: "escola bem avaliada, o que ajuda a vender para famílias", atencao: "escola com nota baixa, o que afasta famílias com filhos" },
  { chave: "c24|aliquota_total", nome: "Imposto anual do imóvel", melhor: "menor", forte: "imposto do imóvel baixo, parcela menor para o comprador", atencao: "imposto do imóvel alto, pesa no carregamento e na parcela do comprador" },
  { chave: "c25|pct_area_sfha", nome: "Área sujeita a alagamento", melhor: "menor", forte: "pouca área sujeita a alagamento", atencao: "muita área sujeita a alagamento: confira a zona FEMA do seu lote" },
  { chave: "c19|min_polo_mais_proximo", nome: "Tempo até polos de emprego", melhor: "menor", forte: "perto de polos de emprego", atencao: "longe dos polos de emprego" },
  { chave: "c18|valorizacao_5a", nome: "Valorização em 5 anos", melhor: "maior", forte: "imóveis valorizaram bem nos últimos 5 anos", atencao: "imóveis valorizaram pouco nos últimos 5 anos" },
  { chave: "c15|permits_unifamiliares_ano", nome: "Casas novas por ano", melhor: "maior", forte: "mercado de casa nova ativo", atencao: "poucas casas novas: mercado de casa nova pouco testado" },
  { chave: "c23|renda_mediana", nome: "Renda das famílias", melhor: "maior", forte: "famílias com renda alta", atencao: "renda das famílias baixa para casas mais caras" },
  { chave: "c14|dom_casa", nome: "Dias para vender a casa", melhor: "menor", forte: "casas vendem rápido", atencao: "casas demoram a vender" },
  { chave: "c07|taxas_por_casa", nome: "Taxas da prefeitura por casa", melhor: "menor", forte: "taxas da prefeitura baixas", atencao: "taxas da prefeitura altas" },
  { chave: "c08|prazo_aprovacao_dias", nome: "Prazo de aprovação", melhor: "menor", forte: "aprovação rápida na prefeitura", atencao: "aprovação demorada na prefeitura" },
  { chave: "c22|crimes_por_mil", nome: "Crimes por mil habitantes", melhor: "menor", forte: "poucos crimes", atencao: "mais crimes que a maioria das unidades" },
  { chave: "c26|seguro_medio", nome: "Seguro residencial", melhor: "menor", forte: "seguro da casa barato", atencao: "seguro da casa caro" },
];
export interface Ponto { nome: string; texto: string; valor: string; fonte: string; ref: string }
export function retrato(base: Base, edicoes: Record<string, Edicao>, uid: string) {
  const fortes: Ponto[] = [], atencao: Ponto[] = [], neutros: Ponto[] = [], semDado: string[] = [];
  for (const it of ITENS_RETRATO) {
    const i = indicador(base, edicoes, uid, it.chave); const v = numero(i?.v);
    if (!i || v === null) { semDado.push(it.nome); continue; }
    const todos = base.unidades.map((u) => numero(indicador(base, edicoes, u.unidade_id, it.chave)?.v)).filter((x): x is number => x !== null);
    const abaixo = todos.filter((x) => x < v).length / todos.length, acima = todos.filter((x) => x > v).length / todos.length;
    const melhorQue = it.melhor === "maior" ? abaixo : acima, piorQue = it.melhor === "maior" ? acima : abaixo;
    const p: Ponto = { nome: it.nome, texto: "", valor: fmt(v, i.um), fonte: i.f, ref: i.ref };
    if (todos.length >= 8 && melhorQue >= 0.75) fortes.push({ ...p, texto: it.forte }); else if (todos.length >= 8 && piorQue >= 0.75) atencao.push({ ...p, texto: it.atencao }); else neutros.push({ ...p, texto: "na faixa do meio entre as unidades" });
  }
  const mor = indicador(base, edicoes, uid, "c08|moratoria_ativa");
  if (mor?.v === "sim") atencao.unshift({ nome: "Moratória", texto: "a cidade está com novas obras suspensas", valor: "sim", fonte: mor.f, ref: mor.ref });
  return { fortes, atencao, neutros, semDado };
}
