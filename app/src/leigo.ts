// Modo guiado (no código, "leigo"): perguntas em linguagem do dia a dia que são traduzidas em parâmetros do motor pelas regras de src/config/regrasLeigo.json.
import type { ParamResp, Peso, Projeto, RespostasLeigo } from "./tipos";
import { PARAMS, PRECOS, pesoPadrao } from "./parametros";
import regras from "./config/regrasLeigo.json";

export interface Pergunta { id: string; n: number; texto: string; ajuda: string; opcoes: { rotulo: string; valor: string; apoio?: string }[]; padrao: string; obrigatoria?: boolean; so_se?: (r: RespostasLeigo) => boolean }
export const PERGUNTAS: Pergunta[] = [
  { id: "faixa", n: 1, texto: "Quanto vai investir no terreno?", ajuda: "É o valor total do terreno. Ele define onde faz sentido procurar.", obrigatoria: true, padrao: "",
    opcoes: [{ rotulo: "$50 a 100 mil", valor: "F1" }, { rotulo: "$100 a 500 mil", valor: "F2" }, { rotulo: "$500 mil a 1 milhão", valor: "F3" }, { rotulo: "$1 a 2 milhões", valor: "F4" }] },
  { id: "casas", n: 2, texto: "Quantas casas quer construir?", ajuda: "Com mais casas, o terreno precisa ser maior e a prefeitura pede mais aprovações.", padrao: "1",
    opcoes: [{ rotulo: "1", valor: "1" }, { rotulo: "2 a 4", valor: "2a4" }, { rotulo: "5 a 10", valor: "5a10" }, { rotulo: "mais de 10", valor: "mais10" }] },
  { id: "construcao", n: 2, texto: "Todas ao mesmo tempo ou uma de cada vez?", ajuda: "Uma de cada vez exige menos dinheiro de uma só vez, mas parte do terreno fica parada esperando.", padrao: "simultaneo", so_se: (r) => !!r.casas && r.casas !== "1",
    opcoes: [{ rotulo: "Todas ao mesmo tempo", valor: "simultaneo" }, { rotulo: "Uma de cada vez", valor: "sequencia" }] },
  { id: "preco", n: 3, texto: "Por quanto quer vender cada casa?", ajuda: "O preço de venda indica que tipo de comprador a região precisa ter.", padrao: "1",
    opcoes: PRECOS.map((p, i) => ({ rotulo: p.rotulo, valor: String(i) })) },
  { id: "vender_rapido", n: 4, texto: "Precisa vender rápido?", ajuda: "Casa pronta sem vender continua custando juros, imposto e seguro todo mês.", padrao: "sim", opcoes: [{ rotulo: "Sim", valor: "sim" }, { rotulo: "Não, posso esperar", valor: "nao" }] },
  { id: "valorizacao", n: 5, texto: "Aceita esperar mais para ganhar com a valorização?", ajuda: "Regiões em crescimento podem render mais na venda, mas o resultado é menos certo.", padrao: "nao", opcoes: [{ rotulo: "Sim", valor: "sim" }, { rotulo: "Não", valor: "nao" }] },
  { id: "comecar_logo", n: 6, texto: "Você quer um terreno em que já dá para construir, ou aceita um mais barato que ainda precisa de aprovação da prefeitura?",
    ajuda: "Enquanto a prefeitura analisa, você já pagou o terreno e continua pagando juros e imposto sem poder construir. Se for seu primeiro projeto, a primeira opção é a mais segura.", padrao: "sim",
    opcoes: [{ rotulo: "Quero começar a obra logo", valor: "sim", apoio: "Terreno já liberado, só a licença de construção, em geral 1 a 3 meses; custa mais." },
      { rotulo: "Aceito esperar para pagar menos", valor: "nao", apoio: "Terreno que ainda precisa ser dividido em lotes ou ter o uso aprovado, 6 a 12 meses ou mais; custa menos, mas o dinheiro fica parado e a aprovação pode sair diferente do pedido." }] },
  { id: "agua_esgoto", n: 7, texto: "O terreno precisa ter água e esgoto da cidade?", ajuda: "Sem a rede da cidade, é preciso furar poço e instalar fossa, o que custa mais e afasta parte dos compradores.", padrao: "sim", opcoes: [{ rotulo: "Sim", valor: "sim" }, { rotulo: "Não", valor: "nao" }] },
  { id: "escola", n: 8, texto: "Seu comprador exige escola bem avaliada?", ajuda: "Famílias com filhos costumam escolher o bairro pela escola pública da região.", padrao: "sim", opcoes: [{ rotulo: "Sim", valor: "sim" }, { rotulo: "Não", valor: "nao" }] },
];
export const perguntaDe = (id: string) => PERGUNTAS.find((p) => p.id === id);
export const RESPOSTAS_PADRAO: RespostasLeigo = { casas: "1", construcao: "simultaneo", preco: 1, vender_rapido: true, valorizacao: false, comecar_logo: true, agua_esgoto: true, escola: true };

type Regra = { valor?: string; min?: number; max?: number; peso?: string } | null;
type Bloco = Record<string, Regra>;
const R = regras as unknown as { padroes: Bloco; sempre: Bloco; casas: Record<string, Bloco>; sequencia: Bloco; preco_renda_divisor: number; casas_representativo: Record<string, number> } & Record<string, Record<string, Bloco>>;
const sn = (b: boolean | undefined) => (b ? "sim" : "nao");

/** Aplica as regras e devolve os parâmetros deduzidos, cada um com a pergunta de origem. */
export function deduzir(resp: RespostasLeigo): Record<string, ParamResp> {
  const r = { ...RESPOSTAS_PADRAO, ...resp }; const out: Record<string, ParamResp> = {};
  const aplicar = (bloco: Bloco | undefined, origem: string) => { if (!bloco) return;
    for (const [id, regra] of Object.entries(bloco)) {
      if (regra === null) { out[id] = { alvo: null, peso: out[id]?.peso ?? pesoPadrao(id), origem }; continue; }
      const { peso, ...alvo } = regra; const temAlvo = Object.keys(alvo).length > 0; const pad = R.padroes[id]; const padAlvo = pad ? (({ peso: _p, ...a }) => a)(pad) : null;
      out[id] = { alvo: temAlvo ? alvo : out[id]?.alvo ?? padAlvo ?? null, peso: (peso as Peso) ?? out[id]?.peso ?? pesoPadrao(id), origem };
    } };
  aplicar(R.sempre, "sempre"); aplicar(R.casas[r.casas!], "casas");
  if (r.casas !== "1" && r.construcao === "sequencia") aplicar(R.sequencia, "construcao");
  const pv = PRECOS[r.preco ?? 1]; const ref = pv.min !== undefined && pv.max !== undefined ? (pv.min + pv.max) / 2 : pv.max ?? pv.min!;
  // renda alvo = preço / 3,5, arredondada para a opção fixa mais próxima
  const alvoRenda = ref / R.preco_renda_divisor; const ops = PARAMS.find((p) => p.id === "renda")!.opcoes.map((o) => o.a!.min!);
  out.renda = { alvo: { min: ops.reduce((m, x) => (Math.abs(x - alvoRenda) < Math.abs(m - alvoRenda) ? x : m), ops[0]) }, peso: "medio", origem: "preco" };
  aplicar(R.vender_rapido[sn(r.vender_rapido)], "vender_rapido"); aplicar(R.valorizacao[sn(r.valorizacao)], "valorizacao");
  aplicar(R.comecar_logo[sn(r.comecar_logo)], "comecar_logo"); aplicar(R.agua_esgoto[sn(r.agua_esgoto)], "agua_esgoto"); aplicar(R.escola[sn(r.escola)], "escola");
  for (const p of PARAMS) if (!out[p.id]) out[p.id] = { alvo: null, peso: pesoPadrao(p.id), origem: "padrao" };
  return out;
}
const igual = (a: ParamResp, b: ParamResp) => a.peso === b.peso && JSON.stringify(a.alvo ?? null) === JSON.stringify(b.alvo ?? null);
/** Junta a dedução com o que foi ajustado à mão no expert: o ajuste manual nunca é sobrescrito. Devolve também os conflitos. */
export function mesclar(deduzido: Record<string, ParamResp>, atual: Record<string, ParamResp> | undefined) {
  const parametros: Record<string, ParamResp> = {}; const conflitos: { id: string; deduzido: ParamResp; manual: ParamResp }[] = [];
  for (const [id, d] of Object.entries(deduzido)) {
    const a = atual?.[id];
    if (a?.ajustado) { parametros[id] = a; if (!igual(a, d)) conflitos.push({ id, deduzido: d, manual: a }); } else parametros[id] = d;
  }
  return { parametros, conflitos };
}
/** Campos do Projeto que o modo leigo grava (os mesmos que o expert edita). */
export function projetoDoLeigo(resp: RespostasLeigo, pr: Projeto): Partial<Projeto> {
  const r = { ...RESPOSTAS_PADRAO, ...resp }; const pv = PRECOS[r.preco ?? 1];
  return { leigo: resp, parametros: mesclar(deduzir(resp), pr.parametros).parametros, n_casas: R.casas_representativo[r.casas!], construcao: r.casas === "1" ? "simultaneo" : r.construcao, preco_venda: { min: pv.min, max: pv.max } };
}
export function resumo(resp: RespostasLeigo, faixa: string): string {
  const r = { ...RESPOSTAS_PADRAO, ...resp }; const casas = { "1": "1 casa", "2a4": "2 a 4 casas", "5a10": "5 a 10 casas", mais10: "mais de 10 casas" }[r.casas!];
  return `Você quer investir ${faixa} no terreno para construir ${casas}${r.casas !== "1" ? (r.construcao === "sequencia" ? ", uma de cada vez" : ", todas ao mesmo tempo") : ""}, e vender cada uma por ${PRECOS[r.preco ?? 1].rotulo}. `
    + `${r.vender_rapido ? "Precisa vender rápido" : "Pode esperar para vender"}, ${r.valorizacao ? "aceita apostar na valorização da região" : "não quer depender de valorização"}, `
    + `${r.comecar_logo ? "quer começar a obra logo" : "aceita esperar a aprovação da prefeitura para pagar menos"}, ${r.agua_esgoto ? "exige água e esgoto da cidade" : "aceita poço e fossa"} `
    + `e ${r.escola ? "o comprador exige escola bem avaliada" : "a escola não é decisiva"}.`;
}
