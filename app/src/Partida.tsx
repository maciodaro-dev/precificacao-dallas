import { useState } from "react";
import type { Base, Edicao, LinhaCusto, ParteRealizada, Projeto, SimNaoNaoSei, Terreno } from "./tipos";
import { retrato } from "./retrato";
import { hoje } from "./estado";
import FontesUsadas from "./Fontes";
import { ITENS_RETRATO } from "./retrato";

// Ponto de partida: primeira tela do aplicativo. "Você já tem o terreno?"
// Sim: vincula o terreno à unidade, mostra só o retrato (sem ranking) e pergunta o que já foi feito.
// Etapa respondida com "sim" não é removida: fica "já realizada" e o valor gasto entra na pilha como realizado.

interface PerguntaFeito { campo: "aprovacoes" | "projeto_casa" | "terreno_pronto"; parte: ParteRealizada["parte"]; etapa: 3 | 4; n: number; texto: string; detalhe: string; ajuda: string; categoria: string }
export const PERGUNTAS_FEITO: PerguntaFeito[] = [
  { campo: "aprovacoes", parte: "aprovacoes", etapa: 3, n: 2, texto: "O terreno já tem as aprovações da prefeitura?", detalhe: "Divisão em lotes e uso permitido.", categoria: "Aprovações da prefeitura",
    ajuda: "Sem essas aprovações, a prefeitura não emite a licença de construção, e consegui-las pode levar meses." },
  { campo: "projeto_casa", parte: "projeto_casa", etapa: 3, n: 3, texto: "Você já tem o projeto da casa?", detalhe: "Arquitetura e engenharia.", categoria: "Projeto da casa",
    ajuda: "O projeto pronto é o que a prefeitura analisa para liberar a obra e o que o construtor usa para dar o preço." },
  { campo: "terreno_pronto", parte: "preparacao", etapa: 4, n: 4, texto: "O terreno já está pronto para receber a obra?", detalhe: "Acesso, água, esgoto, energia e terraplenagem.", categoria: "Preparação do terreno",
    ajuda: "Terreno pronto tem rua de acesso, redes ligadas na divisa e o solo nivelado para a fundação." },
];
const SITUACAO = { feita: "já realizada", parcial: "parcialmente realizada", fazer: "a fazer" };
export function situacaoEtapas(p: Projeto): Record<number, keyof typeof SITUACAO> {
  const pp = p.ponto_partida; const s: Record<number, keyof typeof SITUACAO> = { 1: "fazer", 2: "fazer", 3: "fazer", 4: "fazer", 5: "fazer", 6: "fazer", 7: "fazer", 8: "fazer" };
  if (!pp?.tem_terreno) return s;
  s[1] = "feita"; s[2] = "feita";
  const a = pp.aprovacoes === "sim", b = pp.projeto_casa === "sim"; s[3] = a && b ? "feita" : a || b ? "parcial" : "fazer";
  s[4] = pp.terreno_pronto === "sim" ? "feita" : "fazer";
  return s;
}
export const rotuloSituacao = (k: keyof typeof SITUACAO) => SITUACAO[k];
const num = (t: string) => { const n = Number(t.replace(/\./g, "").replace(",", ".")); return t.trim() === "" || !isFinite(n) ? null : n; };

type Passo = "pergunta" | "onde" | "retrato" | "compra" | 0 | 1 | 2 | "resumo";
interface P { base: Base; edicoes: Record<string, Edicao>; projeto: Projeto; alterar: (m: Partial<Projeto>) => void; irParaOnde: () => void; irParaEtapa: (n: number) => void; inicial?: Passo }
export default function Partida({ base, edicoes, projeto, alterar, irParaOnde, irParaEtapa, inicial }: P) {
  const pp = projeto.ponto_partida ?? { tem_terreno: null };
  const terreno = projeto.terrenos.find((t) => t.ja_possuido);
  const [passo, setPasso] = useState<Passo>(inicial && terreno ? inicial : pp.tem_terreno ? (pp.concluido ? "resumo" : terreno ? "retrato" : "onde") : "pergunta");
  const ir = (x: typeof passo) => { setPasso(x); window.scrollTo(0, 0); };
  const gravarPP = (m: Partial<typeof pp>) => alterar({ ponto_partida: { ...pp, ...m, data: hoje() } });
  const cidades = [...new Set(base.unidades.map((u) => u.cidade))].sort((a, b) => a.localeCompare(b));
  const unidade = base.unidades.find((u) => u.unidade_id === (terreno?.unidade_id ?? projeto.unidade_eleita_id));
  const [cidade, setCidade] = useState(unidade?.cidade ?? ""); const [endereco, setEndereco] = useState(pp.endereco ?? terreno?.endereco ?? "");
  const daCidade = base.unidades.filter((u) => u.cidade === cidade);

  const vincular = (uid: string) => {
    const t: Terreno = { terreno_id: terreno?.terreno_id ?? "T-" + Date.now().toString(36), unidade_id: uid, endereco, parcel_id: terreno?.parcel_id ?? "", acres: terreno?.acres ?? null, preco_pedido: null, isd_id_proprio: null, mud_pid: null,
      isencao_agricola: terreno?.isencao_agricola ?? false, status: "eleito", ja_possuido: true, preco_pago: terreno?.preco_pago ?? null, data_compra: terreno?.data_compra ?? null, valor_atual: terreno?.valor_atual ?? null, valor_atual_origem: terreno?.valor_atual_origem ?? null, due_diligence: terreno?.due_diligence ?? [] };
    alterar({ ponto_partida: { ...pp, tem_terreno: true, endereco, data: hoje() }, terrenos: [...projeto.terrenos.filter((x) => !x.ja_possuido), t], unidade_eleita_id: uid, eleita_em: hoje() });
  };
  /** Lança (ou atualiza) na pilha o valor de uma parte já realizada. Não apaga o que já foi lançado se a resposta mudar. */
  const lancar = (parte: ParteRealizada["parte"], etapa: 2 | 3 | 4, categoria: string, valor: number | null, naoSei: boolean, data: string | null) => {
    const id = "PP-" + parte; const outras = projeto.linhas_custo.filter((l) => l.linha_id !== id);
    const linha: LinhaCusto = { linha_id: id, etapa, casa_id: null, categoria, descricao: `${categoria} (já realizado, informado no ponto de partida)`, previsto_min: null, previsto_provavel: null, previsto_max: null,
      realizado: valor, data: data ?? hoje(), fonte: naoSei ? "não informado: usar estimativa marcada como premissa" : "informado pelo usuário", formula: null, premissa_id: null, origem: "ponto_partida" };
    const r: ParteRealizada = { parte, etapa, valor_gasto: valor, nao_sei: naoSei, data: hoje() };
    return { linhas_custo: [...outras, linha], realizadas: [...(projeto.realizadas ?? []).filter((x) => x.parte !== parte), r] };
  };

  // ---------- Você já tem o terreno? ----------
  if (passo === "pergunta") return (
    <main className="pergunta">
      <p className="passo-n">Ponto de partida</p>
      <h1>Você já tem o terreno?</h1>
      <div className="opcoes">
        <button id="pp-nao" className={pp.tem_terreno === false ? "ativo" : ""} onClick={() => { gravarPP({ tem_terreno: false }); irParaOnde(); }}><b>Não</b><span>Vou descobrir onde vale a pena procurar.</span></button>
        <button id="pp-sim" className={pp.tem_terreno === true ? "ativo" : ""} onClick={() => { gravarPP({ tem_terreno: true }); ir("onde"); }}><b>Sim</b><span>Já comprei ou já é meu. Quero formar o preço a partir dele.</span></button>
      </div>
      <p className="ajuda">Sem terreno, a ferramenta ajuda a escolher a região. Com terreno, ela pula essa escolha e mostra o que a região dele significa para o projeto. Você pode mudar esta resposta depois sem perder o que já lançou.</p>
    </main>);

  // ---------- Onde fica o terreno ----------
  if (passo === "onde") return (
    <main className="pergunta">
      <p className="passo-n">Ponto de partida · onde fica o terreno</p>
      <h1>Onde fica o seu terreno?</h1>
      <label className="campo">Endereço (opcional)<input id="pp-endereco" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="rua, número" /></label>
      <label className="campo">Cidade<select id="pp-cidade" value={cidade} onChange={(e) => setCidade(e.target.value)}><option value="">escolha…</option>{cidades.map((c) => <option key={c}>{c}</option>)}</select></label>
      {daCidade.length > 1 && <><p className="nota">Esta cidade é atendida por mais de um distrito escolar. Escolha o do seu terreno; ele aparece no boleto do imposto do imóvel.</p>
        <div className="opcoes">{daCidade.map((u) => <button key={u.unidade_id} className={unidade?.unidade_id === u.unidade_id ? "ativo" : ""} onClick={() => { vincular(u.unidade_id); ir("retrato"); }}><b>{u.isd_nome}</b></button>)}</div></>}
      <p className="ajuda">O terreno é ligado à região (cidade e distrito escolar). É daí que vêm imposto, taxas, regras de construção, preço de venda e prazo de aprovação usados nas próximas etapas. Fora dos limites de uma cidade, escolha "Não incorporado" com o nome do condado.</p>
      <div className="nav-perg"><button onClick={() => ir("pergunta")}>← Voltar</button>
        {daCidade.length === 1 && <button className="primario grande" onClick={() => { vincular(daCidade[0].unidade_id); ir("retrato"); }}>Continuar →</button>}</div>
    </main>);

  if (!unidade || !terreno) return <main className="pergunta"><p className="aviso">Escolha a cidade do terreno para continuar.</p><button onClick={() => ir("onde")}>Escolher a cidade</button></main>;

  // ---------- Retrato da unidade (sem ranking) ----------
  if (passo === "retrato") { const r = retrato(base, edicoes, unidade.unidade_id); const nf = (f: string) => (f === "usuario" ? "valor digitado por você" : base.fontes.find((x) => x.id === f)?.nome ?? f); return (
    <main className="retrato">
      <p className="passo-n">Ponto de partida · a região do seu terreno</p>
      <h1>{unidade.nome}</h1>
      <p className="nota">{terreno.endereco ? terreno.endereco + " · " : ""}{unidade.condados_pct}</p>
      <div className="duas">
        <section><h2>Pontos fortes para o projeto</h2>{r.fortes.length === 0 ? <p className="nota">Nenhum dado desta região se destaca para cima.</p> : <ul>{r.fortes.map((p) => <li key={p.nome}><b>{p.nome}: {p.valor}.</b> {p.texto[0].toUpperCase() + p.texto.slice(1)}.<small>{nf(p.fonte)} · {p.ref}</small></li>)}</ul>}</section>
        <section><h2>Pontos de atenção</h2>{r.atencao.length === 0 ? <p className="nota">Nenhum dado desta região se destaca para baixo.</p> : <ul>{r.atencao.map((p) => <li key={p.nome}><b>{p.nome}: {p.valor}.</b> {p.texto[0].toUpperCase() + p.texto.slice(1)}.<small>{nf(p.fonte)} · {p.ref}</small></li>)}</ul>}</section>
      </div>
      {r.neutros.length > 0 && <section><h2>Sem destaque</h2><p>{r.neutros.map((p) => `${p.nome}: ${p.valor}`).join(" · ")}</p></section>}
      {r.semDado.length > 0 && <p className="aviso">Ainda sem dado para esta região: {r.semDado.join(", ")}.</p>}
      <FontesUsadas base={base} edicoes={edicoes} unidades={[unidade.unidade_id]} chaves={ITENS_RETRATO.map((i) => i.chave)} />
      <div className="nav-perg"><button onClick={() => ir("onde")}>← Mudar a cidade</button><button className="primario grande" onClick={() => ir("compra")}>Continuar →</button></div>
    </main>); }

  // ---------- Compra do terreno ----------
  if (passo === "compra") return <Compra terreno={terreno} voltar={() => ir("retrato")} salvar={(t) => {
    const l = lancar("aquisicao", 2, "Compra do terreno", t.preco_pago ?? null, t.preco_pago == null, t.data_compra ?? null);
    alterar({ terrenos: projeto.terrenos.map((x) => (x.terreno_id === terreno.terreno_id ? { ...x, ...t } : x)), ...l }); ir(0); }} />;

  // ---------- Perguntas 2, 3 e 4 ----------
  if (typeof passo === "number") { const q = PERGUNTAS_FEITO[passo]; const feito = (projeto.realizadas ?? []).find((x) => x.parte === q.parte);
    return <Feito key={q.campo} q={q} resposta={pp[q.campo]} gasto={feito?.valor_gasto ?? null} voltar={() => (passo === 0 ? ir("compra") : ir((passo - 1) as 0 | 1))}
      salvar={(resp, valor, naoSei) => {
        const m: Partial<Projeto> = { ponto_partida: { ...pp, [q.campo]: resp, concluido: passo === 2 ? true : pp.concluido, data: hoje() } };
        if (resp === "sim") Object.assign(m, lancar(q.parte, q.etapa, q.categoria, valor, naoSei, null));
        alterar(m); ir(passo === 2 ? "resumo" : ((passo + 1) as 1 | 2)); }} />; }

  // ---------- Resumo ----------
  const sit = situacaoEtapas(projeto); const naoSei = PERGUNTAS_FEITO.filter((q) => pp[q.campo] === "nao_sei");
  const proxima = [2, 3, 4, 5].find((n) => sit[n] !== "feita") ?? 5; const fmtUSD = (v: number | null | undefined) => (v == null ? "não informado" : "$" + v.toLocaleString("pt-BR"));
  return (
    <main className="retrato">
      <p className="passo-n">Ponto de partida · resumo</p>
      <h1>Seu projeto começa daqui</h1>
      <p>Terreno em <b>{unidade.nome}</b>{terreno.endereco && `, ${terreno.endereco}`}. Preço pago: {fmtUSD(terreno.preco_pago)}{terreno.data_compra && ` em ${terreno.data_compra}`}. Valor de mercado hoje: {terreno.valor_atual == null ? "a estimar na etapa 2" : fmtUSD(terreno.valor_atual)}.</p>
      {naoSei.length > 0 && <p className="aviso">Você respondeu "não sei" em: {naoSei.map((q) => q.categoria.toLowerCase()).join(", ")}. Tratei como "não". Confirme e corrija aqui quando souber.</p>}
      <table className="simples"><thead><tr><th>Etapa</th><th>Situação</th><th>Já gasto (lançado como realizado)</th></tr></thead><tbody>
        {[2, 3, 4, 5, 6, 7, 8].map((n) => { const ls = projeto.linhas_custo.filter((l) => l.etapa === n && l.origem === "ponto_partida"); return (
          <tr key={n}><td>{n}. {["", "", "Aquisição do terreno", "Aprovações e projeto", "Preparação do lote", "Construção", "Carregamento", "Venda e entrega", "Preço final"][n]}</td>
            <td><span className={"sit " + (sit[n] === "feita" ? "ok" : sit[n] === "parcial" ? "pendente" : "")}>{n >= 5 ? "sempre faz parte do projeto" : rotuloSituacao(sit[n])}</span></td>
            <td>{ls.length === 0 ? "—" : ls.map((l) => `${l.categoria}: ${l.realizado == null ? "não sei (será estimado e marcado como premissa)" : fmtUSD(l.realizado)}`).join("; ")}</td></tr>); })}
      </tbody></table>
      <p className="nota">Etapa já realizada não some: o valor gasto entra na pilha de custos. O tempo desde a compra do terreno não conta no carregamento; só o prazo que falta. Na etapa 8, a margem aparece sobre o preço pago e sobre o valor atual do terreno.</p>
      <div className="nav-perg"><button onClick={() => ir("pergunta")}>Mudar as respostas</button><button onClick={() => ir("retrato")}>Ver o retrato da região</button><button className="primario grande" onClick={() => irParaEtapa(proxima)}>Ir para a etapa {proxima} →</button></div>
    </main>);
}

function Compra({ terreno, salvar, voltar }: { terreno: Terreno; salvar: (t: Partial<Terreno>) => void; voltar: () => void }) {
  const [pago, setPago] = useState(terreno.preco_pago?.toString() ?? ""); const [data, setData] = useState(terreno.data_compra ?? ""); const [atual, setAtual] = useState(terreno.valor_atual?.toString() ?? "");
  return (
    <main className="pergunta">
      <p className="passo-n">Ponto de partida · a compra do terreno</p>
      <h1>Quanto você pagou pelo terreno, e quanto ele vale hoje?</h1>
      <label className="campo">Preço pago (US$)<input id="pp-pago" inputMode="decimal" value={pago} onChange={(e) => setPago(e.target.value)} placeholder="ex.: 180000" /></label>
      <label className="campo">Data da compra<input id="pp-data" type="date" value={data} onChange={(e) => setData(e.target.value)} /></label>
      <label className="campo">Valor de mercado hoje (US$)<input id="pp-atual" inputMode="decimal" value={atual} onChange={(e) => setAtual(e.target.value)} placeholder="deixe em branco se não souber" /></label>
      <p className="ajuda">O preço pago entra na pilha de custos como já realizado. O valor de hoje serve para a etapa 8 mostrar a margem de duas formas: sobre o que você pagou e sobre o que o terreno vale. Em branco, o valor de hoje fica para ser estimado na etapa 2.</p>
      <div className="nav-perg"><button onClick={voltar}>← Anterior</button>
        <button className="primario grande" onClick={() => salvar({ preco_pago: num(pago), data_compra: data || null, valor_atual: num(atual), valor_atual_origem: num(atual) === null ? "estimado" : "informado" })}>Próxima →</button></div>
    </main>);
}

function Feito({ q, resposta, gasto, salvar, voltar }: { q: PerguntaFeito; resposta: SimNaoNaoSei | undefined; gasto: number | null; salvar: (r: SimNaoNaoSei, valor: number | null, naoSei: boolean) => void; voltar: () => void }) {
  const [r, setR] = useState<SimNaoNaoSei | undefined>(resposta); const [valor, setValor] = useState(gasto?.toString() ?? ""); const [semValor, setSemValor] = useState(false);
  return (
    <main className="pergunta">
      <p className="passo-n">Ponto de partida · pergunta {q.n} de 4</p>
      <h1>{q.texto}</h1><p className="nota">{q.detalhe}</p>
      <div className="opcoes">{([["sim", "Sim"], ["nao", "Não"], ["nao_sei", "Não sei"]] as const).map(([v, t]) => <button key={v} id={`pp-${q.campo}-${v}`} className={r === v ? "ativo" : ""} aria-pressed={r === v} onClick={() => setR(v)}><b>{t}</b></button>)}</div>
      {r === "nao_sei" && <p className="aviso">Vou tratar como "não", para não deixar custo de fora. Confirme com a prefeitura ou com quem vendeu o terreno e corrija depois.</p>}
      {r === "sim" && <div className="gasto"><label className="campo">Quanto você já gastou nisso? (US$)<input id={`pp-${q.campo}-valor`} inputMode="decimal" value={valor} disabled={semValor} onChange={(e) => setValor(e.target.value)} /></label>
        <label className="linha"><input type="checkbox" checked={semValor} onChange={(e) => setSemValor(e.target.checked)} /> Não sei o valor (a ferramenta usa uma estimativa, marcada como premissa)</label></div>}
      <p className="ajuda">{q.ajuda}</p>
      <div className="nav-perg"><button onClick={voltar}>← Anterior</button><button className="primario grande" disabled={!r} onClick={() => salvar(r!, semValor ? null : num(valor), semValor || num(valor) === null)}>{q.n === 4 ? "Ver resumo →" : "Próxima →"}</button></div>
    </main>);
}
