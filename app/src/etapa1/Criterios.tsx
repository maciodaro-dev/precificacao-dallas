import type { Props } from "./Etapa1";
import type { Resposta } from "../tipos";
import { DEFS, GRUPOS_DEF, visivel, lotePronto, type Definicao } from "../definicoes";
import { hoje } from "../estado";

// Cada critério é uma fileira de botões com subcritérios prontos, como a faixa de investimento. Escolhe-se um; clicar de novo desmarca.
export default function Criterios({ base, projeto, alterar }: Props) {
  const resp = projeto.respostas ?? {};
  const mudar = (id: string, m: Partial<Resposta>) => alterar({ respostas: { ...resp, [id]: { ...resp[id], ...m, data: hoje() } } });
  const escolher = (d: Definicao, i: number) => resp[d.id]?.ativo && resp[d.id]?.opcao === i
    ? mudar(d.id, { ativo: false, opcao: null, v: null, min: null, max: null })
    : mudar(d.id, { ativo: true, opcao: i, v: null, min: null, max: null, ...d.opcoes[i].r });
  const cenario = (d: Definicao) => d.tipo === "cenario_simnao" || d.tipo === "cenario_numero";
  const semDado = (d: Definicao) => !cenario(d) && d.tipo !== "so_cidade" && base.criterios.find((x) => x.id === d.crit)?.cobertura !== "coletado";
  const n = (t: string) => (t.trim() === "" ? null : Number(t.replace(",", ".")));
  const linha = (d: Definicao) => { const r = resp[d.id]; const on = !!r?.ativo; return (
    <div key={d.id} className={"subcrit" + (on ? " definido" : "")}>
      <h4 title={d.ajuda}>{d.rotulo}{cenario(d) && <span className="tag">muda os custos</span>}{semDado(d) && <i>sem dado ainda</i>}</h4>
      <div className="botoes">{d.opcoes.map((o, i) => <button key={i} id={`o-${d.id}-${i}`} className={on && r?.opcao === i ? "ativo" : ""} aria-pressed={on && r?.opcao === i} onClick={() => escolher(d, i)}>{o.rotulo}</button>)}</div>
      {d.ajuda && <p className="nota">{d.ajuda}</p>}
      {on && !cenario(d) && <div className="extras">
        <label className="peso-num" title="Quanto este critério conta na nota. 1 = normal, 2 = conta em dobro.">peso <input id={"p-" + d.id} type="number" min={0} max={10} step={1} value={r?.peso ?? 1} onChange={(e) => mudar(d.id, { peso: n(e.target.value) })} /></label>
        <label className="obrig" title="Se marcado, a cidade que não atende sai do resultado."><input type="checkbox" checked={!!r?.obrigatorio} onChange={(e) => mudar(d.id, { obrigatorio: e.target.checked })} /> obrigatório</label></div>}
    </div>); };
  return (
    <div className="form-criterios">
      {GRUPOS_DEF.map((g) => (
        <section className="bloco" key={g}><h3>{g}</h3>
          {g === "Terra" && <div className="subcrit definido"><h4>Faixa de investimento no terreno</h4>
            <div className="botoes">{base.faixas.map((x) => <button key={x.id} className={projeto.faixa_id === x.id ? "ativo" : ""} onClick={() => alterar({ faixa_id: x.id })}>{x.nome}</button>)}</div>
            <p className="nota">É o custo do terreno. Entra na pilha de custos (etapa 2) e define quais anúncios contam como oferta.</p></div>}
          {DEFS.filter((d) => d.grupo === g && visivel(d, resp)).map(linha)}
        </section>))}
      <div className="rodape-crit">
        {lotePronto(resp) && <p className="nota">Com lote pronto = Sim, os critérios de rede de água e esgoto, custo de lotear e limites da cidade não se aplicam e ficam ocultos. Com Não, o que falta no terreno entra como custo nas etapas 3 e 4.</p>}
        <p className="nota">Escolha uma opção em cada critério que importa; clicar de novo na opção desmarca. Critério sem opção marcada não é considerado. <b>Peso</b>: quanto o critério conta na nota (1 = normal). <b>Obrigatório</b>: a cidade que não atende sai do resultado.</p>
        <label className="linha"><input type="checkbox" checked={projeto.filtros.eliminar_sem_dado} onChange={(e) => alterar({ filtros: { ...projeto.filtros, eliminar_sem_dado: e.target.checked } })} /> Num critério obrigatório, eliminar também a cidade que não tem o dado</label>
      </div>
    </div>
  );
}
