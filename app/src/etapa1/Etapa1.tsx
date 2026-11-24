import { useMemo, useState } from "react";
import type { Base, Edicao, Projeto } from "../tipos";
import { avaliar, ativas, descreve } from "../definicoes";
import { exportarCsv, exportarXlsx } from "../exportar";
import Criterios from "./Criterios";
import Tabela from "./Tabela";
import Detalhe from "./Detalhe";
import Mapa from "./Mapa";
import Cidade from "./Cidade";
import { CompararUnidades, CompararProjetos } from "./Comparar";

export interface Props {
  base: Base; geo: GeoJSON.FeatureCollection; projeto: Projeto; projetos: Projeto[]; edicoes: Record<string, Edicao>;
  alterar: (m: Partial<Projeto>) => void; editar: (u: string, k: string, v: number | string | null | undefined) => void; irParaEtapa2: () => void;
}
export default function Etapa1(p: Props) {
  const { base, projeto, edicoes } = p;
  type Passo = "inicio" | "cidade" | "criterios" | "resultado";
  const [passo, setPassoLocal] = useState<Passo>(!projeto.caminho ? "inicio" : projeto.caminho === "cidade" ? "cidade" : projeto.unidade_eleita_id ? "resultado" : "criterios");
  const setPasso = (x: Passo) => { setPassoLocal(x); window.scrollTo(0, 0); };
  const escolherCaminho = (c: "cidade" | "criterios") => { p.alterar({ caminho: c }); setPasso(c); };
  const verResultado = () => setPasso("resultado");
  const [aba, setAba] = useState<"ranking" | "mapa" | "unidades" | "projetos">("ranking");
  const [sel, setSel] = useState<string | null>(projeto.caminho === "cidade" ? projeto.unidade_eleita_id : null);
  const [comparar, setComparar] = useState<string[]>([]);
  const linhas = useMemo(() => avaliar(base, projeto, edicoes), [base, projeto, edicoes]);
  const defs = ativas(projeto); const resp = projeto.respostas ?? {};
  const vivas = linhas.filter((l) => !l.eliminada.length);
  const cobMedia = vivas.length ? vivas.reduce((a, l) => a + l.cobertura, 0) / vivas.length : 0;
  const semCriterio = defs.length === 0;
  const alternar = (id: string) => setComparar((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length < 4 ? [...c, id] : c));
  const eleger = (id: string) => { p.alterar({ unidade_eleita_id: id, eleita_em: new Date().toISOString().slice(0, 10) }); };
  const linhaSel = linhas.find((l) => l.u.unidade_id === sel) ?? null;

  return (
    <div className={"etapa1 " + passo}>
      {passo === "inicio" && <div className="inicio">
        <h1>Como você quer definir o lugar?</h1>
        <p>São dois caminhos. Eles levam a resultados financeiros diferentes, e você pode trocar de caminho quando quiser.</p>
        <div className="caminhos">
          <button onClick={() => escolherCaminho("cidade")}><b>Já sei onde quero construir</b><span>Escolho a cidade e vejo tudo o que isso significa: imposto, taxas, prazo de aprovação, ISD, preço de venda e risco.</span><i>Escolher a cidade →</i></button>
          <button onClick={() => escolherCaminho("criterios")}><b>Quero descobrir onde construir</b><span>Defino os critérios (investimento no terreno, tamanho, lote pronto, escola e outros) e a ferramenta indica os lugares que atendem.</span><i>Definir os critérios →</i></button>
        </div>
      </div>}
      {passo !== "inicio" && <ol className="guia">
        <li className="feito"><b>✓</b> <button className="link" onClick={() => setPasso("inicio")}>{passo === "cidade" ? "Caminho: já sei a cidade" : "Caminho: descobrir pelos critérios"}</button> (trocar)</li>
        {passo === "cidade" ? <li className={projeto.unidade_eleita_id ? "feito" : "agora"}><b>1</b> Escolher a cidade e ver o que ela significa</li> : <>
          <li className={passo === "criterios" ? "agora" : "feito"}><b>1</b> <button className="link" onClick={() => setPasso("criterios")}>Critérios</button></li>
          <li className={passo === "resultado" && !projeto.unidade_eleita_id ? "agora" : passo === "resultado" ? "feito" : ""}><b>2</b> Resultado: onde procurar</li></>}
        <li className={projeto.unidade_eleita_id ? "feito" : ""}><b>{passo === "cidade" ? 2 : 3}</b> Eleger a unidade</li>
        <li className={projeto.unidade_eleita_id ? "agora" : ""}><b>{passo === "cidade" ? 3 : 4}</b> {projeto.unidade_eleita_id ? <button className="primario" onClick={p.irParaEtapa2}>Seguir para a etapa 2 →</button> : "Etapa 2"}</li>
      </ol>}
      {passo === "cidade" && <Cidade base={base} projeto={projeto} edicoes={edicoes} linhas={linhas} sel={sel} setSel={setSel} editar={p.editar} eleger={eleger} irParaEtapa2={p.irParaEtapa2} />}
      {passo === "criterios" && <>
        <div className="cab-passo"><div><h1>Critérios</h1><p>Responda só o que importa para você: sim ou não, ou um número. O que ficar em branco não é considerado. O resultado mostra onde procurar.</p></div>
          <button className="primario grande" onClick={verResultado}>Ver resultado →</button></div>
        <Criterios {...p} />
        <div className="fim-passo"><button className="primario grande" onClick={verResultado}>Ver resultado →</button></div>
      </>}
      {passo === "resultado" && <main id="resultado">
        <div className="cab-passo"><div><h1>Resultado: onde procurar</h1>
          <p>Investimento no terreno: {base.faixas.find((f) => f.id === projeto.faixa_id)?.nome}{resp.lote_pronto?.v && ` · lote pronto: ${resp.lote_pronto.v === "sim" ? "sim" : "não"}`} · {defs.length} {defs.length === 1 ? "critério definido" : "critérios definidos"}</p></div>
          <button onClick={() => setPasso("criterios")}>← Ajustar critérios</button></div>
        {semCriterio && <p className="aviso">Nenhum critério que avalia a cidade foi definido, então todas aparecem sem nota. Volte em "Ajustar critérios" e responda ao menos um.</p>}
        {!semCriterio && <div className="chips">{defs.map((d) => <span key={d.id} className={resp[d.id]?.obrigatorio ? "chip obrig" : "chip"}>{d.pergunta.replace(/, no (máximo|mínimo)$/, "")}: <b>{descreve(d, resp[d.id])}</b> · peso {resp[d.id]?.peso ?? 1}{resp[d.id]?.obrigatorio && " · obrigatório"}</span>)}</div>}
        {!semCriterio && cobMedia < 0.5 && <p className="aviso">Em média, só {Math.round(cobMedia * 100)}% dos seus critérios têm dado nas cidades. Onde falta dado aparece "sem dado", e a cidade não é julgada por esse critério.</p>}
        <div className="barra">
          <div className="abas">
            {([["ranking", "Ranking"], ["mapa", "Mapa"], ["unidades", `Comparar unidades (${comparar.length}/4)`], ["projetos", "Comparar projetos"]] as const).map(([k, n]) =>
              <button key={k} className={aba === k ? "ativo" : ""} onClick={() => setAba(k)}>{n}</button>)}
          </div>
          <label className="escolher">Ver perfil de
            <select id="escolher-unidade" value={sel ?? ""} onChange={(e) => { setSel(e.target.value || null); if (aba === "unidades" || aba === "projetos") setAba("ranking"); }}>
              <option value="">escolha a cidade…</option>
              {[...base.unidades].sort((x, y) => x.nome.localeCompare(y.nome)).map((u) => <option key={u.unidade_id} value={u.unidade_id}>{u.nome}</option>)}
            </select></label>
          <span className="resumo">{vivas.length} unidades no ranking · {linhas.length - vivas.length} eliminadas</span>
          <div className="exportar">
            <button onClick={() => exportarXlsx(base, projeto, linhas, edicoes)}>Exportar .xlsx</button>
            <button onClick={() => exportarCsv(base, projeto, linhas, edicoes, "ranking")}>Ranking .csv</button>
            <button onClick={() => exportarCsv(base, projeto, linhas, edicoes, "dados")}>Dados .csv</button>
          </div>
        </div>
        {aba === "ranking" && <Tabela defs={defs} projeto={projeto} linhas={linhas} sel={sel} setSel={setSel} comparar={comparar} alternar={alternar} />}
        {aba === "mapa" && <Mapa geo={p.geo} linhas={linhas} sel={sel} setSel={setSel} eleita={projeto.unidade_eleita_id} />}
        {aba === "unidades" && <CompararUnidades base={base} projeto={projeto} edicoes={edicoes} linhas={linhas.filter((l) => comparar.includes(l.u.unidade_id))} remover={alternar} />}
        {aba === "projetos" && <CompararProjetos base={base} projetos={p.projetos} edicoes={edicoes} />}
        {linhaSel && aba !== "unidades" && aba !== "projetos" &&
          <Detalhe key={linhaSel.u.unidade_id} base={base} projeto={projeto} edicoes={edicoes} linha={linhaSel} editar={p.editar} fechar={() => setSel(null)} eleger={eleger} irParaEtapa2={p.irParaEtapa2}
            emComparacao={comparar.includes(linhaSel.u.unidade_id)} alternar={alternar} />}
      </main>}
    </div>
  );
}
