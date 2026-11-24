// Etapa 2 — Aquisição do terreno. Candidatos, triagem, pilha de custos de aquisição, pagamento, comparação e escolha.
// Tudo o que se grava aqui é dado privado do projeto (fica no navegador do dono). Nada é apagado: terreno descartado fica guardado com o motivo.
import { useState } from "react";
import * as XLSX from "xlsx";
import type { Base, DadosEtapa2, Faixa3, Projeto, Terreno } from "../tipos";
import { hoje } from "../estado";
import { tr } from "../i18n";
import { AVISO_TRIAGEM, ITENS_TRIAGEM, MOTIVOS_DESCARTE, PRAZOS, RESPOSTAS } from "./catalogo";
import { FONTE_TITULO, ROTULO_PRECO, ROTULO_TRIAGEM, perguntas, refVelha, resumoTerreno, verificarPrimeiro, type ItemResolvido, type ResumoTerreno } from "./calculo";

const CONDADOS = ["Collin", "Dallas", "Denton", "Ellis", "Hunt", "Johnson", "Kaufman", "Parker", "Rockwall", "Tarrant", "Wise"];
const MAX_CANDIDATOS = 10, MAX_COMPARAR = 4;
const usd = (v: number | null | undefined) => (v === null || v === undefined || !isFinite(v) ? "sem valor" : "$" + Math.round(v).toLocaleString("pt-BR"));
const faixaTxt = (f: Faixa3 | null) => (!f ? "sem valor" : f.min === f.max ? usd(f.provavel) : `${usd(f.provavel)} (${usd(f.min)} a ${usd(f.max)})`);
const diasTxt = (f: Faixa3) => (!f.max ? "sem dado" : f.min === f.max ? `${f.provavel} dias` : `${f.provavel} dias (${f.min} a ${f.max})`);
const nomeT = (t: Terreno) => t.endereco || t.parcel_id || "Terreno sem endereço";
const ROTAT = /^etapa-2-terreno-(T-[a-z0-9]+)(?:-p(\d+))?$/i;
/** passos do modo guiado: 0 dados do terreno, 1 a 9 triagem, 10 preço e pagamento, 11 resultado */
export const PASSOS_GUIADO = ITENS_TRIAGEM.length + 3;

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
  return { terreno_id: "T-exemplo" + Date.now().toString(36), unidade_id: p.unidade_eleita_id ?? "", endereco: "EXEMPLO — 123 Example St", parcel_id: "R-000000 (fictício)", acres: 0.25, preco_pedido: 180000, isd_id_proprio: null, mud_pid: null, isencao_agricola: false, status: "candidato",
    e2: { exemplo: true, condado: "Collin", tamanho_sqft: 10890, valor_cadastro: 150000, dentro_cidade: true, isd_nome: "ISD de exemplo", loteamento: "Loteamento de exemplo", zoneamento: "SF-10", agua_esgoto: "rede", informado: ["tudo"],
      observacoes: "Terreno de exemplo. Todos os dados são fictícios.", oferta: 170000, sinal: 1700, taxa_opcao: 250,
      pagamento: { forma: "financiado", entrada: 34000, juros_aa_pct: 7.5, parcelas: 180 },
      triagem: { zoneamento: { resposta: "ok", origem: "usuario" }, tamanho_minimo: { resposta: "ok", origem: "usuario" }, acesso: { resposta: "ok", origem: "usuario" }, agua_esgoto: { resposta: "ok", origem: "usuario" },
        alagamento: { resposta: "nao_sei", origem: "usuario" }, restricoes: { resposta: "problema", origem: "usuario", custo: { min: 500, provavel: 1500, max: 3000 }, prazo_dias: { min: 10, provavel: 20, max: 45 }, obs: "HOA exige aprovação do projeto (fictício)." },
        servidoes: { resposta: "nao_sei", origem: "usuario" }, isencao_agricola: { resposta: "ok", origem: "usuario" }, minerais: { resposta: "nao_sei", origem: "usuario" } },
      custos: { survey: { min: 600, provavel: 700, max: 900, data: hoje(), fonte: "exemplo fictício" }, fechamento: { min: 500, provavel: 500, max: 500, data: hoje(), fonte: "exemplo fictício" } },
      prazos: { opcao: { min: 7, provavel: 10, max: 10 }, estudos: { min: 15, provavel: 21, max: 30 }, fechamento: { min: 7, provavel: 14, max: 30 } } } };
}

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
    <p className="e2-regiao">{regiao ? <>Região do projeto: <b>{regiao}</b></> : "Você ainda não escolheu uma região na etapa 1. Pode cadastrar terrenos mesmo assim."}</p>
    <p className="ajuda">Cadastre de 1 a 10 terrenos candidatos. Para cada um, a ferramenta faz a triagem, soma o custo de aquisição e mostra o risco. Depois você compara e escolhe.</p>
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
      <div className="rolagem"><table className="simples e2-lista" id="e2-lista"><thead><tr><th>Comparar</th><th>Terreno</th><th>Preço em uso</th><th>Custo de aquisição</th><th>Custo com risco</th><th>Triagem</th><th>Prazo até fechar</th><th></th></tr></thead><tbody>
        {linhas.map(({ t, r }) => <tr key={t.terreno_id} className={t.status === "eleito" ? "eleito" : ""}>
          <td><input type="checkbox" aria-label="Comparar" checked={comp.includes(t.terreno_id)} disabled={!comp.includes(t.terreno_id) && comp.length >= MAX_COMPARAR} onChange={() => marcar(t.terreno_id)} /></td>
          <td><button className="link" onClick={() => ir(`etapa-2-terreno-${t.terreno_id}`)}>{nomeT(t)}</button>{t.e2?.exemplo && <span className="selo ed">exemplo fictício</span>}{t.status === "eleito" && <span className="selo">{t.ja_possuido ? "terreno próprio" : "escolhido"}</span>}
            <small>{[t.e2?.condado && `${t.e2.condado} County`, t.acres != null && `${t.acres} acres`].filter(Boolean).join(" · ")}</small></td>
          <td className="num">{r.preco ? <>{usd(r.preco.valor)}<small>{ROTULO_PRECO[r.preco.tipo]}</small></> : <span className="semdado">sem preço</span>}</td>
          <td className="num">{r.preco ? usd(r.aquisicao.provavel) : <span className="semdado">sem valor</span>}{r.semValor.length > 0 && <small className="naoatende">{r.semValor.length} linhas sem valor</small>}</td>
          <td className="num">{r.preco ? <>{usd(r.comRisco.provavel)}<small>até {usd(r.comRisco.max)}</small></> : <span className="semdado">sem valor</span>}</td>
          <td><Selo r={r} />{r.naoVerificados > 0 && <small>{r.naoVerificados} itens a verificar</small>}</td>
          <td className="num">{t.ja_possuido ? "—" : diasTxt(r.prazoDias)}</td>
          <td className="botoes"><button onClick={() => ir(`etapa-2-terreno-${t.terreno_id}`)}>Abrir</button>
            {!t.ja_possuido && (t.status === "eleito" ? <button onClick={() => mudarT(t.terreno_id, { status: "candidato" })}>Desfazer escolha</button> : <button className="e2-escolher" onClick={() => escolher(t.terreno_id)}>Escolher</button>)}
            {!t.ja_possuido && <button className="e2-descartar" onClick={() => { setDescartando(t.terreno_id); setMotivo(MOTIVOS_DESCARTE[0]); }}>Descartar</button>}</td></tr>)}
      </tbody></table></div>
      <p className="nota">"Custo com risco" soma o custo de aquisição aos problemas confirmados na triagem. O valor "até" inclui também o máximo dos itens que você ainda não verificou.</p>
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

function Dados({ t, mudarT, mudarE, curto }: { t: Terreno; mudarT: Comum["mudarT"]; mudarE: Comum["mudarE"]; curto?: boolean }) {
  const e = t.e2 ?? {}; const id = t.terreno_id;
  return <section className="e2-bloco"><h2>Dados do terreno</h2>
    <p className="nota auto">O preenchimento automático pelo cadastro do condado ainda não está disponível. Preencha à mão o que souber; o que você digita fica marcado "informado por mim". Campo vazio fica "sem dado".</p>
    <div className="e2-grade">
      <label className="campo">Endereço ou identificação<input id="e2-endereco" value={t.endereco} onChange={(x) => mudarT(id, { endereco: x.target.value })} /></label>
      <label className="campo">Condado<select id="e2-condado" value={e.condado ?? ""} onChange={(x) => mudarE(id, { condado: x.target.value || undefined })}><option value="">sem dado</option>{CONDADOS.map((c) => <option key={c}>{c}</option>)}</select></label>
      <label className="campo">Tamanho (acres)<Num id="e2-acres" v={t.acres} onChange={(n) => mudarT(id, { acres: n, e2: { ...e, tamanho_sqft: n === null ? null : Math.round(n * 43560) } })} /></label>
      <label className="campo">Preço anunciado, registrado manualmente (US$)<Num id="e2-anunciado" v={t.preco_pedido} onChange={(n) => mudarT(id, { preco_pedido: n })} /></label>
      {!curto && <>
        <label className="campo">Número do lote no cadastro do condado<input value={t.parcel_id} onChange={(x) => mudarT(id, { parcel_id: x.target.value })} /></label>
        <label className="campo">Valor de cadastro do terreno (US$)<Num v={e.valor_cadastro} onChange={(n) => mudarE(id, { valor_cadastro: n })} /></label>
        <label className="campo">Dentro dos limites da cidade?<select value={e.dentro_cidade == null ? "" : e.dentro_cidade ? "sim" : "nao"} onChange={(x) => mudarE(id, { dentro_cidade: x.target.value === "" ? null : x.target.value === "sim" })}><option value="">sem dado</option><option value="sim">Sim</option><option value="nao">Não, fora de cidade</option></select></label>
        <label className="campo">Distrito escolar (ISD)<input value={e.isd_nome ?? ""} onChange={(x) => mudarE(id, { isd_nome: x.target.value })} /></label>
        <label className="campo">Loteamento<input value={e.loteamento ?? ""} onChange={(x) => mudarE(id, { loteamento: x.target.value })} /></label>
        <label className="campo">Zoneamento<input value={e.zoneamento ?? ""} onChange={(x) => mudarE(id, { zoneamento: x.target.value })} /></label>
        <label className="campo">Link do anúncio<input type="url" value={e.link_anuncio ?? ""} onChange={(x) => mudarE(id, { link_anuncio: x.target.value })} /></label></>}
      <label className="campo">Água e esgoto<select id="e2-agua" value={e.agua_esgoto ?? ""} onChange={(x) => mudarE(id, { agua_esgoto: (x.target.value || null) as DadosEtapa2["agua_esgoto"] })}><option value="">sem dado</option><option value="rede">Rede pública</option><option value="poco_fossa">Poço e fossa</option><option value="nao_sei">Não sei</option></select></label>
    </div>
    {!curto && <label className="campo largo">Observações<textarea value={e.observacoes ?? ""} onChange={(x) => mudarE(id, { observacoes: x.target.value })} /></label>}
  </section>;
}

function Preco({ t, r, mudarE }: { t: Terreno; r: ResumoTerreno; mudarE: Comum["mudarE"] }) {
  const e = t.e2 ?? {}; const id = t.terreno_id; const pg = e.pagamento ?? { forma: "a_vista" as const }; const f = r.financiamento;
  const mp = (m: Partial<typeof pg>) => mudarE(id, { pagamento: { ...pg, ...m } });
  return <section className="e2-bloco"><h2>Preço e pagamento</h2>
    <p className="preco-uso-linha">{r.preco ? <>Preço em uso: <b>{usd(r.preco.valor)}</b> <span className="selo">{ROTULO_PRECO[r.preco.tipo]}</span></> : <span className="semdado">Sem preço: informe o preço anunciado, a sua oferta ou o preço fechado.</span>}</p>
    <p className="nota">Vale o mais avançado que existir: preço fechado, depois a sua oferta, depois o preço anunciado.</p>
    {!t.ja_possuido && <div className="e2-grade">
      <label className="campo">Minha oferta (US$)<Num id="e2-oferta" v={e.oferta} onChange={(n) => mudarE(id, { oferta: n })} /></label>
      <label className="campo">Preço fechado (US$)<Num id="e2-fechado" v={e.preco_fechado} onChange={(n) => mudarE(id, { preco_fechado: n })} /></label>
      <label className="campo">Sinal (earnest money, US$)<Num v={e.sinal} onChange={(n) => mudarE(id, { sinal: n })} /></label>
      <label className="campo">Taxa de opção (US$)<Num v={e.taxa_opcao} onChange={(n) => mudarE(id, { taxa_opcao: n })} /></label></div>}
    <div className="modo-e2 forma"><button id="e2-avista" className={pg.forma === "a_vista" ? "ativo" : ""} onClick={() => mp({ forma: "a_vista" })}>À vista</button><button id="e2-financiado" className={pg.forma === "financiado" ? "ativo" : ""} onClick={() => mp({ forma: "financiado" })}>Financiado</button></div>
    {pg.forma === "financiado" && <>
      <div className="e2-grade">
        <label className="campo">Entrada (US$)<Num id="e2-entrada" v={pg.entrada} onChange={(n) => mp({ entrada: n, financiado: null })} /></label>
        <label className="campo">Juros ao ano (%)<Num id="e2-juros" v={pg.juros_aa_pct} onChange={(n) => mp({ juros_aa_pct: n })} /></label>
        <label className="campo">Número de parcelas mensais<Num id="e2-parcelas" v={pg.parcelas} onChange={(n) => mp({ parcelas: n === null ? null : Math.round(n) })} /></label></div>
      {f ? <><dl className="e2-numeros"><div><dt>Valor financiado</dt><dd>{usd(f.financiado)}</dd></div><div><dt>Parcela mensal</dt><dd>{usd(f.parcela)}</dd></div><div><dt>Total de juros no contrato</dt><dd>{usd(f.totalJuros)}</dd></div></dl>
        <details><summary>Saldo devedor mês a mês</summary><div className="rolagem baixa"><table className="simples"><thead><tr><th>Mês</th><th>Juros</th><th>Amortização</th><th>Saldo devedor</th></tr></thead><tbody>{f.saldo.map((s) => <tr key={s.mes}><td>{s.mes}</td><td className="num">{usd(s.juros)}</td><td className="num">{usd(s.amortizacao)}</td><td className="num">{usd(s.saldo)}</td></tr>)}</tbody></table></div></details>
        <p className="nota">Os juros pagos durante o projeto entram na etapa 6 (Carregamento), não nesta soma. Parcela fixa, calculada com juros compostos mensais.</p></>
        : <p className="semdado">Informe a entrada, os juros e o número de parcelas para ver a parcela e o total de juros.</p>}</>}
  </section>;
}

function ItemEd({ i, t, mudarE, base }: { i: ItemResolvido; t: Terreno; mudarE: Comum["mudarE"]; base: Base }) {
  const e = t.e2 ?? {}; const r = e.triagem?.[i.item.id]; const grava = (m: Partial<NonNullable<typeof r>>) => mudarE(t.terreno_id, { triagem: { ...e.triagem, [i.item.id]: { resposta: r?.resposta ?? null, ...r, ...m, origem: "usuario", data: hoje() } } });
  const aberto = i.resposta === "problema" || i.resposta === "nao_sei";
  return <div className={"e2-item" + (i.inviabiliza ? " grave" : "")} id={"tri-" + i.item.id}>
    <h3>{i.item.nome}{i.item.podeInviabilizar && <span className="selo velho">pode inviabilizar</span>}</h3>
    <p>{i.item.explicacao}</p><p className="nota">Onde confirmar: {i.item.quem}</p>
    <div className="respostas" role="group">{RESPOSTAS.map((o) => <button key={o.v} className={"resp-" + o.v + (i.resposta === o.v ? " ativo" : "")} onClick={() => grava({ resposta: o.v })}>{o.rotulo}</button>)}</div>
    {i.item.id === "alagamento" && i.resposta === "problema" && <label className="marca"><input type="checkbox" checked={!!e.floodway_total} onChange={(x) => mudarE(t.terreno_id, { floodway_total: x.target.checked })} /> O lote está inteiro dentro do canal de escoamento (floodway)</label>}
    {i.inviabiliza && <p className="aviso erro">Atenção: este problema depende de terceiros e pode não ter solução. Verifique antes de pagar qualquer valor.</p>}
    {aberto && <div className="e2-resolver"><p>{i.resposta === "problema" ? "Custo de resolver" : "Custo se o problema existir"}: <b className={i.custo ? "" : "semdado"}>{faixaTxt(i.custo)}</b> <span className="selo ed">{i.origemCusto}</span>
        {i.ref && <FonteRef base={base} id={i.ref.id} />}{i.prazo && <> · Prazo: {diasTxt(i.prazo)}</>}</p>
      <details><summary>Informar o meu valor</summary><p className="nota">Custo de resolver</p><FaixaEd v={r?.custo} onChange={(f) => grava({ custo: f })} /><p className="nota">Prazo para resolver</p><FaixaEd unidade="dias" v={r?.prazo_dias} onChange={(f) => grava({ prazo_dias: f })} /></details></div>}
  </div>;
}
function FonteRef({ base, id }: { base: Base; id: string }) {
  const r = base.referencias?.find((x) => x.id === id); if (!r) return null;
  return <small className="fonte-ref"> confiança {r.confianca} · {r.geografia} · {r.data}{refVelha(r.data, hoje()) && <span className="selo velho">mais de 6 meses</span>} · {r.fontes.map((f, k) => <a key={k} href={f.url} target="_blank" rel="noreferrer">{f.nome}</a>)}</small>;
}

function Custos({ t, r, mudarE, base }: { t: Terreno; r: ResumoTerreno; mudarE: Comum["mudarE"]; base: Base }) {
  const e = t.e2 ?? {}; const grava = (id: string, f: Faixa3 | undefined) => { const c = { ...e.custos }; if (f) c[id] = { ...f, data: hoje() }; else delete c[id]; mudarE(t.terreno_id, { custos: c }); };
  return <section className="e2-bloco"><h2>Custos de aquisição</h2>
    <p className="nota">Cada linha mostra de onde vem o valor: "tabela oficial", "estimativa de referência" (faixa publicada, com fonte; nunca valor oficial) ou "informado por mim". O seu valor vale só para este projeto e não muda a referência da ferramenta.</p>
    <div className="rolagem"><table className="simples e2-custos" id="e2-custos"><thead><tr><th>Linha</th><th>Valor (provável, mínimo a máximo)</th><th>Origem</th><th></th></tr></thead><tbody>
      {r.linhas.filter((l) => l.aplica).map((l) => <tr key={l.linha.id} className={l.linha.naoSoma ? "naosoma" : ""}>
        <td>{l.linha.nome}<small>{l.linha.ajuda}</small></td>
        <td className={"num" + (l.valor ? "" : " semdado")}>{faixaTxt(l.valor)}{l.linha.naoSoma && l.valor && <small>abatido do preço, não soma</small>}</td>
        <td><span className={"selo" + (l.origem === "sem valor" ? " velho" : l.origem === "informado por mim" ? " ed" : "")}>{l.origem}</span>{l.ref && <FonteRef base={base} id={l.ref.id} />}
          {l.linha.id === "titulo" && l.valor && <small className="fonte-ref"> <a href={FONTE_TITULO.url} target="_blank" rel="noreferrer">Texas Department of Insurance</a> · {FONTE_TITULO.data}</small>}</td>
        <td>{l.linha.id !== "preco" && l.linha.id !== "sinal" && l.linha.id !== "taxa_opcao" && <details><summary>Informar o meu valor</summary><FaixaEd v={e.custos?.[l.linha.id]} onChange={(f) => grava(l.linha.id, f)} /></details>}</td></tr>)}
    </tbody></table></div>
  </section>;
}
function Prazos({ t, mudarE }: { t: Terreno; mudarE: Comum["mudarE"] }) {
  const e = t.e2 ?? {};
  return <section className="e2-bloco"><h2>Prazos até o fechamento</h2><div className="e2-prazos">{PRAZOS.map((p) => <div key={p.id}><b>{p.nome}</b><FaixaEd unidade="dias" v={e.prazos?.[p.id]} onChange={(f) => { const c = { ...e.prazos }; if (f) c[p.id] = f; else delete c[p.id]; mudarE(t.terreno_id, { prazos: c }); }} /></div>)}</div></section>;
}

const FRASE: Record<string, string> = {
  nao_respondida: "Você ainda não respondeu a triagem deste terreno.", segue: "Pelo que você respondeu, não há impedimento conhecido neste terreno.",
  condicoes: "Este terreno tem problemas confirmados que custam dinheiro ou tempo para resolver. Eles já estão somados abaixo.",
  inviabilizar: "Atenção: há um problema que depende de terceiros e pode não ter solução. Verifique isso antes de pagar qualquer valor." };
function Resultado({ t, r, projeto, base }: { t: Terreno; r: ResumoTerreno; projeto: Projeto; base: Base }) {
  const [lingua, setLingua] = useState<"pt" | "en">("pt"); const [copiado, setCopiado] = useState(false); const prim = verificarPrimeiro(r.itens); const n = Math.max(1, projeto.n_casas ?? 1); const txt = perguntas(t, base, lingua);
  return <section className={"e2-bloco e2-resultado res-" + r.resultado} id="e2-resultado"><h2>Resultado deste terreno <Selo r={r} /></h2>
    <p className="frase">{FRASE[r.resultado]}</p>
    {!r.preco ? <p className="aviso">Sem preço, não há como somar o custo. Informe o preço anunciado, a sua oferta ou o preço fechado.</p> : <>
      <p className="preco-uso-linha">Preço em uso: <b>{usd(r.preco.valor)}</b> <span className="selo">{ROTULO_PRECO[r.preco.tipo]}</span></p>
      <table className="simples e2-pilha"><thead><tr><th></th><th>Mínimo</th><th>Provável</th><th>Máximo</th></tr></thead><tbody>
        <tr><td>Custo de aquisição</td><td className="num">{usd(r.aquisicao.min)}</td><td className="num">{usd(r.aquisicao.provavel)}</td><td className="num">{usd(r.aquisicao.max)}</td></tr>
        <tr><td>Risco confirmado (problemas da triagem)</td><td className="num">{usd(r.riscoConfirmado.min)}</td><td className="num">{usd(r.riscoConfirmado.provavel)}</td><td className="num">{usd(r.riscoConfirmado.max)}</td></tr>
        <tr><td>Exposição não verificada (itens "não sei")</td><td className="num">—</td><td className="num">—</td><td className="num">{usd(r.exposicao.max)}</td></tr>
        <tr className="total"><td>Custo do terreno com risco</td><td className="num">{usd(r.comRisco.min)}</td><td className="num">{usd(r.comRisco.provavel)}</td><td className="num">{usd(r.comRisco.max)}</td></tr>
        {n > 1 && <tr><td>Por casa ({n} casas)</td><td className="num">{usd(r.porCasa.min)}</td><td className="num">{usd(r.porCasa.provavel)}</td><td className="num">{usd(r.porCasa.max)}</td></tr>}
      </tbody></table></>}
    {r.semValor.length > 0 && <div className="aviso incompleto" id="e2-sem-valor"><b>Este total está incompleto.</b> Ficaram sem valor, por não haver fonte publicada nem valor informado por você:<ul>{r.semValor.map((s) => <li key={s}>{s.includes(": ") ? <>{s.split(": ")[0]}: {s.split(": ").slice(1).join(": ")}</> : s}</li>)}</ul></div>}
    {!t.ja_possuido && <p>Prazo até fechar: <b>{diasTxt(r.prazoDias)}</b></p>}
    <h3>O que verificar primeiro</h3>
    {prim.length === 0 ? <p>Todos os itens da triagem foram respondidos.</p> : <ol className="e2-primeiro">{prim.map((i) => <li key={i.item.id}><b>{i.item.nome}</b>{i.item.podeInviabilizar && <span className="selo velho">pode inviabilizar</span>}<small>Onde confirmar: {i.item.quem}</small></li>)}</ol>}
    {prim.length > 0 && <details id="e2-perguntas"><summary>Lista de perguntas para o corretor e a title company</summary>
      <div className="modo-e2"><button className={lingua === "pt" ? "ativo" : ""} onClick={() => setLingua("pt")}>Português</button><button className={lingua === "en" ? "ativo" : ""} onClick={() => setLingua("en")}>English</button></div>
      <textarea readOnly value={txt} rows={Math.min(18, txt.split("\n").length + 1)} />
      <button onClick={() => { navigator.clipboard?.writeText(txt).then(() => setCopiado(true), () => setCopiado(false)); }}>{copiado ? "Copiado" : "Copiar o texto"}</button></details>}
    <p className="aviso-legal interno">Apoio à decisão, não recomendação de investimento nem avaliação de imóvel.</p>
  </section>;
}

function FichaTerreno({ base, projeto, ir, modo, mudarT, mudarE, t, passo }: Comum & { t: Terreno; passo: number | null }) {
  const r = resumoTerreno(base, projeto, t); const rota = `etapa-2-terreno-${t.terreno_id}`;
  const topo = <><h2 className="e2-nome">{nomeT(t)}{t.e2?.exemplo && <span className="selo ed">exemplo fictício</span>}{t.status === "descartado" && <span className="selo velho">descartado</span>}{t.status === "eleito" && <span className="selo">{t.ja_possuido ? "terreno próprio" : "escolhido"}</span>}</h2>
    {t.e2?.exemplo && <p className="aviso">Terreno de exemplo: todos os dados são fictícios e servem só para testar o fluxo.</p>}</>;
  if (modo === "expert" || passo === null && modo !== "leigo") return <>{topo}
    <Dados t={t} mudarT={mudarT} mudarE={mudarE} /><Preco t={t} r={r} mudarE={mudarE} />
    <section className="e2-bloco"><h2>Triagem</h2><p className="nota">Responda o que souber. "Não sei" não bloqueia nada: o item entra na lista do que verificar e no valor máximo do risco.</p><div className="e2-itens">{r.itens.map((i) => <ItemEd key={i.item.id} i={i} t={t} mudarE={mudarE} base={base} />)}</div></section>
    <Custos t={t} r={r} mudarE={mudarE} base={base} />{!t.ja_possuido && <Prazos t={t} mudarE={mudarE} />}<Resultado t={t} r={r} projeto={projeto} base={base} />
    <div className="acoes"><button className="primario" onClick={() => ir("etapa-2")}>Ver a lista de terrenos</button></div></>;
  const k = passo ?? 0; const ult = PASSOS_GUIADO - 1; const item = k >= 1 && k <= ITENS_TRIAGEM.length ? r.itens[k - 1] : null;
  return <>{topo}
    <p className="progresso">Passo {k + 1} de {PASSOS_GUIADO}</p>
    {k === 0 && <Dados t={t} mudarT={mudarT} mudarE={mudarE} curto />}
    {item && <section className="e2-bloco"><h2>Triagem</h2><p className="nota">Responda o que souber. "Não sei" não bloqueia nada.</p><ItemEd i={item} t={t} mudarE={mudarE} base={base} /></section>}
    {k === ult - 1 && <Preco t={t} r={r} mudarE={mudarE} />}
    {k === ult && <><Resultado t={t} r={r} projeto={projeto} base={base} /><details><summary>Ver as linhas de custo</summary><Custos t={t} r={r} mudarE={mudarE} base={base} /></details></>}
    <div className="acoes passos-e2">{k < ult ? <button id="e2-continuar" className="primario" onClick={() => ir(`${rota}-p${k + 1}`)}>Continuar →</button> : <button id="e2-lista" className="primario" onClick={() => ir("etapa-2")}>Ver a lista de terrenos</button>}
      {k < ult && <button className="link" onClick={() => ir(`${rota}-p${ult}`)}>Ir direto ao resultado</button>}</div></>;
}

function Comparar({ base, projeto, ir }: Comum) {
  const ts = (projeto.e2_comparar ?? []).map((id) => projeto.terrenos.find((t) => t.terreno_id === id && t.status !== "descartado")).filter((t): t is Terreno => !!t).slice(0, MAX_COMPARAR);
  if (ts.length < 2) return <p className="aviso">Marque de 2 a 4 terrenos na lista para comparar. <button className="link" onClick={() => ir("etapa-2")}>Ver a lista de terrenos</button></p>;
  const rs = ts.map((t) => resumoTerreno(base, projeto, t)); const L = (nome: string, f: (t: Terreno, r: ResumoTerreno) => React.ReactNode) => <tr key={nome}><th>{nome}</th>{ts.map((t, k) => <td key={t.terreno_id}>{f(t, rs[k])}</td>)}</tr>;
  return <><h2>Comparar lado a lado</h2><div className="rolagem"><table className="simples e2-comparar" id="e2-tabela-comparar"><thead><tr><th></th>{ts.map((t) => <th key={t.terreno_id}><button className="link" onClick={() => ir(`etapa-2-terreno-${t.terreno_id}`)}>{nomeT(t)}</button></th>)}</tr></thead><tbody>
    {L("Condado", (t) => t.e2?.condado ?? <span className="semdado">sem dado</span>)}{L("Tamanho", (t) => (t.acres == null ? <span className="semdado">sem dado</span> : `${t.acres} acres`))}
    {L("Preço em uso", (_t, r) => (r.preco ? <>{usd(r.preco.valor)}<small>{ROTULO_PRECO[r.preco.tipo]}</small></> : <span className="semdado">sem preço</span>))}
    {L("Custo de aquisição", (_t, r) => (r.preco ? faixaTxt(r.aquisicao) : <span className="semdado">sem valor</span>))}{L("Risco confirmado", (_t, r) => faixaTxt(r.riscoConfirmado))}{L("Exposição não verificada (máximo)", (_t, r) => usd(r.exposicao.max))}
    {L("Custo do terreno com risco", (_t, r) => (r.preco ? <b>{faixaTxt(r.comRisco)}</b> : <span className="semdado">sem valor</span>))}{L("Linhas sem valor", (_t, r) => (r.semValor.length ? <span className="naoatende">{r.semValor.length}</span> : "0"))}
    {L("Triagem", (_t, r) => <Selo r={r} />)}{L("Itens a verificar", (_t, r) => r.naoVerificados)}
    {ITENS_TRIAGEM.map((it) => L(it.nome, (_t, r) => { const x = r.itens.find((i) => i.item.id === it.id)!; return x.resposta === null ? <span className="semdado">sem resposta</span> : RESPOSTAS.find((o) => o.v === x.resposta)!.rotulo; }))}
    {L("Prazo até fechar", (t, r) => (t.ja_possuido ? "—" : diasTxt(r.prazoDias)))}{L("Parcela mensal", (_t, r) => (r.financiamento ? usd(r.financiamento.parcela) : "—"))}
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
    com_risco_min: r.comRisco.min, com_risco_provavel: r.comRisco.provavel, com_risco_max: r.comRisco.max, triagem: ROTULO_TRIAGEM[r.resultado], itens_a_verificar: r.naoVerificados, linhas_sem_valor: r.semValor.join("; "),
    prazo_dias_provavel: r.prazoDias.provavel, parcela_mensal: r.financiamento?.parcela ?? null, total_de_juros: r.financiamento?.totalJuros ?? null, motivo_descarte: t.e2?.descarte ? `${t.e2.descarte.motivo} ${t.e2.descarte.texto}`.trim() : "", exemplo_ficticio: t.e2?.exemplo ? "sim" : "" }; });
  const custos: L[] = ts.flatMap((t, k) => rs[k].linhas.filter((l) => l.aplica).map((l) => ({ terreno: nomeT(t), linha: l.linha.nome, min: l.valor?.min ?? null, provavel: l.valor?.provavel ?? null, max: l.valor?.max ?? null, origem: l.origem, soma_ao_total: l.linha.naoSoma ? "não" : "sim",
    fonte: l.ref ? l.ref.fontes.map((f) => f.url).join(" ; ") : l.linha.id === "titulo" ? FONTE_TITULO.url : "", data_da_fonte: l.ref?.data ?? (l.linha.id === "titulo" ? FONTE_TITULO.data : "") })));
  const tri: L[] = ts.flatMap((t, k) => rs[k].itens.map((i) => ({ terreno: nomeT(t), item: i.item.nome, resposta: i.resposta === null ? "sem resposta" : RESPOSTAS.find((o) => o.v === i.resposta)!.rotulo, pode_inviabilizar: i.inviabiliza ? "sim" : "",
    custo_min: i.custo?.min ?? null, custo_provavel: i.custo?.provavel ?? null, custo_max: i.custo?.max ?? null, origem_do_custo: i.origemCusto, onde_confirmar: i.item.quem, observacao: t.e2?.triagem?.[i.item.id]?.obs ?? "" })));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(comp), "Comparação"); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(custos), "Custos de aquisição"); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tri), "Triagem");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ aviso: "Groundwork · Dallas–Fort Worth · Etapa 2, Aquisição do terreno" }, { aviso: AVISO_TRIAGEM }, { aviso: "O preço em uso é o registrado pelo dono do projeto (preço anunciado, oferta ou preço fechado). Estimativas de referência são faixas publicadas, com fonte; não são valores oficiais." },
    { aviso: "Esta planilha é apoio à decisão. Não é recomendação de investimento nem avaliação de imóvel." }, { aviso: "Groundwork, by CSD Tools. CSD Tools é a linha de ferramentas da CSD Strategy. CSD Strategy is a d/b/a of Green to suit LLC." }]), "Aviso");
  XLSX.writeFile(wb, `groundwork_${p.nome.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w-]+/g, "_")}_etapa2_${hoje()}.xlsx`);
}
