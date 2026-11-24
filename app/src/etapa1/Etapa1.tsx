import { useMemo, useState } from "react";
import type { Base, Edicao, Projeto, RespostasLeigo } from "../tipos";
import { avaliar, ativos, descreveAlvo, pesoDe, PARAMS } from "../parametros";
import { deduzir, mesclar, projetoDoLeigo } from "../leigo";
import { exportarCsv, exportarXlsx } from "../exportar";
import Tabela from "./Tabela";
import Detalhe from "./Detalhe";
import Mapa from "./Mapa";
import Cidade from "./Cidade";
import Expert from "./Expert";
import { Perguntas, ResultadoLeigo } from "./Leigo";
import FontesUsadas from "../Fontes";
import { CompararUnidades, CompararProjetos } from "./Comparar";

export interface Props {
  base: Base; geo: GeoJSON.FeatureCollection; projeto: Projeto; projetos: Projeto[]; edicoes: Record<string, Edicao>;
  alterar: (m: Partial<Projeto>) => void; editar: (u: string, k: string, v: number | string | null | undefined) => void; irParaEtapa2: () => void;
}
type Passo = "inicio" | "perguntas" | "leigo" | "expert" | "ranking" | "cidade";
export default function Etapa1(p: Props) {
  const { base, projeto, edicoes } = p;
  const [passo, setPassoLocal] = useState<Passo>(projeto.modo === "leigo" && projeto.leigo ? "leigo" : projeto.modo === "expert" ? (projeto.unidade_eleita_id ? "ranking" : "expert") : projeto.caminho === "cidade" ? "cidade" : "inicio");
  const setPasso = (x: Passo) => { setPassoLocal(x); window.scrollTo(0, 0); };
  const [aba, setAba] = useState<"ranking" | "mapa" | "unidades" | "projetos">("ranking");
  const [sel, setSel] = useState<string | null>(projeto.caminho === "cidade" ? projeto.unidade_eleita_id : null);
  const [comparar, setComparar] = useState<string[]>([]); const [camada, setCamada] = useState("nota");
  const linhas = useMemo(() => avaliar(base, projeto, edicoes), [base, projeto, edicoes]);
  const ps = ativos(projeto); const conflitos = projeto.leigo ? mesclar(deduzir(projeto.leigo), projeto.parametros).conflitos : [];
  const alternar = (id: string) => setComparar((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length < 4 ? [...c, id] : c));
  const eleger = (id: string) => p.alterar({ unidade_eleita_id: id, eleita_em: new Date().toISOString().slice(0, 10) });
  const linhaSel = linhas.find((l) => l.u.unidade_id === sel) ?? null;
  const concluirPerguntas = (r: RespostasLeigo, faixa: string) => { p.alterar({ modo: "leigo", caminho: null, faixa_id: faixa, ...projetoDoLeigo(r, projeto) }); setPasso("leigo"); };
  const abrirExpert = () => { if (!projeto.parametros) p.alterar({ modo: "expert", caminho: null, parametros: Object.fromEntries(Object.entries(deduzir({})).map(([k, v]) => [k, { ...v, origem: v.origem === "sempre" ? "sempre" : "padrao" }])), n_casas: projeto.n_casas ?? 1, preco_venda: projeto.preco_venda ?? { min: 300000, max: 500000 } }); else p.alterar({ modo: "expert", caminho: null }); setPasso("expert"); };

  return (
    <div className={"etapa1 " + passo}>
      {passo === "inicio" && <div className="inicio">
        <h1>Onde construir?</h1>
        <p>Escolha como quer responder. Os dois modos usam o mesmo cálculo e você pode passar de um para o outro quando quiser.</p>
        <div className="caminhos">
          <button id="modo-leigo" onClick={() => setPasso("perguntas")}><b>Modo simples</b><span>Até 8 perguntas em linguagem comum, uma por tela. A ferramenta deduz o resto e mostra as 5 melhores regiões, com o porquê de cada uma.</span><i>Responder as perguntas →</i></button>
          <button id="modo-expert" onClick={abrirExpert}><b>Modo completo</b><span>Painel com todos os parâmetros e pesos. Mostra o ranking inteiro, com nota por parâmetro, valor, fonte, data e confiança.</span><i>Abrir o painel →</i></button>
        </div>
        <p className="nota">Já tem uma cidade em mente? <button className="link" onClick={() => { p.alterar({ caminho: "cidade" }); setPasso("cidade"); }}>Ver o que ela significa para o projeto</button></p>
      </div>}
      {passo !== "inicio" && passo !== "perguntas" && <ol className="guia">
        <li className="feito"><b>✓</b> <button className="link" onClick={() => setPasso("inicio")}>{passo === "cidade" ? "Cidade escolhida por você" : passo === "leigo" ? "Modo simples" : "Modo completo"}</button> (trocar)</li>
        {passo === "expert" && <li className="agora"><b>1</b> Parâmetros</li>}
        {passo === "ranking" && <><li className="feito"><b>1</b> <button className="link" onClick={() => setPasso("expert")}>Parâmetros</button></li><li className={projeto.unidade_eleita_id ? "feito" : "agora"}><b>2</b> Resultado</li></>}
        <li className={projeto.unidade_eleita_id ? "agora" : ""}><b>{passo === "expert" || passo === "ranking" ? 3 : 2}</b> {projeto.unidade_eleita_id ? <button className="primario" onClick={p.irParaEtapa2}>Seguir para a etapa 2 →</button> : "Escolher a unidade e seguir para a etapa 2"}</li>
      </ol>}
      {passo === "perguntas" && <Perguntas projeto={projeto} concluir={concluirPerguntas} cancelar={() => setPasso(projeto.leigo ? "leigo" : "inicio")} />}
      {passo === "leigo" && <>
        <ResultadoLeigo base={base} geo={p.geo} projeto={projeto} edicoes={edicoes} linhas={linhas} conflitos={conflitos} eleger={eleger} irParaEtapa2={p.irParaEtapa2} refazer={() => setPasso("perguntas")} abrirExpert={abrirExpert} detalhar={setSel} />
        {linhaSel && <Detalhe key={linhaSel.u.unidade_id} base={base} projeto={projeto} edicoes={edicoes} linha={linhaSel} editar={p.editar} fechar={() => setSel(null)} eleger={eleger} irParaEtapa2={p.irParaEtapa2} emComparacao={false} alternar={() => {}} />}
      </>}
      {passo === "cidade" && <Cidade base={base} projeto={projeto} edicoes={edicoes} linhas={linhas} sel={sel} setSel={setSel} editar={p.editar} eleger={eleger} irParaEtapa2={p.irParaEtapa2} />}
      {passo === "expert" && <Expert base={base} projeto={projeto} alterar={p.alterar} verResultado={() => setPasso("ranking")} voltarLeigo={() => setPasso("perguntas")} />}
      {passo === "ranking" && <main id="resultado">
        <div className="cab-passo"><div><h1>Resultado: ranking completo</h1>
          <p>Investimento no terreno: {base.faixas.find((f) => f.id === projeto.faixa_id)?.nome} · {projeto.n_casas ?? 1} {(projeto.n_casas ?? 1) === 1 ? "casa" : `casas, ${projeto.construcao === "sequencia" ? "em sequência" : "ao mesmo tempo"}`} · {ps.length} parâmetros em uso · nenhuma unidade é eliminada</p></div>
          <button onClick={() => setPasso("expert")}>← Ajustar parâmetros</button></div>
        <div className="chips">{ps.map((d) => <span key={d.id} className="chip">{d.nome}: <b>{descreveAlvo(d, projeto.parametros?.[d.id]?.alvo, projeto, base)}</b> · peso {pesoDe(projeto, d.id) === "medio" ? "médio" : pesoDe(projeto, d.id)}{linhas[0]?.porCriterio[d.id]?.peso === 0 && " · sem dado"}</span>)}</div>
        <div className="barra">
          <div className="abas">
            {([["ranking", "Ranking"], ["mapa", "Mapa"], ["unidades", `Comparar unidades (${comparar.length}/4)`], ["projetos", "Comparar projetos"]] as const).map(([k, n]) =>
              <button key={k} className={aba === k ? "ativo" : ""} onClick={() => setAba(k)}>{n}</button>)}
          </div>
          {aba === "mapa" && <label className="escolher">Camada <select id="camada" value={camada} onChange={(e) => setCamada(e.target.value)}><option value="nota">Nota final</option>{ps.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}</select></label>}
          <span className="resumo">{linhas.length} unidades</span>
          <div className="exportar">
            <button onClick={() => exportarXlsx(base, projeto, linhas, edicoes)}>Exportar .xlsx</button>
            <button onClick={() => exportarCsv(base, projeto, linhas, edicoes, "ranking")}>Ranking .csv</button>
            <button onClick={() => exportarCsv(base, projeto, linhas, edicoes, "dados")}>Dados .csv</button>
          </div>
        </div>
        {aba === "ranking" && <Tabela params={[...ps].sort((x, y) => (linhas[0]?.porCriterio[y.id]?.peso ? 1 : 0) - (linhas[0]?.porCriterio[x.id]?.peso ? 1 : 0))} projeto={projeto} linhas={linhas} sel={sel} setSel={setSel} comparar={comparar} alternar={alternar} />}
        {aba === "mapa" && <Mapa geo={p.geo} linhas={linhas} sel={sel} setSel={setSel} eleita={projeto.unidade_eleita_id} camada={camada} nomeCamada={PARAMS.find((x) => x.id === camada)?.nome} />}
        {aba === "unidades" && <CompararUnidades base={base} projeto={projeto} edicoes={edicoes} linhas={linhas.filter((l) => comparar.includes(l.u.unidade_id))} remover={alternar} />}
        {aba === "projetos" && <CompararProjetos base={base} projetos={p.projetos} edicoes={edicoes} />}
        <FontesUsadas base={base} edicoes={edicoes} unidades={base.unidades.map((u) => u.unidade_id)} chaves={ps.map((d) => d.chave).filter((k): k is string => !!k)} />
        {linhaSel && aba !== "unidades" && aba !== "projetos" &&
          <Detalhe key={linhaSel.u.unidade_id} base={base} projeto={projeto} edicoes={edicoes} linha={linhaSel} editar={p.editar} fechar={() => setSel(null)} eleger={eleger} irParaEtapa2={p.irParaEtapa2}
            emComparacao={comparar.includes(linhaSel.u.unidade_id)} alternar={alternar} />}
      </main>}
    </div>
  );
}
