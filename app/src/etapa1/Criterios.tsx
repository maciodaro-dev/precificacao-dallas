import type { Props } from "./Etapa1";
import type { Resposta } from "../tipos";
import { DEFS, GRUPOS_DEF, visivel, lotePronto, aoLigar, soBotao, type Definicao } from "../definicoes";
import { hoje } from "../estado";

// Cada critério é um botão. Ligado, vale como critério. Os que pedem número abrem um campo para digitar.
export default function Criterios({ base, projeto, alterar }: Props) {
  const resp = projeto.respostas ?? {};
  const mudar = (id: string, m: Partial<Resposta>) => alterar({ respostas: { ...resp, [id]: { ...resp[id], ...m, data: hoje() } } });
  const alternar = (d: Definicao) => { const on = !resp[d.id]?.ativo; mudar(d.id, on ? { ativo: true, ...aoLigar(d) } : { ativo: false, ...(d.tipo === "cenario_simnao" ? { v: "nao" } : {}) }); };
  const n = (t: string) => (t.trim() === "" ? null : Number(t.replace(",", ".")));
  const cenario = (d: Definicao) => d.tipo === "cenario_simnao" || d.tipo === "cenario_numero";
  const semDado = (d: Definicao) => !cenario(d) && d.tipo !== "so_cidade" && base.criterios.find((x) => x.id === d.crit)?.cobertura !== "coletado";
  const campo = (d: Definicao) => {
    const r = resp[d.id] ?? {};
    if (d.tipo === "letra") return <select id={"r-" + d.id} value={(r.v as string) ?? ""} onChange={(e) => mudar(d.id, { v: e.target.value || null })}><option value="">escolha…</option>{["A", "B", "C", "D"].map((l) => <option key={l} value={l}>{l} ou melhor</option>)}</select>;
    if (d.tipo === "intervalo") return <span className="num">de <input id={"r-" + d.id + "-min"} type="number" min={0} step={d.passo ?? 1} value={r.min ?? ""} onChange={(e) => mudar(d.id, { min: n(e.target.value) })} /> a{" "}
      <input id={"r-" + d.id + "-max"} type="number" min={0} step={d.passo ?? 1} value={r.max ?? ""} onChange={(e) => mudar(d.id, { max: n(e.target.value) })} /> {d.um}</span>;
    return <span className="num">{d.tipo === "max" ? "até" : d.tipo === "min" ? "a partir de" : ""} <input id={"r-" + d.id} type="number" min={0} step={d.passo ?? 1} value={(r.v as number) ?? ""} onChange={(e) => mudar(d.id, { v: n(e.target.value) })} /> {d.um}</span>;
  };
  const grupo = (g: string) => {
    const ds = DEFS.filter((d) => d.grupo === g && visivel(d, resp)); const ligados = ds.filter((d) => resp[d.id]?.ativo);
    return (
      <section className="bloco" key={g}><h3>{g}</h3>
        {g === "Terra" && <div className="invest"><b>Quanto você vai investir no terreno</b>
          <div className="botoes">{base.faixas.map((x) => <button key={x.id} className={projeto.faixa_id === x.id ? "ativo" : ""} onClick={() => alterar({ faixa_id: x.id })}>{x.nome}</button>)}</div></div>}
        <div className="botoes">{ds.map((d) => <button key={d.id} id={"b-" + d.id} className={"crit-botao" + (resp[d.id]?.ativo ? " ativo" : "")} aria-pressed={!!resp[d.id]?.ativo} title={d.pergunta + (d.ajuda ? " — " + d.ajuda : "")} onClick={() => alternar(d)}>
          {resp[d.id]?.ativo ? "✓ " : ""}{d.rotulo}{semDado(d) && <small> sem dado</small>}</button>)}</div>
        {ligados.map((d) => (
          <div key={d.id} className="crit">
            <div className="perg"><b>{d.pergunta}</b>{d.ajuda && <p>{d.ajuda}</p>}{semDado(d) && <i>Ainda não há dado para este critério; ele passa a valer quando o dado entrar.</i>}</div>
            <div className="resp">{!soBotao(d) && campo(d)}
              {cenario(d) ? <span className="tag">muda os custos</span> : <>
                <label className="peso-num" title="Quanto este critério conta na nota. 1 = normal, 2 = conta em dobro.">peso
                  <input id={"p-" + d.id} type="number" min={0} max={10} step={1} value={resp[d.id]?.peso ?? 1} onChange={(e) => mudar(d.id, { peso: n(e.target.value) })} /></label>
                <label className="obrig" title="Se marcado, a cidade que não atende sai do resultado."><input type="checkbox" checked={!!resp[d.id]?.obrigatorio} onChange={(e) => mudar(d.id, { obrigatorio: e.target.checked })} /> obrigatório</label></>}
            </div>
          </div>))}
      </section>);
  };
  return (
    <div className="form-criterios">
      {GRUPOS_DEF.map(grupo)}
      <div className="rodape-crit">
        {lotePronto(resp) && <p className="nota">Com "Lote pronto" ligado, os critérios de rede de água e esgoto, custo de lotear e limites da cidade não se aplicam e ficam ocultos. Com ele desligado, o que falta no terreno entra como custo nas etapas 3 e 4.</p>}
        <p className="nota"><b>Peso</b>: quanto o critério conta na nota (1 = normal). <b>Obrigatório</b>: a cidade que não atende sai do resultado. Passe o mouse sobre um botão para ver a explicação.</p>
        <label className="linha"><input type="checkbox" checked={projeto.filtros.eliminar_sem_dado} onChange={(e) => alterar({ filtros: { ...projeto.filtros, eliminar_sem_dado: e.target.checked } })} /> Num critério obrigatório, eliminar também a cidade que não tem o dado</label>
      </div>
    </div>
  );
}
