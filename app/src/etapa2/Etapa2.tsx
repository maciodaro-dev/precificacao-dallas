// Etapa 2 — Aquisição do terreno. Candidatos, triagem, pilha de custos de aquisição, pagamento, comparação e escolha.
// Tudo o que se grava aqui é dado privado do projeto (fica no navegador do dono). Nada é apagado: terreno descartado fica guardado com o motivo.
import { useState } from "react";
import * as XLSX from "xlsx";
import type { Base, DadosEtapa2, DocResp, Faixa3, Lance, Negociacao, Projeto, QuemPaga, SituacaoDoc, Terreno } from "../tipos";
import { indicador } from "../ranking";
import { fmt } from "../formato";
import { hoje } from "../estado";
import { tr } from "../i18n";
import { AVISO_LOTE_COMUM, AVISO_OPCAO, AVISO_TRIAGEM, CONDICOES, DOCS, ITENS_TRIAGEM, MOMENTOS, MOTIVOS_DESCARTE, QUEM_PAGA, RESPOSTAS, SITUACOES_DOC, SITUACOES_NEG } from "./catalogo";
import { FONTE_TITULO, ROTULO_PRECO, ROTULO_TRIAGEM, argumentos, avistaXfinanciado, docsDe, opcaoCurta, pendencias, progresso, refVelha, resumoTerreno, vencimentos, verificarPrimeiro, type ResumoTerreno } from "./calculo";

const CONDADOS = ["Collin", "Dallas", "Denton", "Ellis", "Hunt", "Johnson", "Kaufman", "Parker", "Rockwall", "Tarrant", "Wise"];
const MAX_CANDIDATOS = 10, MAX_COMPARAR = 4;
const usd = (v: number | null | undefined) => (v === null || v === undefined || !isFinite(v) ? "sem valor" : "$" + Math.round(v).toLocaleString("pt-BR"));
const faixaTxt = (f: Faixa3 | null) => (!f ? "sem valor" : f.min === f.max ? usd(f.provavel) : `${usd(f.provavel)} (${usd(f.min)} a ${usd(f.max)})`);
const diasTxt = (f: Faixa3) => (!f.max ? "sem dado" : f.min === f.max ? `${f.provavel} dias` : `${f.provavel} dias (${f.min} a ${f.max})`);
const nomeT = (t: Terreno) => t.endereco || t.parcel_id || "Terreno sem endereço";
const ROTAT = /^etapa-2-terreno-(T-[a-z0-9]+)(?:-p(\d+))?$/i;
/** passos do modo guiado: um bloco por tela (preço, financiamento, negociação, documentos) e o resumo de risco */
export const PASSOS_GUIADO = 5;

function Num({ v, onChange, id, placeholder }: { v: number | null | undefined; onChange: (n: number | null) => void; id?: string; placeholder?: string }) {
  return <input id={id} type="number" min={0} step="any" placeholder={placeholder} value={v ?? ""} onChange={(e) => onChange(e.target.value === "" || !isFinite(Number(e.target.value)) ? null : Number(e.target.value))} />;
}
function FaixaEd({ v, onChange, unidade = "US$" }: { v: Faixa3 | undefined; onChange: (f: Faixa3 | undefined) => void; unidade?: string }) {
  const m = (k: keyof Faixa3, n: number | null) => { const f = { min: v?.min ?? null, provavel: v?.provavel ?? null, max: v?.max ?? null, [k]: n }; onChange(f.min === null && f.provavel === null && f.max === null ? undefined : f); };
  return <span className="faixa-ed"><label>Mínimo<Num v={v?.min} onChange={(n) => m("min", n)} /></label><label>Provável<Num v={v?.provavel} onChange={(n) => m("provavel", n)} /></label><label>Máximo<Num v={v?.max} onChange={(n) => m("max", n)} /></label><small>{unidade}</small>
    {v && <button className="link" onClick={() => onChange(undefined)}>Voltar à referência</button>}</span>;
}

interface P { base: Base; projeto: Projeto; alterar: (m: Partial<Projeto>) => void; rota: string; ir: (r: string) => void; voltar: () => void }
export default function Etapa2({ base, projeto, alterar, rota, ir, voltar }: P) {
  const modo = projeto.modo_e2 ?? (projeto.modo === "expert" ? "expert" : "leigo");
  const regiao = base.unidades.find((u) => u.unidade_id === projeto.unidade_eleita_id);
  const mudarT = (id: string, m: Partial<Terreno>) => alterar({ terrenos: projeto.terrenos.map((t) => (t.terreno_id === id ? { ...t, ...m } : t)) });
  const mudarE = (id: string, m: Partial<DadosEtapa2>) => { const t = projeto.terrenos.find((x) => x.terreno_id === id); if (t) mudarT(id, { e2: { ...t.e2, ...m } }); };
  const rt = ROTAT.exec(rota); const terreno = rt ? projeto.terrenos.find((t) => t.terreno_id === rt[1]) : undefined;
  const cab = <><button className="voltar solto" onClick={voltar}>← Voltar</button>
    <div className="e2-topo"><h1>Etapa 2 — Aquisição do terreno</h1>
      <div className="modo-e2" role="group" aria-label="Modo de entrada"><button id="e2-modo-guiado" className={modo === "leigo" ? "ativo" : ""} onClick={() => alterar({ modo_e2: "leigo" })}>Modo guiado</button><button id="e2-modo-especialista" className={modo === "expert" ? "ativo" : ""} onClick={() => alterar({ modo_e2: "expert" })}>Modo especialista</button></div></div></>;
  const props = { base, projeto, alterar, ir, modo, mudarT, mudarE };
  return (
    <main className="e2">
      {cab}
      {rota === "etapa-2-comparar" ? <Comparar {...props} /> : rota === "etapa-2-resumo" ? <Resumo {...props} /> :
        rt && terreno ? <FichaTerreno {...props} t={terreno} passo={rt[2] === undefined ? null : Number(rt[2])} /> :
        rt ? <p className="aviso">Este terreno não existe neste projeto. <button className="link" onClick={() => ir("etapa-2")}>Ver a lista de terrenos</button></p> :
        <Lista {...props} regiao={regiao?.nome ?? null} />}
      <p className="aviso e2-aviso">{AVISO_TRIAGEM}</p>
    </main>
  );
}
type Comum = { base: Base; projeto: Projeto; alterar: (m: Partial<Projeto>) => void; ir: (r: string) => void; modo: "leigo" | "expert"; mudarT: (id: string, m: Partial<Terreno>) => void; mudarE: (id: string, m: Partial<DadosEtapa2>) => void };

/** Terreno de exemplo: dados fictícios, só para testar o fluxo de ponta a ponta. */
function terrenoExemplo(p: Projeto): Terreno {
  const dia = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10); const ok = (n: number) => ({ situacao: "recebido_ok" as const, data: dia(n) });
  return { terreno_id: "T-exemplo" + Date.now().toString(36), unidade_id: p.unidade_eleita_id ?? "", endereco: "EXEMPLO — 123 Example St", parcel_id: "R-000000 (fictício)", acres: 0.25, preco_pedido: 180000, isd_id_proprio: null, mud_pid: null, isencao_agricola: false, status: "candidato",
    e2: { exemplo: true, condado: "Collin", tamanho_sqft: 10890, valor_cadastro: 150000, dentro_cidade: true, isd_nome: "ISD de exemplo", loteamento: "Loteamento de exemplo", zoneamento: "SF-10", agua_esgoto: "rede", informado: ["tudo"],
      observacoes: "Terreno de exemplo. Todos os dados são fictícios.", oferta: 170000, sinal: 1700, taxa_opcao: 250,
      pagamento: { forma: "financiado", entrada: 34000, juros_aa_pct: 7.5, parcelas: 180 },
      negociacao: { situacao: "sob_contrato", historico: [{ id: "L-1", data: dia(-9), tipo: "oferta", valor: 165000, obs: "primeira oferta" }, { id: "L-2", data: dia(-7), tipo: "contraproposta", valor: 175000 }, { id: "L-3", data: dia(-5), tipo: "oferta", valor: 170000, obs: "aceita" }],
        periodo_opcao_dias: 10, fim_opcao: dia(5), data_fechamento: dia(30), condicoes: ["Sujeito a survey", "Sujeito a financiamento"], paga_titulo: "comprador", paga_survey: "comprador" },
      documentos: { zoneamento_carta: ok(-12), plat: ok(-12), alagamento_det: { situacao: "pedido", data: dia(-4) }, agua_esgoto_disp: ok(-10), impostos: ok(-10), minerais: { situacao: "nao_pedido" }, contrato: ok(-5), sinal_comprovante: ok(-3),
        title_commitment: { situacao: "pedido", data: dia(-4) }, survey: { situacao: "pedido", data: dia(-4) },
        restricoes_hoa: { situacao: "recebido_problema", data: dia(-2), nota: "HOA exige aprovação do projeto (fictício)." }, solo: { situacao: "nao_pedido" } },
      triagem: { restricoes: { resposta: null, origem: "usuario", custo: { min: 500, provavel: 1500, max: 3000 } } } } };
}

const sitNeg = (t: Terreno) => SITUACOES_NEG.find((x) => x.v === (t.e2?.negociacao?.situacao ?? "em_analise"))!.rotulo;
function Barra({ t }: { t: Terreno }) { const pg = progresso(t); return <span className="e2-progresso mini"><span className="barra"><i style={{ width: pg.pct + "%" }} /></span><small>{pg.feitos} de {pg.total}</small></span>; }
function Selo({ r }: { r: ResumoTerreno }) { return <span className={"selo tri-" + r.resultado}>{ROTULO_TRIAGEM[r.resultado]}</span>; }

function Lista({ base, projeto, alterar, ir, mudarT, mudarE, regiao }: Comum & { regiao: string | null }) {
  const [ordem, setOrdem] = useState<"risco" | "preco" | "cadastro">("risco"); const [descartando, setDescartando] = useState<string | null>(null); const [motivo, setMotivo] = useState(MOTIVOS_DESCARTE[0]); const [texto, setTexto] = useState("");
  const ativos = projeto.terrenos.filter((t) => t.status !== "descartado"); const descartados = projeto.terrenos.filter((t) => t.status === "descartado");
  const linhas = ativos.map((t, i) => ({ t, i, r: resumoTerreno(base, projeto, t) }));
  const chave = (x: (typeof linhas)[number]) => (ordem === "cadastro" ? x.i : ordem === "preco" ? x.r.preco?.valor ?? Infinity : x.r.preco ? x.r.comRisco.provavel! : Infinity);
  linhas.sort((a, b) => chave(a) - chave(b) || a.i - b.i);
  const comp = (projeto.e2_comparar ?? []).filter((id) => ativos.some((t) => t.terreno_id === id)); const eleito = ativos.find((t) => t.status === "eleito");
  const novo = () => { const t: Terreno = { terreno_id: "T-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), unidade_id: projeto.unidade_eleita_id ?? "", endereco: "", parcel_id: "", acres: null, preco_pedido: null, isd_id_proprio: null, mud_pid: null, isencao_agricola: false, status: "candidato", e2: {} };
    alterar({ terrenos: [...projeto.terrenos, t] }); ir(`etapa-2-terreno-${t.terreno_id}` + (projeto.modo_e2 === "expert" || (!projeto.modo_e2 && projeto.modo === "expert") ? "" : "-p0")); };
  const exemplo = () => { const t = terrenoExemplo(projeto); alterar({ terrenos: [...projeto.terrenos, t] }); };
  const escolher = (id: string) => alterar({ terrenos: projeto.terrenos.map((t) => (t.terreno_id === id ? { ...t, status: "eleito" } : t.status === "eleito" && !t.ja_possuido ? { ...t, status: "candidato" } : t)) });
  const descartar = (id: string) => { mudarT(id, { status: "descartado", e2: { ...projeto.terrenos.find((t) => t.terreno_id === id)?.e2, descarte: { motivo, texto, data: hoje() } } }); setDescartando(null); setTexto(""); };
  const marcar = (id: string) => alterar({ e2_comparar: comp.includes(id) ? comp.filter((x) => x !== id) : comp.length < MAX_COMPARAR ? [...comp, id] : comp });
  const cheio = ativos.length >= MAX_CANDIDATOS;
  return (<>
    <p className="e2-regiao" id="e2-regiao">{regiao ? <>Região: <b>{regiao}</b> · <button className="link" id="e2-ver-regiao" onClick={() => ir("regiao-escolhida")}>ver dados da região</button></> : "Você ainda não escolheu uma região na etapa 1. Pode cadastrar terrenos mesmo assim."}</p>
    <p className="ajuda">Cadastre de 1 a 10 terrenos candidatos. Cada um abre em quatro blocos (preço, financiamento, negociação e documentos) e termina com o resumo de risco. Depois você compara e escolhe.</p>
    <p className="aviso preco-uso">O preço usado nas contas é o que você registrar: preço anunciado, sua oferta ou o preço fechado. A ferramenta ainda não tem custo de referência do terreno por região; enquanto não tiver, o preço anunciado é o ponto de partida e aparece sempre com esse nome.</p>
    <div className="acoes">
      <button id="e2-novo" className="primario" disabled={cheio} onClick={novo}>Adicionar terreno</button>
      <button id="e2-exemplo" disabled={cheio} onClick={exemplo}>Carregar terreno de exemplo</button>
      {cheio && <span className="nota">Limite de 10 terrenos candidatos. Descarte um para cadastrar outro.</span>}
    </div>
    {ativos.length === 0 ? <p className="vazio">Nenhum terreno cadastrado ainda.</p> : <>
      <div className="acoes"><label>Ordenar por <select id="e2-ordem" value={ordem} onChange={(e) => setOrdem(e.target.value as typeof ordem)}><option value="risco">custo com risco</option><option value="preco">preço em uso</option><option value="cadastro">ordem de cadastro</option></select></label>
        <button id="e2-comparar" disabled={comp.length < 2} onClick={() => ir("etapa-2-comparar")}>Comparar lado a lado</button><span className="nota">Marque de 2 a 4 terrenos na coluna "Comparar".</span>
        {eleito && <button id="e2-resumo" className="primario" onClick={() => ir("etapa-2-resumo")}>Ver o resumo do terreno escolhido</button>}</div>
      <div className="rolagem"><table className="simples e2-lista" id="e2-lista"><thead><tr><th>Comparar</th><th>Terreno</th><th>Preço em uso</th><th>Custo de aquisição</th><th>Custo com risco</th><th>Negociação</th><th>Checklist</th><th>Risco</th><th></th></tr></thead><tbody>
        {linhas.map(({ t, r }) => <tr key={t.terreno_id} className={t.status === "eleito" ? "eleito" : ""}>
          <td><input type="checkbox" aria-label="Comparar" checked={comp.includes(t.terreno_id)} disabled={!comp.includes(t.terreno_id) && comp.length >= MAX_COMPARAR} onChange={() => marcar(t.terreno_id)} /></td>
          <td><button className="link" onClick={() => ir(`etapa-2-terreno-${t.terreno_id}`)}>{nomeT(t)}</button>{t.e2?.exemplo && <span className="selo ed">exemplo fictício</span>}{t.status === "eleito" && <span className="selo">{t.ja_possuido ? "terreno próprio" : "escolhido"}</span>}
            <small>{[t.e2?.condado && `${t.e2.condado} County`, t.acres != null && `${t.acres} acres`].filter(Boolean).join(" · ")}</small></td>
          <td className="num">{r.preco ? <>{usd(r.preco.valor)}<small>{ROTULO_PRECO[r.preco.tipo]}</small></> : <span className="semdado">sem preço</span>}</td>
          <td className="num">{r.preco ? usd(r.aquisicao.provavel) : <span className="semdado">sem valor</span>}{r.semValor.length > 0 && <small className="naoatende">{r.semValor.length} linhas sem valor</small>}</td>
          <td className="num">{r.preco ? <>{usd(r.comRisco.provavel)}<small>até {usd(r.comRisco.max)}</small></> : <span className="semdado">sem valor</span>}</td>
          <td>{sitNeg(t)}{vencimentos(t, hoje())[0] && <small>{vencimentos(t, hoje())[0].nome}: {vencimentos(t, hoje())[0].data}</small>}</td>
          <td><Barra t={t} /></td>
          <td><Selo r={r} />{r.naoVerificados > 0 && <small>{r.naoVerificados} itens a verificar</small>}</td>
          <td className="botoes"><button onClick={() => ir(`etapa-2-terreno-${t.terreno_id}`)}>Abrir</button>
            {!t.ja_possuido && (t.status === "eleito" ? <button onClick={() => mudarT(t.terreno_id, { status: "candidato" })}>Desfazer escolha</button> : <button className="e2-escolher" onClick={() => escolher(t.terreno_id)}>Escolher</button>)}
            {!t.ja_possuido && <button className="e2-descartar" onClick={() => { setDescartando(t.terreno_id); setMotivo(MOTIVOS_DESCARTE[0]); }}>Descartar</button>}</td></tr>)}
      </tbody></table></div>
      <p className="nota">"Custo com risco" soma o custo de aquisição aos problemas confirmados no checklist. O valor "até" inclui também o máximo dos itens que você ainda não verificou.</p>
      {descartando && <div className="cartao descarte" id="e2-descarte"><h3>Descartar este terreno</h3><p>Nada é apagado: o terreno fica guardado em "Descartados", com o motivo, e pode voltar à lista.</p>
        <label className="campo">Motivo<select id="e2-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)}>{MOTIVOS_DESCARTE.map((m) => <option key={m} value={m}>{tr(m)}</option>)}</select></label>
        <label className="campo">Observação (opcional)<textarea value={texto} onChange={(e) => setTexto(e.target.value)} /></label>
        <div className="acoes"><button id="e2-confirma-descarte" className="primario" onClick={() => descartar(descartando)}>Confirmar descarte</button><button onClick={() => setDescartando(null)}>Cancelar</button></div></div>}
      <div className="acoes"><button id="e2-exportar" onClick={() => exportar(base, projeto)}>Exportar planilha (.xlsx)</button></div>
    </>}
    {descartados.length > 0 && <details className="e2-descartados" id="e2-descartados"><summary>Descartados ({descartados.length})</summary><table className="simples"><thead><tr><th>Terreno</th><th>Motivo</th><th>Observação</th><th>Data</th><th></th></tr></thead><tbody>
      {descartados.map((t) => <tr key={t.terreno_id}><td>{nomeT(t)}</td><td>{t.e2?.descarte?.motivo ?? "—"}</td><td>{t.e2?.descarte?.texto || "—"}</td><td>{t.e2?.descarte?.data ?? "—"}</td>
        <td className="botoes"><button onClick={() => ir(`etapa-2-terreno-${t.terreno_id}`)}>Abrir</button><button disabled={cheio} onClick={() => { mudarT(t.terreno_id, { status: "candidato" }); void mudarE; }}>Voltar à lista</button></td></tr>)}</tbody></table></details>}
  </>);
}

function Dados({ t, mudarT, mudarE }: { t: Terreno; mudarT: Comum["mudarT"]; mudarE: Comum["mudarE"] }) {
  const e = t.e2 ?? {}; const id = t.terreno_id; const [aberto, setAberto] = useState(!t.endereco);   // abre sozinho em terreno novo; depois quem manda é o usuário
  return <details className="e2-dados" open={aberto} onToggle={(x) => setAberto((x.currentTarget as HTMLDetailsElement).open)}><summary>Dados do terreno</summary>
    <p className="nota auto">O preenchimento automático pelo cadastro do condado ainda não está disponível. Preencha à mão o que souber; o que você digita fica marcado "informado por mim". Campo vazio fica "sem dado".</p>
    <div className="e2-grade">
      <label className="campo">Endereço ou identificação<input id="e2-endereco" value={t.endereco} onChange={(x) => mudarT(id, { endereco: x.target.value })} /></label>
      <label className="campo">Condado<select id="e2-condado" value={e.condado ?? ""} onChange={(x) => mudarE(id, { condado: x.target.value || undefined })}><option value="">sem dado</option>{CONDADOS.map((c) => <option key={c}>{c}</option>)}</select></label>
      <label className="campo">Tamanho (acres)<Num id="e2-acres" v={t.acres} onChange={(n) => mudarT(id, { acres: n, e2: { ...e, tamanho_sqft: n === null ? null : Math.round(n * 43560) } })} /></label>
      <label className="campo">Água e esgoto<select id="e2-agua" value={e.agua_esgoto ?? ""} onChange={(x) => mudarE(id, { agua_esgoto: (x.target.value || null) as DadosEtapa2["agua_esgoto"] })}><option value="">sem dado</option><option value="rede">Rede pública</option><option value="poco_fossa">Poço e fossa</option><option value="nao_sei">Não sei</option></select></label>
      <label className="campo">Número do lote no cadastro do condado<input value={t.parcel_id} onChange={(x) => mudarT(id, { parcel_id: x.target.value })} /></label>
      <label className="campo">Valor de cadastro do terreno (US$)<Num v={e.valor_cadastro} onChange={(n) => mudarE(id, { valor_cadastro: n })} /></label>
      <label className="campo">Dentro dos limites da cidade?<select value={e.dentro_cidade == null ? "" : e.dentro_cidade ? "sim" : "nao"} onChange={(x) => mudarE(id, { dentro_cidade: x.target.value === "" ? null : x.target.value === "sim" })}><option value="">sem dado</option><option value="sim">Sim</option><option value="nao">Não, fora de cidade</option></select></label>
      <label className="campo">Distrito escolar (ISD)<input value={e.isd_nome ?? ""} onChange={(x) => mudarE(id, { isd_nome: x.target.value })} /></label>
      <label className="campo">Loteamento<input value={e.loteamento ?? ""} onChange={(x) => mudarE(id, { loteamento: x.target.value })} /></label>
      <label className="campo">Zoneamento<input value={e.zoneamento ?? ""} onChange={(x) => mudarE(id, { zoneamento: x.target.value })} /></label>
      <label className="campo">Link do anúncio<input type="url" value={e.link_anuncio ?? ""} onChange={(x) => mudarE(id, { link_anuncio: x.target.value })} /></label>
    </div>
    <label className="campo largo">Observações<textarea value={e.observacoes ?? ""} onChange={(x) => mudarE(id, { observacoes: x.target.value })} /></label>
  </details>;
}
function FonteRef({ base, id }: { base: Base; id: string }) {
  const r = base.referencias?.find((x) => x.id === id); if (!r) return null;
  return <small className="fonte-ref"> confiança {r.confianca}{r.provisorio && <> · provisório</>} · {r.geografia} · {r.data}{refVelha(r.data, hoje()) && <span className="selo velho">mais de 6 meses</span>}{r.regra && <> · provável: {r.regra}</>} · {r.fontes.map((f, k) => <a key={k} href={f.url} target="_blank" rel="noreferrer">{f.nome}</a>)}</small>;
}

/** a) PREÇO: os quatro preços, qual está em uso, custos de fechamento e estudos, total de aquisição e custo por casa. */
function BlocoPreco({ t, r, mudarT, mudarE, base, projeto }: { t: Terreno; r: ResumoTerreno; mudarT: Comum["mudarT"]; mudarE: Comum["mudarE"]; base: Base; projeto: Projeto }) {
  const e = t.e2 ?? {}; const id = t.terreno_id; const uso = r.preco?.tipo; const n = Math.max(1, projeto.n_casas ?? 1);
  const grava = (lid: string, f: Faixa3 | undefined) => { const c = { ...e.custos }; if (f) c[lid] = { ...f, data: hoje() }; else delete c[lid]; mudarE(id, { custos: c }); };
  const emUso = (k: string) => (uso === k ? <span className="selo">em uso</span> : null);
  return <section className="e2-bloco" id="e2-bloco-preco"><h2><b className="letra">a</b> Preço</h2>
    <Dados t={t} mudarT={mudarT} mudarE={mudarE} />
    <table className="simples e2-precos" id="e2-precos"><tbody>
      <tr><th>Custo de referência da região</th><td className="semdado">sem dado</td><td><small>A ferramenta ainda não tem este valor. Enquanto não tiver, o preço anunciado é o ponto de partida.</small></td></tr>
      {t.ja_possuido ? <tr><th>Preço pago</th><td className="num">{usd(t.preco_pago)}</td><td>{emUso("pago")}</td></tr> : <>
        <tr><th>Preço anunciado, registrado manualmente</th><td><Num id="e2-anunciado" v={t.preco_pedido} onChange={(v) => mudarT(id, { preco_pedido: v })} /></td><td>{emUso("anunciado")}</td></tr>
        <tr><th>Minha oferta</th><td><Num id="e2-oferta" v={e.oferta} onChange={(v) => mudarE(id, { oferta: v })} /></td><td>{emUso("oferta")}</td></tr>
        <tr><th>Preço fechado</th><td><Num id="e2-fechado" v={e.preco_fechado} onChange={(v) => mudarE(id, { preco_fechado: v })} /></td><td>{emUso("fechado")}</td></tr></>}
    </tbody></table>
    <p className="nota">Vale o mais avançado que existir: preço fechado, depois a sua oferta, depois o preço anunciado. Valores em US$.</p>
    {!r.preco && <p className="aviso">Sem preço, não há como somar o custo. Informe o preço anunciado, a sua oferta ou o preço fechado.</p>}
    <h3>Custos de fechamento e estudos</h3>
    <p className="nota">Cada linha mostra de onde vem o valor: "tabela oficial", "estimativa de referência" (faixa publicada, com fonte; nunca valor oficial) ou "informado por mim". O seu valor vale só para este projeto e não muda a referência da ferramenta.</p>
    <div className="rolagem"><table className="simples e2-custos" id="e2-custos"><thead><tr><th>Linha</th><th>Valor (provável, mínimo a máximo)</th><th>Origem</th><th></th></tr></thead><tbody>
      {r.linhas.filter((l) => l.aplica && l.linha.id !== "preco").map((l) => <tr key={l.linha.id} className={l.linha.naoSoma || l.aParte ? "naosoma" : ""}>
        <td>{l.linha.nome}<small>{l.linha.ajuda}</small>{l.linha.loteComum && (t.acres ?? 0) > 1 && l.origem === "estimativa de referência" && <small className="naoatende">{AVISO_LOTE_COMUM}</small>}</td>
        <td className={"num" + (l.valor ? "" : " semdado")}>{faixaTxt(l.valor)}{l.linha.naoSoma && l.valor && <small>abatido do preço, não soma</small>}{l.aParte && <small>fora da soma: {l.aParte}</small>}</td>
        <td><span className={"selo" + (l.origem === "sem valor" ? " velho" : l.origem === "informado por mim" ? " ed" : "")}>{l.origem}</span>{l.ref && <FonteRef base={base} id={l.ref.id} />}
          {l.linha.id === "titulo" && l.valor && l.origem === "tabela oficial" && <small className="fonte-ref"> <a href={FONTE_TITULO.url} target="_blank" rel="noreferrer">Texas Department of Insurance</a> · {FONTE_TITULO.data}</small>}</td>
        <td>{l.linha.id !== "sinal" && l.linha.id !== "taxa_opcao" && <details><summary>Informar o meu valor</summary><FaixaEd v={e.custos?.[l.linha.id]} onChange={(f) => grava(l.linha.id, f)} /></details>}</td></tr>)}
    </tbody></table></div>
    <p className="nota">O seguro de título só entra na soma quando, em Negociação, "quem paga o seguro de título" for "comprador". Sinal e taxa de opção são informados em Negociação.</p>
    {r.preco && <table className="simples e2-pilha"><thead><tr><th></th><th>Mínimo</th><th>Provável</th><th>Máximo</th></tr></thead><tbody>
      <tr className="total"><td>Total de aquisição</td><td className="num">{usd(r.aquisicao.min)}</td><td className="num">{usd(r.aquisicao.provavel)}</td><td className="num">{usd(r.aquisicao.max)}</td></tr>
      <tr><td>Custo por casa ({n} casas)</td><td className="num">{usd(r.aquisicao.min! / n)}</td><td className="num">{usd(r.aquisicao.provavel! / n)}</td><td className="num">{usd(r.aquisicao.max! / n)}</td></tr></tbody></table>}
    <SemValor r={r} />
  </section>;
}
function SemValor({ r }: { r: ResumoTerreno }) {
  return r.semValor.length === 0 ? null : <div className="aviso incompleto"><b>Este total está incompleto.</b> Ficaram sem valor, por não haver fonte publicada nem valor informado por você:<ul>{r.semValor.map((s) => <li key={s}>{s.includes(": ") ? <>{s.split(": ")[0]}: {s.split(": ").slice(1).join(": ")}</> : s}</li>)}</ul></div>;
}

/** b) FINANCIAMENTO */
function BlocoFinanciamento({ t, r, mudarE, base }: { t: Terreno; r: ResumoTerreno; mudarE: Comum["mudarE"]; base: Base }) {
  const e = t.e2 ?? {}; const id = t.terreno_id; const pg = e.pagamento ?? { forma: "a_vista" as const }; const f = r.financiamento; const c = avistaXfinanciado(r);
  const mp = (m: Partial<typeof pg>) => mudarE(id, { pagamento: { ...pg, ...m } }); const ref = (k: string) => base.referencias?.find((x) => x.id === k)?.provavel ?? null;
  // juros, entrada e prazo: só o preenchimento inicial dos campos, a partir das estimativas de referência
  const financiar = () => { const pe = ref("entrada_pct"), j = ref("juros_terreno"), a = ref("prazo_financiamento_anos");
    mp({ forma: "financiado", entrada: pg.entrada ?? pg.financiado ?? (pe !== null && r.preco ? Math.round((r.preco.valor * pe) / 100) : null), juros_aa_pct: pg.juros_aa_pct ?? j, parcelas: pg.parcelas ?? (a === null ? null : Math.round(a * 12)) }); };
  return <section className="e2-bloco" id="e2-bloco-financiamento"><h2><b className="letra">b</b> Financiamento</h2>
    <div className="modo-e2 forma"><button id="e2-avista" className={pg.forma === "a_vista" ? "ativo" : ""} onClick={() => mp({ forma: "a_vista" })}>À vista</button><button id="e2-financiado" className={pg.forma === "financiado" ? "ativo" : ""} onClick={financiar}>Financiado</button></div>
    {pg.forma === "a_vista" ? <p>Compra à vista: não há parcela nem juros. Escolha "Financiado" para comparar.</p> : <>
      <p className="nota">Juros, entrada e prazo vêm preenchidos com uma estimativa de referência só como ponto de partida. Confirme com o seu banco.</p>
      <div className="e2-grade">
        <label className="campo">Entrada (US$)<Num id="e2-entrada" v={pg.entrada} onChange={(v) => mp({ entrada: v, financiado: null })} /></label>
        <label className="campo">ou valor financiado (US$)<Num id="e2-vfin" v={pg.financiado ?? (f ? f.financiado : null)} onChange={(v) => mp({ financiado: v, entrada: null })} /></label>
        <label className="campo">Juros ao ano (%)<Num id="e2-juros" v={pg.juros_aa_pct} onChange={(v) => mp({ juros_aa_pct: v })} /></label>
        <label className="campo">Número de parcelas mensais<Num id="e2-parcelas" v={pg.parcelas} onChange={(v) => mp({ parcelas: v === null ? null : Math.round(v) })} /></label></div>
      {f ? <><dl className="e2-numeros"><div><dt>Valor financiado</dt><dd>{usd(f.financiado)}</dd></div><div><dt>Parcela mensal</dt><dd>{usd(f.parcela)}</dd></div><div><dt>Total de juros no contrato</dt><dd>{usd(f.totalJuros)}</dd></div></dl>
        {c && <table className="simples e2-pilha" id="e2-avista-x-financiado"><thead><tr><th>O mesmo terreno</th><th>À vista</th><th>Financiado</th></tr></thead><tbody>
          <tr><td>Sai do bolso no fechamento</td><td className="num">{usd(c.avista)}</td><td className="num">{usd(c.entradaMaisCustos)}</td></tr>
          <tr><td>Juros até o fim do contrato</td><td className="num">{usd(0)}</td><td className="num">{usd(c.juros)}</td></tr>
          <tr className="total"><td>Total pago</td><td className="num">{usd(c.avista)}</td><td className="num">{usd(c.totalFinanciado)}</td></tr></tbody></table>}
        <details><summary>Saldo devedor mês a mês</summary><div className="rolagem baixa"><table className="simples"><thead><tr><th>Mês</th><th>Juros</th><th>Amortização</th><th>Saldo devedor</th></tr></thead><tbody>{f.saldo.map((s) => <tr key={s.mes}><td>{s.mes}</td><td className="num">{usd(s.juros)}</td><td className="num">{usd(s.amortizacao)}</td><td className="num">{usd(s.saldo)}</td></tr>)}</tbody></table></div></details>
        <p className="nota">Os juros pagos durante o projeto entram na etapa 6 (Carregamento), não nesta soma. Parcela fixa, calculada com juros compostos mensais. A comparação usa o total de aquisição provável e supõe o contrato levado até o fim.</p></>
        : <p className="semdado">Informe a entrada, os juros e o número de parcelas para ver a parcela e o total de juros.</p>}</>}
  </section>;
}

const venceTxt = (dias: number) => (dias < 0 ? `vencido há ${-dias} dias` : dias === 0 ? "vence hoje" : `vence em ${dias} dias`);
function Vencimentos({ t }: { t: Terreno }) {
  const v = vencimentos(t, hoje()); if (!v.length) return null;
  return <ul className="e2-vence" id="e2-vencimentos">{v.map((x, k) => <li key={x.id} className={(x.dias < 0 ? "vencido" : x.dias <= 7 ? "perto" : "") + (k === 0 ? " primeiro" : "")}><b>{x.nome}</b>: {x.data} · <span>{venceTxt(x.dias)}</span>{x.pendentes.length > 0 && <small>{x.pendentes.length} documentos ainda não recebidos até esta data</small>}</li>)}</ul>;
}

/** c) NEGOCIAÇÃO */
function BlocoNegociacao({ t, r, mudarE, base }: { t: Terreno; r: ResumoTerreno; mudarE: Comum["mudarE"]; base: Base }) {
  const e = t.e2 ?? {}; const id = t.terreno_id; const n = e.negociacao ?? {}; const mn = (m: Partial<Negociacao>, extra: Partial<DadosEtapa2> = {}) => mudarE(id, { ...extra, negociacao: { ...n, ...m } });
  const [novo, setNovo] = useState<{ data: string; tipo: Lance["tipo"]; valor: number | null; obs: string }>({ data: hoje(), tipo: "oferta", valor: null, obs: "" });
  const hist = [...(n.historico ?? [])].sort((a, b) => a.data.localeCompare(b.data)); const arg = argumentos(r.itens); const curta = opcaoCurta(base, t);
  const lancar = () => { if (novo.valor === null) return; const l: Lance = { id: "L-" + Date.now().toString(36), ...novo }; mn({ historico: [...(n.historico ?? []), l], situacao: n.situacao && n.situacao !== "em_analise" ? n.situacao : novo.tipo === "oferta" ? "oferta_enviada" : "contraproposta" }, novo.tipo === "oferta" ? { oferta: novo.valor } : {}); setNovo({ ...novo, valor: null, obs: "" }); };
  const fimPorDias = (d: number | null) => { const ini = hist.length ? hist[hist.length - 1].data : hoje(); mn({ periodo_opcao_dias: d, fim_opcao: d === null ? n.fim_opcao ?? null : n.fim_opcao ?? new Date(new Date(ini).getTime() + d * 864e5).toISOString().slice(0, 10) }); };
  const sel = (v: QuemPaga | undefined, on: (q: QuemPaga) => void, sid: string) => <select id={sid} value={v ?? "a_negociar"} onChange={(x) => on(x.target.value as QuemPaga)}>{QUEM_PAGA.map((q) => <option key={q.v} value={q.v}>{tr(q.rotulo)}</option>)}</select>;
  return <section className="e2-bloco" id="e2-bloco-negociacao"><h2><b className="letra">c</b> Negociação</h2>
    <label className="campo">Situação<select id="e2-situacao" value={n.situacao ?? "em_analise"} onChange={(x) => mn({ situacao: x.target.value as Negociacao["situacao"] })}>{SITUACOES_NEG.map((s) => <option key={s.v} value={s.v}>{tr(s.rotulo)}</option>)}</select></label>
    <h3>Histórico</h3>
    {hist.length === 0 ? <p className="semdado">Nenhuma oferta ou contraproposta registrada.</p> : <table className="simples" id="e2-historico"><thead><tr><th>Data</th><th>Tipo</th><th>Valor</th><th>Observação</th><th></th></tr></thead><tbody>
      {hist.map((l) => <tr key={l.id}><td>{l.data}</td><td>{l.tipo === "oferta" ? "Minha oferta" : "Contraproposta do vendedor"}</td><td className="num">{usd(l.valor)}</td><td>{l.obs || "—"}</td><td><button className="link" onClick={() => mn({ historico: (n.historico ?? []).filter((x) => x.id !== l.id) })}>Remover</button></td></tr>)}</tbody></table>}
    <div className="e2-lance"><label>Data<input type="date" value={novo.data} onChange={(x) => setNovo({ ...novo, data: x.target.value })} /></label>
      <label>Tipo<select id="e2-lance-tipo" value={novo.tipo} onChange={(x) => setNovo({ ...novo, tipo: x.target.value as Lance["tipo"] })}><option value="oferta">Minha oferta</option><option value="contraproposta">Contraproposta do vendedor</option></select></label>
      <label>Valor (US$)<Num id="e2-lance-valor" v={novo.valor} onChange={(v) => setNovo({ ...novo, valor: v })} /></label><label>Observação<input value={novo.obs} onChange={(x) => setNovo({ ...novo, obs: x.target.value })} /></label>
      <button id="e2-lance-add" disabled={novo.valor === null} onClick={lancar}>Registrar</button></div>
    <p className="nota">Registrar uma oferta sua atualiza "Minha oferta" no bloco Preço.</p>
    <h3>Termos</h3>
    <div className="e2-grade">
      <label className="campo">Sinal (earnest money, US$)<Num id="e2-sinal" v={e.sinal} onChange={(v) => mudarE(id, { sinal: v })} /></label>
      <label className="campo">Taxa de opção (US$)<Num id="e2-taxa-opcao" v={e.taxa_opcao} onChange={(v) => mudarE(id, { taxa_opcao: v })} /></label>
      <label className="campo">Período de opção (dias)<Num id="e2-opcao-dias" v={n.periodo_opcao_dias} onChange={fimPorDias} /></label>
      <label className="campo">Fim do período de opção<input id="e2-fim-opcao" type="date" value={n.fim_opcao ?? ""} onChange={(x) => mn({ fim_opcao: x.target.value || null })} /></label>
      <label className="campo">Data de fechamento<input id="e2-data-fechamento" type="date" value={n.data_fechamento ?? ""} onChange={(x) => mn({ data_fechamento: x.target.value || null })} /></label>
      <label className="campo">Quem paga o seguro de título{sel(n.paga_titulo, (q) => mn({ paga_titulo: q }), "e2-paga-titulo")}</label>
      <label className="campo">Quem paga o survey{sel(n.paga_survey, (q) => mn({ paga_survey: q }), "e2-paga-survey")}</label>
    </div>
    <p className="nota">{AVISO_OPCAO} Sinal e taxa de opção sem valor informado aparecem com a estimativa de referência, quando houver.</p>
    {curta && <p className="aviso erro" id="e2-opcao-curta">O período de opção informado ({n.periodo_opcao_dias} dias) é menor que o tempo estimado para receber os documentos do checklist: "{tr(curta.doc)}" costuma levar {curta.dias} dias{curta.ate > curta.dias && <>, podendo chegar a {curta.ate}</>}.</p>}
    <fieldset className="e2-condicoes"><legend>Condições</legend>{CONDICOES.map((c) => <label key={c}><input type="checkbox" checked={(n.condicoes ?? []).includes(c)} onChange={(x) => mn({ condicoes: x.target.checked ? [...(n.condicoes ?? []), c] : (n.condicoes ?? []).filter((y) => y !== c) })} /> {tr(c)}</label>)}
      <label className="campo largo">Outras condições<input value={n.condicoes_texto ?? ""} onChange={(x) => mn({ condicoes_texto: x.target.value })} /></label>
      <label><input id="e2-pj" type="checkbox" checked={!!e.comprador_pj} onChange={(x) => mudarE(id, { comprador_pj: x.target.checked })} /> O comprador é uma empresa (pessoa jurídica)</label></fieldset>
    <h3>Prazos do contrato</h3>
    {vencimentos(t, hoje()).length === 0 ? <p className="semdado">Informe o fim do período de opção e a data de fechamento para ver os avisos de vencimento.</p> : <Vencimentos t={t} />}
    <h3>Argumentos para negociar</h3>
    {arg.itens.length === 0 ? <p>Nenhum problema confirmado no checklist até agora.</p> : <><table className="simples" id="e2-argumentos"><thead><tr><th>Problema confirmado</th><th>Custo estimado de resolver</th><th>Origem</th></tr></thead><tbody>
      {arg.itens.map((i) => <tr key={i.item.id}><td>{i.item.nome}</td><td className={"num" + (i.custo ? "" : " semdado")}>{faixaTxt(i.custo)}</td><td><span className={"selo" + (i.custo ? " ed" : " velho")}>{i.origemCusto}</span></td></tr>)}
      <tr className="total"><td>Soma</td><td className="num">{faixaTxt(arg.soma)}</td><td></td></tr></tbody></table>
      <p className="nota">Serve de base para pedir desconto.{arg.semCusto > 0 && <> Há problemas sem custo estimado: a soma está incompleta.</>}</p></>}
  </section>;
}

/** d) DOCUMENTOS (CHECKLIST): substitui a triagem. Uma lista única, por momento. */
function BlocoDocumentos({ t, r, mudarE, base, projeto }: { t: Terreno; r: ResumoTerreno; mudarE: Comum["mudarE"]; base: Base; projeto: Projeto }) {
  const e = t.e2 ?? {}; const id = t.terreno_id; const ds = docsDe(t); const pg = progresso(t); const [lingua, setLingua] = useState<"pt" | "en">("pt"); const [copiado, setCopiado] = useState(false); const txt = pendencias(t, lingua);
  const md = (d: string, m: Partial<DocResp>) => mudarE(id, { documentos: { ...e.documentos, [d]: { situacao: "nao_pedido", ...e.documentos?.[d], ...m } } });
  const custo = (item: string, f: Faixa3 | undefined) => mudarE(id, { triagem: { ...e.triagem, [item]: { resposta: null, ...e.triagem?.[item], custo: f, origem: "usuario", data: hoje() } } });
  const alag = projeto.unidade_eleita_id ? indicador(base, {}, projeto.unidade_eleita_id, "c25|pct_area_sfha") : null; const prox = vencimentos(t, hoje())[0];
  return <section className="e2-bloco" id="e2-bloco-documentos"><h2><b className="letra">d</b> Documentos (checklist)</h2>
    <div className="e2-progresso" id="e2-progresso"><div className="barra"><i style={{ width: pg.pct + "%" }} /></div><span>{pg.feitos} de {pg.total} documentos resolvidos</span>{pg.problemas > 0 && <span className="selo velho">{pg.problemas} com problema</span>}</div>
    {prox && <p className={"e2-proximo" + (prox.dias <= 7 ? " perto" : "")}>Vence primeiro: <b>{prox.nome}</b>, {prox.data} ({venceTxt(prox.dias)}).{prox.pendentes.length > 0 && <> Ainda não recebidos até lá: {prox.pendentes.length}.</>}</p>}
    <p className="nota">Marque a situação de cada documento. "Não pedido" e "pedido" contam como item ainda não verificado; "recebido, com problema" leva o custo de resolver para o risco. Nada aqui bloqueia o andamento.</p>
    {MOMENTOS.map((m) => <div key={m.id} className="e2-momento"><h3>{m.nome}</h3>
      {ds.filter((d) => d.doc.momento === m.id).map(({ doc, r: x }) => { const marcados = x.problemas ?? (doc.itens.length === 1 ? doc.itens : []); return (
        <div key={doc.id} className={"e2-doc sit-" + x.situacao} id={"doc-" + doc.id}>
          <div className="e2-doc-texto"><h4>{doc.nome}</h4><p>{doc.oQueE}</p><p className="nota">Quem fornece: {doc.quem}</p><p className="nota">O que verifica: {doc.verifica}</p>
            {doc.id === "alagamento_det" && alag?.v != null && <p className="nota base">O que a base já sabe: {fmt(alag.v, alag.um)} da área da região está em zona de alagamento ({alag.f}, {alag.ref}). É dado da região, não do lote.</p>}</div>
          <div className="e2-doc-campos">
            <label>Situação<select className="doc-situacao" value={x.situacao} onChange={(v) => md(doc.id, { situacao: v.target.value as SituacaoDoc, data: x.data ?? hoje() })}>{SITUACOES_DOC.map((s) => <option key={s.v} value={s.v}>{tr(s.rotulo)}</option>)}</select></label>
            <label>Data<input type="date" value={x.data ?? ""} onChange={(v) => md(doc.id, { data: v.target.value || undefined })} /></label>
            <label className="largo">Anotação ou link do arquivo<input value={x.nota ?? ""} onChange={(v) => md(doc.id, { nota: v.target.value })} /></label></div>
          {x.situacao === "recebido_problema" && <div className="e2-doc-problema">
            {doc.itens.length > 1 && <fieldset><legend>O problema é em:</legend>{doc.itens.map((it) => <label key={it}><input type="checkbox" checked={marcados.includes(it)} onChange={(v) => md(doc.id, { problemas: v.target.checked ? [...marcados, it] : marcados.filter((y) => y !== it) })} /> {tr(ITENS_TRIAGEM.find((i) => i.id === it)!.nome)}</label>)}</fieldset>}
            {doc.itens.length === 0 && <p className="nota">Este documento não está ligado a um item de risco da etapa 2. Anote o problema acima.</p>}
            {doc.id === "alagamento_det" && <label className="marca"><input type="checkbox" checked={!!e.floodway_total} onChange={(v) => mudarE(id, { floodway_total: v.target.checked })} /> O lote está inteiro dentro do canal de escoamento (floodway)</label>}
            {r.itens.filter((i) => marcados.includes(i.item.id) && doc.itens.includes(i.item.id)).map((i) => <div key={i.item.id} className="e2-resolver"><p><b>{i.item.nome}</b>{i.item.podeInviabilizar || i.inviabiliza ? <span className="selo velho">pode inviabilizar</span> : null}</p>
              {i.inviabiliza && <p className="aviso erro">Atenção: este problema depende de terceiros e pode não ter solução. Verifique antes de pagar qualquer valor.</p>}
              <p>Custo de resolver: <b className={i.custo ? "" : "semdado"}>{faixaTxt(i.custo)}</b> <span className="selo ed">{i.origemCusto}</span>{i.ref && <FonteRef base={base} id={i.ref.id} />}</p>
              <details><summary>Informar o meu valor</summary><FaixaEd v={e.triagem?.[i.item.id]?.custo} onChange={(f) => custo(i.item.id, f)} /></details></div>)}</div>}
        </div>); })}</div>)}
    <details id="e2-pendencias"><summary>Lista de pendências para o corretor e a title company</summary>
      <div className="modo-e2"><button className={lingua === "pt" ? "ativo" : ""} onClick={() => setLingua("pt")}>Português</button><button className={lingua === "en" ? "ativo" : ""} onClick={() => setLingua("en")}>English</button></div>
      <textarea readOnly value={txt} rows={Math.min(22, txt.split("\n").length + 1)} />
      <button onClick={() => { navigator.clipboard?.writeText(txt).then(() => setCopiado(true), () => setCopiado(false)); }}>{copiado ? "Copiado" : "Copiar o texto"}</button></details>
  </section>;
}

const FRASE: Record<string, string> = {
  nao_respondida: "Você ainda não marcou nenhum documento do checklist deste terreno.", segue: "Pelos documentos recebidos, não há impedimento conhecido neste terreno.",
  condicoes: "Este terreno tem problemas confirmados que custam dinheiro ou tempo para resolver. Eles já estão somados abaixo.",
  inviabilizar: "Atenção: há um problema que depende de terceiros e pode não ter solução. Verifique isso antes de pagar qualquer valor." };
/** RISCO: resumo no fim da etapa, depois dos quatro blocos. */
function Resultado({ t, r, projeto }: { t: Terreno; r: ResumoTerreno; projeto: Projeto; base: Base }) {
  const prim = verificarPrimeiro(r.itens); const n = Math.max(1, projeto.n_casas ?? 1);
  return <section className={"e2-bloco e2-resultado res-" + r.resultado} id="e2-resultado"><h2>Resumo de risco <Selo r={r} /></h2>
    <p className="frase">{FRASE[r.resultado]}</p>
    {!r.preco ? <p className="aviso">Sem preço, não há como somar o custo. Informe o preço anunciado, a sua oferta ou o preço fechado.</p> : <>
      <p className="preco-uso-linha">Preço em uso: <b>{usd(r.preco.valor)}</b> <span className="selo">{ROTULO_PRECO[r.preco.tipo]}</span></p>
      <table className="simples e2-pilha"><thead><tr><th></th><th>Mínimo</th><th>Provável</th><th>Máximo</th></tr></thead><tbody>
        <tr><td>Total de aquisição</td><td className="num">{usd(r.aquisicao.min)}</td><td className="num">{usd(r.aquisicao.provavel)}</td><td className="num">{usd(r.aquisicao.max)}</td></tr>
        <tr><td>Risco confirmado (problemas do checklist)</td><td className="num">{usd(r.riscoConfirmado.min)}</td><td className="num">{usd(r.riscoConfirmado.provavel)}</td><td className="num">{usd(r.riscoConfirmado.max)}</td></tr>
        <tr><td>Exposição (itens ainda não verificados)</td><td className="num">—</td><td className="num">—</td><td className="num">{usd(r.exposicao.max)}</td></tr>
        <tr className="total"><td>Custo do terreno com risco{r.podeInviabilizar && <span className="selo tri-inviabilizar">pode inviabilizar</span>}</td><td className="num">{usd(r.comRisco.min)}</td><td className="num">{usd(r.comRisco.provavel)}</td><td className="num">{usd(r.comRisco.max)}</td></tr>
        {n > 1 && <tr><td>Por casa ({n} casas)</td><td className="num">{usd(r.porCasa.min)}</td><td className="num">{usd(r.porCasa.provavel)}</td><td className="num">{usd(r.porCasa.max)}</td></tr>}
      </tbody></table></>}
    <SemValor r={r} />
    <Vencimentos t={t} />
    <h3>O que verificar primeiro</h3>
    {prim.length === 0 ? <p>Todos os itens de risco foram verificados pelos documentos.</p> : <ol className="e2-primeiro">{prim.map((i) => <li key={i.item.id}><b>{i.item.nome}</b>{i.item.podeInviabilizar && <span className="selo velho">pode inviabilizar</span>}
      <small>Documentos que respondem: {DOCS.filter((d) => d.itens.includes(i.item.id)).map((d) => tr(d.nome)).join("; ")}</small></li>)}</ol>}
    <p className="aviso-legal interno">Apoio à decisão, não recomendação de investimento nem avaliação de imóvel.</p>
  </section>;
}

const BLOCOS = ["Preço", "Financiamento", "Negociação", "Documentos", "Resumo de risco"];
function FichaTerreno({ base, projeto, ir, modo, mudarT, mudarE, t, passo }: Comum & { t: Terreno; passo: number | null }) {
  const r = resumoTerreno(base, projeto, t); const rota = `etapa-2-terreno-${t.terreno_id}`;
  const topo = <><h2 className="e2-nome">{nomeT(t)}{t.e2?.exemplo && <span className="selo ed">exemplo fictício</span>}{t.status === "descartado" && <span className="selo velho">descartado</span>}{t.status === "eleito" && <span className="selo">{t.ja_possuido ? "terreno próprio" : "escolhido"}</span>}</h2>
    {t.e2?.exemplo && <p className="aviso">Terreno de exemplo: todos os dados são fictícios e servem só para testar o fluxo.</p>}</>;
  const blocos = [<BlocoPreco key="a" t={t} r={r} mudarT={mudarT} mudarE={mudarE} base={base} projeto={projeto} />, <BlocoFinanciamento key="b" t={t} r={r} mudarE={mudarE} base={base} />, <BlocoNegociacao key="c" t={t} r={r} mudarE={mudarE} base={base} />,
    <BlocoDocumentos key="d" t={t} r={r} mudarE={mudarE} base={base} projeto={projeto} />, <Resultado key="r" t={t} r={r} projeto={projeto} base={base} />];
  if (modo === "expert") return <>{topo}<nav className="e2-indice">{BLOCOS.map((b, k) => <a key={b} href={"#" + rota} onClick={(x) => { x.preventDefault(); document.querySelectorAll(".e2 > .e2-bloco")[k]?.scrollIntoView({ behavior: "smooth" }); }}>{b}</a>)}</nav>
    {blocos}<div className="acoes"><button className="primario" onClick={() => ir("etapa-2")}>Ver a lista de terrenos</button></div></>;
  const k = Math.min(passo ?? 0, PASSOS_GUIADO - 1); const ult = PASSOS_GUIADO - 1;
  return <>{topo}
    <ol className="e2-trilha">{BLOCOS.map((b, i) => <li key={b} className={i === k ? "atual" : i < k ? "feito" : ""}><button onClick={() => ir(`${rota}-p${i}`)}>{b}</button></li>)}</ol>
    <p className="progresso">Passo {k + 1} de {PASSOS_GUIADO}</p>
    {blocos[k]}
    <div className="acoes passos-e2">{k < ult ? <button id="e2-continuar" className="primario" onClick={() => ir(`${rota}-p${k + 1}`)}>Continuar →</button> : <button id="e2-lista" className="primario" onClick={() => ir("etapa-2")}>Ver a lista de terrenos</button>}
      {k < ult && <button className="link" onClick={() => ir(`${rota}-p${ult}`)}>Ir direto ao resumo de risco</button>}</div></>;
}

function Comparar({ base, projeto, ir }: Comum) {
  const ts = (projeto.e2_comparar ?? []).map((id) => projeto.terrenos.find((t) => t.terreno_id === id && t.status !== "descartado")).filter((t): t is Terreno => !!t).slice(0, MAX_COMPARAR);
  if (ts.length < 2) return <p className="aviso">Marque de 2 a 4 terrenos na lista para comparar. <button className="link" onClick={() => ir("etapa-2")}>Ver a lista de terrenos</button></p>;
  const rs = ts.map((t) => resumoTerreno(base, projeto, t)); const L = (nome: string, f: (t: Terreno, r: ResumoTerreno) => React.ReactNode) => <tr key={nome}><th>{nome}</th>{ts.map((t, k) => <td key={t.terreno_id}>{f(t, rs[k])}</td>)}</tr>;
  return <><h2>Comparar lado a lado</h2><div className="rolagem"><table className="simples e2-comparar" id="e2-tabela-comparar"><thead><tr><th></th>{ts.map((t) => <th key={t.terreno_id}><button className="link" onClick={() => ir(`etapa-2-terreno-${t.terreno_id}`)}>{nomeT(t)}</button></th>)}</tr></thead><tbody>
    {L("Condado", (t) => t.e2?.condado ?? <span className="semdado">sem dado</span>)}{L("Tamanho", (t) => (t.acres == null ? <span className="semdado">sem dado</span> : `${t.acres} acres`))}
    {L("Preço em uso", (_t, r) => (r.preco ? <>{usd(r.preco.valor)}<small>{ROTULO_PRECO[r.preco.tipo]}</small></> : <span className="semdado">sem preço</span>))}
    {L("Total de aquisição", (_t, r) => (r.preco ? faixaTxt(r.aquisicao) : <span className="semdado">sem valor</span>))}{L("Risco confirmado", (_t, r) => faixaTxt(r.riscoConfirmado))}{L("Exposição não verificada (máximo)", (_t, r) => usd(r.exposicao.max))}
    {L("Custo do terreno com risco", (_t, r) => (r.preco ? <b>{faixaTxt(r.comRisco)}</b> : <span className="semdado">sem valor</span>))}{L("Linhas sem valor", (_t, r) => (r.semValor.length ? <span className="naoatende">{r.semValor.length}</span> : "0"))}
    {L("Situação da negociação", (t) => sitNeg(t))}{L("Progresso do checklist", (t) => <Barra t={t} />)}{L("Risco", (_t, r) => <Selo r={r} />)}{L("Itens a verificar", (_t, r) => r.naoVerificados)}
    {ITENS_TRIAGEM.map((it) => L(it.nome, (_t, r) => { const x = r.itens.find((i) => i.item.id === it.id)!; return RESPOSTAS.find((o) => o.v === x.resposta)!.rotulo; }))}
    {L("Fim do período de opção", (t) => t.e2?.negociacao?.fim_opcao ?? <span className="semdado">sem dado</span>)}{L("Data de fechamento", (t) => t.e2?.negociacao?.data_fechamento ?? <span className="semdado">sem dado</span>)}{L("Parcela mensal", (_t, r) => (r.financiamento ? usd(r.financiamento.parcela) : "—"))}
  </tbody></table></div>
    <div className="acoes"><button onClick={() => exportar(base, projeto)}>Exportar planilha (.xlsx)</button><button className="primario" onClick={() => ir("etapa-2")}>Ver a lista de terrenos</button></div></>;
}

function Resumo({ base, projeto, ir }: Comum) {
  const t = projeto.terrenos.find((x) => x.status === "eleito");
  if (!t) return <p className="aviso">Nenhum terreno escolhido ainda. Escolha um na lista para ver o resumo. <button className="link" onClick={() => ir("etapa-2")}>Ver a lista de terrenos</button></p>;
  const r = resumoTerreno(base, projeto, t);
  return <><h2 className="e2-nome">Terreno escolhido: {nomeT(t)}</h2><Resultado t={t} r={r} projeto={projeto} base={base} />
    <div className="acoes"><button onClick={() => ir(`etapa-2-terreno-${t.terreno_id}`)}>Abrir o terreno</button><button onClick={() => ir("etapa-2")}>Ver a lista de terrenos</button></div></>;
}

/** Planilha da etapa 2: comparação, linhas de custo, triagem e avisos. Só dados do próprio projeto. */
function exportar(base: Base, p: Projeto) {
  const ts = p.terrenos; const rs = ts.map((t) => resumoTerreno(base, p, t)); const wb = XLSX.utils.book_new(); type L = Record<string, string | number | null>;
  const comp: L[] = ts.map((t, k) => { const r = rs[k]; return { terreno: nomeT(t), situacao: t.status, condado: t.e2?.condado ?? "", acres: t.acres, preco_em_uso: r.preco?.valor ?? null, tipo_do_preco: r.preco ? ROTULO_PRECO[r.preco.tipo] : "sem preço",
    aquisicao_min: r.aquisicao.min, aquisicao_provavel: r.aquisicao.provavel, aquisicao_max: r.aquisicao.max, risco_confirmado_provavel: r.riscoConfirmado.provavel, exposicao_nao_verificada_max: r.exposicao.max,
    com_risco_min: r.comRisco.min, com_risco_provavel: r.comRisco.provavel, com_risco_max: r.comRisco.max, negociacao: sitNeg(t), checklist: `${progresso(t).feitos} de ${progresso(t).total}`, fim_opcao: t.e2?.negociacao?.fim_opcao ?? "", data_fechamento: t.e2?.negociacao?.data_fechamento ?? "", risco: ROTULO_TRIAGEM[r.resultado], itens_a_verificar: r.naoVerificados, linhas_sem_valor: r.semValor.join("; "),
    parcela_mensal: r.financiamento?.parcela ?? null, total_de_juros: r.financiamento?.totalJuros ?? null, motivo_descarte: t.e2?.descarte ? `${t.e2.descarte.motivo} ${t.e2.descarte.texto}`.trim() : "", exemplo_ficticio: t.e2?.exemplo ? "sim" : "" }; });
  const custos: L[] = ts.flatMap((t, k) => rs[k].linhas.filter((l) => l.aplica).map((l) => ({ terreno: nomeT(t), linha: l.linha.nome, min: l.valor?.min ?? null, provavel: l.valor?.provavel ?? null, max: l.valor?.max ?? null, origem: l.origem, soma_ao_total: l.linha.naoSoma ? "não: abatido do preço" : l.aParte ? "não: " + l.aParte : "sim", confianca: l.ref?.confianca ?? "", regra_do_provavel: l.ref?.regra ?? "",
    fonte: l.ref ? l.ref.fontes.map((f) => f.url).join(" ; ") : l.linha.id === "titulo" ? FONTE_TITULO.url : "", data_da_fonte: l.ref?.data ?? (l.linha.id === "titulo" ? FONTE_TITULO.data : "") })));
  const tri: L[] = ts.flatMap((t, k) => rs[k].itens.map((i) => ({ terreno: nomeT(t), item: i.item.nome, resposta: RESPOSTAS.find((o) => o.v === i.resposta)!.rotulo, pode_inviabilizar: i.inviabiliza ? "sim" : "",
    custo_min: i.custo?.min ?? null, custo_provavel: i.custo?.provavel ?? null, custo_max: i.custo?.max ?? null, origem_do_custo: i.origemCusto, documentos_que_respondem: DOCS.filter((d) => d.itens.includes(i.item.id)).map((d) => d.nome).join("; ") })));
  const docs: L[] = ts.flatMap((t) => docsDe(t).map((d) => ({ terreno: nomeT(t), momento: MOMENTOS.find((m) => m.id === d.doc.momento)!.nome, documento: d.doc.nome, nome_em_ingles: d.doc.en, situacao: SITUACOES_DOC.find((x) => x.v === d.r.situacao)!.rotulo, data: d.r.data ?? "", anotacao: d.r.nota ?? "", quem_fornece: d.doc.quem })));
  const neg: L[] = ts.flatMap((t) => (t.e2?.negociacao?.historico ?? []).map((l) => ({ terreno: nomeT(t), data: l.data, tipo: l.tipo === "oferta" ? "minha oferta" : "contraproposta do vendedor", valor: l.valor, observacao: l.obs ?? "" })));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(comp), "Comparação"); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(custos), "Custos de aquisição"); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(docs), "Documentos"); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tri), "Risco"); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(neg), "Negociação");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ aviso: "Groundwork · Dallas–Fort Worth · Etapa 2, Aquisição do terreno" }, { aviso: AVISO_TRIAGEM }, { aviso: "O preço em uso é o registrado pelo dono do projeto (preço anunciado, oferta ou preço fechado). Estimativas de referência são faixas publicadas, com fonte; não são valores oficiais." },
    { aviso: "Esta planilha é apoio à decisão. Não é recomendação de investimento nem avaliação de imóvel." }, { aviso: "Groundwork, by CSD Tools. CSD Tools é a linha de ferramentas da CSD Strategy. CSD Strategy is a d/b/a of Green to suit LLC." }]), "Aviso");
  XLSX.writeFile(wb, `groundwork_${p.nome.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w-]+/g, "_")}_etapa2_${hoje()}.xlsx`);
}
