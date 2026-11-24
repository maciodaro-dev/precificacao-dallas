import type { Props } from "./Etapa1";
import type { Resposta } from "../tipos";
import { DEFS, GRUPOS_DEF, visivel, type Definicao } from "../definicoes";
import { hoje } from "../estado";

const SITUACAO: Record<string, string> = { coletado: "", adiado: "dado virá do Homes.com (preenchimento manual)", manual: "sem dado ainda", bloqueado: "sem dado ainda", pendente: "sem dado ainda", premissa: "", derivado: "sem dado ainda" };

export default function Criterios({ base, projeto, alterar }: Props) {
  const resp = projeto.respostas ?? {};
  const mudar = (id: string, m: Partial<Resposta>) => alterar({ respostas: { ...resp, [id]: { ...resp[id], ...m, data: hoje() } } });
  const n = (t: string) => (t.trim() === "" ? null : Number(t.replace(",", ".")));
  const SimNao = ({ d }: { d: Definicao }) => (
    <span className="simnao">{(["sim", "nao"] as const).map((o) =>
      <button key={o} className={resp[d.id]?.v === o ? "ativo" : ""} onClick={() => mudar(d.id, { v: resp[d.id]?.v === o ? null : o })}>{o === "sim" ? "Sim" : "Não"}</button>)}</span>);
  const campo = (d: Definicao) => {
    const r = resp[d.id] ?? {};
    if (d.tipo === "cenario_simnao" || d.tipo === "exige" || d.tipo === "nao_aceita" || d.tipo === "so_cidade") return <SimNao d={d} />;
    if (d.tipo === "letra") return <select id={"r-" + d.id} value={(r.v as string) ?? ""} onChange={(e) => mudar(d.id, { v: e.target.value || null })}><option value="">não definir</option>{["A", "B", "C", "D"].map((l) => <option key={l}>{l}</option>)}</select>;
    if (d.tipo === "intervalo") return <span className="num">de <input id={"r-" + d.id + "-min"} type="number" min={0} step={d.passo ?? 1} value={r.min ?? ""} onChange={(e) => mudar(d.id, { min: n(e.target.value) })} /> a{" "}
      <input id={"r-" + d.id + "-max"} type="number" min={0} step={d.passo ?? 1} value={r.max ?? ""} onChange={(e) => mudar(d.id, { max: n(e.target.value) })} /> {d.um}</span>;
    return <span className="num"><input id={"r-" + d.id} type="number" min={0} step={d.passo ?? 1} value={(r.v as number) ?? ""} onChange={(e) => mudar(d.id, { v: n(e.target.value) })} /> {d.um}</span>;
  };
  const cenario = (d: Definicao) => d.tipo === "cenario_simnao" || d.tipo === "cenario_numero";
  const respondido = (d: Definicao) => { const r = resp[d.id]; return !!r && (d.tipo === "intervalo" ? r.min != null || r.max != null : r.v != null && r.v !== ""); };
  return (
    <div className="form-criterios">
      <section className="bloco">
        <h3>Terra</h3>
        <div className="crit definido">
          <div className="perg"><b>1. Quanto você vai investir no terreno</b><p>É o custo do terreno. Entra na pilha de custos (etapa 2) e define quais anúncios contam como oferta.</p></div>
          <div className="faixas">{base.faixas.map((x) => <button key={x.id} className={projeto.faixa_id === x.id ? "ativo" : ""} onClick={() => alterar({ faixa_id: x.id })}>{x.nome}</button>)}</div>
        </div>
        {DEFS.filter((d) => d.grupo === "Terra").map((d) => linha(d))}
        <p className="nota"><b>Peso</b>: quanto o critério conta na nota da cidade. Todos começam em 1; ponha 2 ou 3 no que importa mais e 0 no que não deve contar. <b>Obrigatório</b>: a cidade que não atende sai do resultado.</p>
        <p className="nota">A quantidade de terrenos anunciados no seu perfil (faixa e tamanho) não é critério: aparece no resultado de cada cidade.</p>
      </section>
      {GRUPOS_DEF.filter((g) => g !== "Terra").map((g) => { const ds = DEFS.filter((d) => d.grupo === g && visivel(d, resp)); return ds.length === 0 ? null : (
        <section className="bloco" key={g}><h3>{g}</h3>{ds.map((d) => linha(d))}</section>); })}
      {resp.lote_pronto?.v === "sim" && <p className="nota">Como você quer lote pronto, os critérios de rede de água e esgoto, custo de lotear e terreno fora da cidade não se aplicam e foram ocultados.</p>}
      <label className="linha"><input type="checkbox" checked={projeto.filtros.eliminar_sem_dado} onChange={(e) => alterar({ filtros: { ...projeto.filtros, eliminar_sem_dado: e.target.checked } })} /> Num critério obrigatório, eliminar também a cidade que não tem o dado</label>
    </div>
  );
  function linha(d: Definicao) {
    const c = base.criterios.find((x) => x.id === d.crit); const sit = cenario(d) || d.tipo === "so_cidade" ? "" : SITUACAO[c?.cobertura ?? ""] ?? "";
    return (
      <div key={d.id} className={"crit" + (respondido(d) ? " definido" : "")}>
        <div className="perg"><b>{d.pergunta}</b>{d.ajuda && <p>{d.ajuda}</p>}{sit && <i>{sit}</i>}</div>
        <div className="resp">{campo(d)}
          {!cenario(d) && <label className="peso-num" title="Quanto este critério conta na nota. 1 = normal, 2 = conta em dobro, 0 = não conta.">peso
            <input id={"p-" + d.id} type="number" min={0} max={10} step={1} disabled={!respondido(d)} value={resp[d.id]?.peso ?? 1} onChange={(e) => mudar(d.id, { peso: n(e.target.value) })} /></label>}
          {!cenario(d) && <label className="obrig" title="Se marcado, a cidade que não atende sai do resultado. Se não, ela continua aparecendo com a marcação de que não atende.">
            <input type="checkbox" checked={!!resp[d.id]?.obrigatorio} disabled={!respondido(d)} onChange={(e) => mudar(d.id, { obrigatorio: e.target.checked })} /> obrigatório</label>}
          {cenario(d) && <span className="tag">muda os custos</span>}
        </div>
      </div>);
  }
}
