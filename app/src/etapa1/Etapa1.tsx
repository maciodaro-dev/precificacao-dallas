import { useMemo, useState } from "react";
import type { Base, Edicao, Projeto } from "../tipos";
import { avaliar, ativos, COBERTURA_MINIMA, descreveAlvo, pesoDe, PARAMS } from "../parametros";
import { deduzir, mesclar } from "../leigo";
import { exportarCsv, exportarXlsx } from "../exportar";
import Tabela from "./Tabela";
import Detalhe from "./Detalhe";
import Mapa from "./Mapa";
import Cidade from "./Cidade";
import Expert from "./Expert";
import { Perguntas, ResultadoLeigo } from "./Leigo";
import FontesUsadas from "../Fontes";
import AvisoCobertura from "./AvisoCobertura";
import { Exigencia, LinhaOcultas } from "./Exigencia";
import { cortar, NIVEL_PADRAO } from "../exigencia";
import { CompararUnidades, CompararProjetos } from "./Comparar";

export interface Props {
  base: Base; geo: GeoJSON.FeatureCollection; projeto: Projeto; projetos: Projeto[]; edicoes: Record<string, Edicao>;
  alterar: (m: Partial<Projeto>) => void; editar: (u: string, k: string, v: number | string | null | undefined) => void;
  /** endereço da tela: "onde-construir", "guiado-N", "guiado-resultado", "especialista", "especialista-resultado" ou "cidade" */
  rota: string; ir: (rota: string) => void; voltar: () => void;
}
export default function Etapa1(p: Props) {
  const { base, projeto, edicoes, rota, ir, voltar } = p;
  const nPergunta = /^guiado-(\d+)$/.exec(rota)?.[1];
  const passo = rota === "onde-construir" ? "inicio" : nPergunta ? "perguntas" : rota === "guiado-resultado" ? "leigo" : rota === "especialista" ? "expert" : rota === "especialista-resultado" ? "ranking" : rota === "cidade" ? "cidade" : "inicio";
  const [aba, setAba] = useState<"ranking" | "mapa" | "unidades" | "projetos">("ranking");
  const [sel, setSel] = useState<string | null>(projeto.caminho === "cidade" ? projeto.unidade_eleita_id : null);
  const [comparar, setComparar] = useState<string[]>([]); const [camada, setCamada] = useState("nota");
  const todas = useMemo(() => avaliar(base, projeto, edicoes), [base, projeto, edicoes]);
  // Recorte: só muda o que é exibido (mapa, ranking, 5 melhores). A nota e a posição geral não mudam.
  const [recorte, setRecorte] = useState("dfw");
  // Fatias pequenas de cidade × ISD ficam ocultas por padrão. É só exibição: continuam na base, com nota e posição.
  const [fatias, setFatias] = useState(false); const nFatias = useMemo(() => base.unidades.filter((u) => u.fatia_pequena).length, [base]);
  const visiveis = useMemo(() => (fatias ? todas : todas.filter((l) => !l.u.fatia_pequena || l.u.unidade_id === projeto.unidade_eleita_id)), [todas, fatias, projeto.unidade_eleita_id]);
  const linhas = useMemo(() => visiveis.filter((l) => recorte === "dfw" || (recorte.startsWith("c:") ? l.u.condado === recorte.slice(2) : l.u.lado === recorte)), [visiveis, recorte]);
  const condados = useMemo(() => [...new Set(base.unidades.map((u) => u.condado))].sort(), [base]);
  const seletor = <><label className="escolher">Mostrar <select id="recorte" value={recorte} onChange={(e) => setRecorte(e.target.value)}>
    <option value="dfw">DFW inteira</option><option value="dallas">Lado Dallas</option><option value="fort_worth">Lado Fort Worth</option>
    <optgroup label="Por condado">{condados.map((c) => <option key={c} value={"c:" + c}>{c}</option>)}</optgroup></select></label>
    {nFatias > 0 && <label className="escolher" title="Fatias pequenas: pedaços de uma cidade dentro de outro distrito escolar que representam uma parte pequena dela. Ficam ocultas por padrão; nada sai da base."><input id="fatias" type="checkbox" checked={fatias} onChange={(e) => setFatias(e.target.checked)} /> mostrar fatias pequenas ({nFatias})</label>}</>;
  const ps = ativos(projeto); const conflitos = projeto.leigo ? mesclar(deduzir(projeto.leigo), projeto.parametros).conflitos : [];
  const alternar = (id: string) => setComparar((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length < 4 ? [...c, id] : c));
  const eleger = (id: string) => p.alterar({ unidade_eleita_id: id, eleita_em: new Date().toISOString().slice(0, 10) });
  // lista principal × "dados insuficientes para comparar" (separação, não eliminação)
  const principais = useMemo(() => linhas.filter((l) => !l.poucosDados), [linhas]); const insuficientes = useMemo(() => linhas.filter((l) => l.poucosDados), [linhas]);
  // nível de exigência: só aparecem as regiões que atendem o percentual escolhido dos critérios com dado; a ordem continua pela nota
  const corte = useMemo(() => cortar(principais, projeto.exigencia ?? NIVEL_PADRAO), [principais, projeto.exigencia]);
  const [verOcultas, setVerOcultas] = useState(false); const [exportarOcultas, setExportarOcultas] = useState(false);
  const noMapa = useMemo(() => (verOcultas ? [...corte.visiveis, ...corte.ocultas] : corte.visiveis), [corte, verOcultas]);
  const paraExportar = exportarOcultas ? [...corte.visiveis, ...corte.ocultas] : corte.visiveis;
  const linhaSel = todas.find((l) => l.u.unidade_id === sel) ?? null;
  const irEtapa2 = () => ir("etapa-2");
  /** Abre o painel. Na primeira vez, preenche com os padrões; depois, mantém o que já estava definido. */
  const abrirExpert = () => {
    if (!projeto.parametros) p.alterar({ modo: "expert", caminho: null, parametros: Object.fromEntries(Object.entries(deduzir({})).map(([k, v]) => [k, { ...v, origem: v.origem === "sempre" ? "sempre" : "padrao" }])), n_casas: projeto.n_casas ?? 1, preco_venda: projeto.preco_venda ?? { min: 300000, max: 500000 } });
    else p.alterar({ modo: "expert", caminho: null });
    ir("especialista"); };
  const Voltar = () => <button className="voltar" onClick={voltar}>← Voltar</button>;

  return (
    <div className={"etapa1 " + passo}>
      {passo === "inicio" && <div className="inicio">
        <Voltar />
        <h1>Onde construir?</h1>
        <p>Nesta etapa você vai escolher a região onde procurar o terreno para construir. Escolha como quer responder. Os dois modos usam o mesmo cálculo e você pode passar de um para o outro quando quiser.</p>
        <div className="caminhos">
          <button id="modo-leigo" onClick={() => ir("guiado-1")}><b>Modo guiado</b><span>Você responde até 8 perguntas rápidas, uma por tela, em linguagem do dia a dia. A ferramenta cuida do resto e mostra as 5 melhores regiões para o seu projeto, explicando o porquê de cada uma.</span>
            <em>Indicado para quem está começando ou quer uma resposta rápida.</em><i>Começar pelas perguntas →</i></button>
          <button id="modo-expert" onClick={abrirExpert}><b>Modo especialista</b><span>Você define cada parâmetro e o peso de cada um. A ferramenta mostra o ranking de todas as regiões, com nota por parâmetro, valor, fonte e data de cada dado.</span>
            <em>Indicado para quem já conhece o mercado e quer controlar os detalhes.</em><i>Abrir o painel →</i></button>
        </div>
        <p className="nota">Já tem uma cidade em mente? <button id="link-cidade" className="link" onClick={() => { p.alterar({ caminho: "cidade" }); ir("cidade"); }}>Ver o que ela significa para o seu projeto</button></p>
      </div>}
      {passo === "perguntas" && <Perguntas base={base} projeto={projeto} alterar={p.alterar} indice={Number(nPergunta) - 1} ir={ir} voltar={voltar} />}
      {passo === "leigo" && <>
        <ResultadoLeigo seletor={seletor} total={todas.length} insuficientes={insuficientes.length} base={base} geo={p.geo} projeto={projeto} edicoes={edicoes} linhas={principais} alterar={p.alterar} conflitos={conflitos} eleger={eleger} irParaEtapa2={irEtapa2} voltar={voltar} abrirExpert={abrirExpert} detalhar={setSel} />
        {linhaSel && <Detalhe key={linhaSel.u.unidade_id} base={base} projeto={projeto} edicoes={edicoes} linha={linhaSel} editar={p.editar} fechar={() => setSel(null)} eleger={eleger} irParaEtapa2={irEtapa2} emComparacao={false} alternar={() => {}} />}
      </>}
      {passo === "cidade" && <><Voltar /><Cidade base={base} projeto={projeto} edicoes={edicoes} linhas={todas} sel={sel} setSel={setSel} editar={p.editar} eleger={eleger} irParaEtapa2={irEtapa2} /></>}
      {passo === "expert" && <Expert geo={p.geo} linhas={visiveis} base={base} projeto={projeto} alterar={p.alterar} verResultado={() => ir("especialista-resultado")} voltar={voltar} />}
      {passo === "ranking" && <main id="resultado">
        <Voltar />
        <div className="cab-passo"><div><h1>Resultado: ranking de todas as regiões</h1>
          <p>Investimento no terreno: {base.faixas.find((f) => f.id === projeto.faixa_id)?.nome ?? "faixa não escolhida"} · {projeto.n_casas ?? 1} {(projeto.n_casas ?? 1) === 1 ? "casa" : `casas, ${projeto.construcao === "sequencia" ? "em sequência" : "ao mesmo tempo"}`} · {ps.length} parâmetros em uso · nenhuma unidade é eliminada</p></div>
          {projeto.unidade_eleita_id && <button className="primario" onClick={irEtapa2}>Seguir para a etapa 2 →</button>}</div>
        <Exigencia projeto={projeto} alterar={p.alterar} corte={corte} />
        <div className="barra">
          <div className="abas">
            {([["ranking", "Ranking"], ["mapa", "Mapa"], ["unidades", `Comparar unidades (${comparar.length}/4)`], ["projetos", "Comparar projetos"]] as const).map(([k, n]) =>
              <button key={k} className={aba === k ? "ativo" : ""} onClick={() => setAba(k)}>{n}</button>)}
          </div>
          {aba === "mapa" && <label className="escolher">Camada <select id="camada" value={camada} onChange={(e) => setCamada(e.target.value)}><option value="nota">Nota final</option>{ps.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}</select></label>}
          {seletor}<span className="resumo">{corte.visiveis.length} regiões no ranking · {corte.ocultas.length} ocultas pelo nível de exigência · {insuficientes.length} com dados insuficientes</span>
          <div className="exportar">
            <button onClick={() => exportarXlsx(base, projeto, paraExportar, edicoes)}>Exportar .xlsx</button>
            <button onClick={() => exportarCsv(base, projeto, paraExportar, edicoes, "ranking")}>Ranking .csv</button>
            <button onClick={() => exportarCsv(base, projeto, paraExportar, edicoes, "dados")}>Dados .csv</button>
            {corte.ocultas.length > 0 && <label className="escolher"><input id="exportar-ocultas" type="checkbox" checked={exportarOcultas} onChange={(e) => setExportarOcultas(e.target.checked)} /> incluir as ocultas</label>}
          </div>
        </div>
        {aba === "ranking" && <Tabela params={[...ps].sort((x, y) => (todas[0]?.porCriterio[y.id]?.peso ? 1 : 0) - (todas[0]?.porCriterio[x.id]?.peso ? 1 : 0))} projeto={projeto} linhas={corte.visiveis} sel={sel} setSel={setSel} comparar={comparar} alternar={alternar} />}
        {aba === "ranking" && <LinhaOcultas corte={corte} mostrar={verOcultas} setMostrar={setVerOcultas} />}
        {aba === "ranking" && verOcultas && corte.ocultas.length > 0 && <Tabela params={[...ps].sort((x, y) => (todas[0]?.porCriterio[y.id]?.peso ? 1 : 0) - (todas[0]?.porCriterio[x.id]?.peso ? 1 : 0))} projeto={projeto} linhas={corte.ocultas} sel={sel} setSel={setSel} comparar={comparar} alternar={alternar} />}
        {aba === "ranking" && insuficientes.length > 0 && <details className="insuficientes" id="insuficientes"><summary>Dados insuficientes para comparar ({insuficientes.length} regiões)</summary>
          <p className="nota">Estas regiões têm dado em menos de {Math.round(COBERTURA_MINIMA * 100)}% do peso dos parâmetros que já têm dado em alguma região. Não foram eliminadas: ficam separadas porque a nota é parcial. Cada linha diz o que falta.</p>
          <Tabela params={[...ps].sort((x, y) => (todas[0]?.porCriterio[y.id]?.peso ? 1 : 0) - (todas[0]?.porCriterio[x.id]?.peso ? 1 : 0))} projeto={projeto} linhas={insuficientes} sel={sel} setSel={setSel} comparar={comparar} alternar={alternar} /></details>}
        {aba === "mapa" && <Mapa geo={p.geo} linhas={noMapa} sel={sel} setSel={setSel} eleita={projeto.unidade_eleita_id} camada={camada} nomeCamada={PARAMS.find((x) => x.id === camada)?.nome} />}
        {aba === "unidades" && <CompararUnidades base={base} projeto={projeto} edicoes={edicoes} linhas={todas.filter((l) => comparar.includes(l.u.unidade_id))} remover={alternar} />}
        {aba === "projetos" && <CompararProjetos base={base} projetos={p.projetos} edicoes={edicoes} />}
        <FontesUsadas base={base} edicoes={edicoes} unidades={base.unidades.map((u) => u.unidade_id)} chaves={ps.map((d) => d.chave).filter((k): k is string => !!k)} />
        <details className="criterios-usados" id="criterios-usados"><summary>Critérios usados neste ranking ({ps.length})</summary><div className="chips">{ps.map((d) => <span key={d.id} className="chip">{d.nome}: <b>{descreveAlvo(d, projeto.parametros?.[d.id]?.alvo, projeto, base)}</b> · peso {pesoDe(projeto, d.id) === "medio" ? "médio" : pesoDe(projeto, d.id)}{todas[0]?.porCriterio[d.id]?.peso === 0 && " · sem dado"}</span>)}</div></details>
        <AvisoCobertura base={base} projeto={projeto} edicoes={edicoes} />
        {linhaSel && aba !== "unidades" && aba !== "projetos" &&
          <Detalhe key={linhaSel.u.unidade_id} base={base} projeto={projeto} edicoes={edicoes} linha={linhaSel} editar={p.editar} fechar={() => setSel(null)} eleger={eleger} irParaEtapa2={irEtapa2}
            emComparacao={comparar.includes(linhaSel.u.unidade_id)} alternar={alternar} />}
      </main>}
    </div>
  );
}
