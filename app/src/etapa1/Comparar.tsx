import type { Base, Edicao, Projeto } from "../tipos";
import { chave, indicador, type Linha } from "../ranking";
import { avaliar, ativas, descreve, lotePronto, DEFS } from "../definicoes";
import { cor, fmt } from "../formato";

export function CompararUnidades({ base, projeto, edicoes, linhas, remover }: { base: Base; projeto: Projeto; edicoes: Record<string, Edicao>; linhas: Linha[]; remover: (id: string) => void }) {
  if (!linhas.length) return <p className="vazio">Marque até 4 unidades na coluna "Comp." do ranking para compará-las lado a lado.</p>;
  const situacao = (l: Linha, cid: string) => { const ns = DEFS.filter((d) => d.crit === cid).map((d) => l.porCriterio[d.id]?.nota).filter((n): n is number => n != null); return ns.length ? (ns.every((n) => n === 100) ? "sim" : "nao") : ""; };
  return (
    <div className="rolagem"><table className="simples comp">
      <thead><tr><th>Critério</th>{linhas.map((l) => <th key={l.u.unidade_id}>{l.u.nome}<button className="link" onClick={() => remover(l.u.unidade_id)}>remover</button></th>)}</tr></thead>
      <tbody>
        <tr className="principal"><td>Critérios atendidos (posição)</td>{linhas.map((l) => <td key={l.u.unidade_id}><span className="nota-final" style={{ background: cor(l.eliminada.length ? null : l.nota) }}>{l.avaliados ? `${l.atendidos} de ${l.avaliados}` : "–"}</span> {l.posicao ? `#${l.posicao}` : l.eliminada.length ? "eliminada" : ""}</td>)}</tr>
        
        {base.criterios.map((c) => (
          <tr key={c.id}><td title={c.fonte_planejada}>{c.id.slice(1)}. {c.nome}<small>{c.unidade_medida}</small></td>
            {linhas.map((l) => { const i = indicador(base, edicoes, l.u.unidade_id, chave(c, projeto.faixa_id)); const st = situacao(l, c.id); return (
              <td key={l.u.unidade_id} className={(i?.v == null ? "semdado " : "") + st}>{i?.v == null ? "sem dado" : fmt(i.v, i.um || c.unidade_medida)}{st && <small>{st === "sim" ? "✓ atende" : "✗ não atende"}</small>}</td>); })}
          </tr>))}
      </tbody></table></div>
  );
}

export function CompararProjetos({ base, projetos, edicoes }: { base: Base; projetos: Projeto[]; edicoes: Record<string, Edicao> }) {
  if (projetos.length < 2) return <p className="vazio">Há só um projeto. Use "Duplicar" ou "Novo" no topo para criar outro conjunto de faixa, pesos e filtros e comparar aqui.</p>;
  const res = projetos.map((p) => ({ p, linhas: avaliar(base, p, edicoes).filter((l) => l.posicao !== null), defs: ativas(p) }));
  return (
    <div className="rolagem"><table className="simples comp">
      <thead><tr><th></th>{res.map((r) => <th key={r.p.projeto_id}>{r.p.nome}</th>)}</tr></thead>
      <tbody>
        <tr><td>Faixa</td>{res.map((r) => <td key={r.p.projeto_id}>{base.faixas.find((f) => f.id === r.p.faixa_id)?.nome}</td>)}</tr>
        <tr><td>Lote pronto</td>{res.map((r) => <td key={r.p.projeto_id}>{lotePronto(r.p.respostas ?? {}) ? "sim" : "não"}</td>)}</tr>
        <tr><td>Critérios definidos</td>{res.map((r) => <td key={r.p.projeto_id}>{r.defs.map((d) => `${d.rotulo}: ${descreve(d, r.p.respostas![d.id])}${r.p.respostas![d.id].obrigatorio ? " (obrigatório)" : ""}`).join(" · ") || "nenhum"}</td>)}</tr>
        <tr><td>Unidades no ranking</td>{res.map((r) => <td key={r.p.projeto_id}>{r.linhas.length}</td>)}</tr>
        <tr><td>Unidade eleita</td>{res.map((r) => <td key={r.p.projeto_id}>{base.unidades.find((u) => u.unidade_id === r.p.unidade_eleita_id)?.nome ?? "—"}</td>)}</tr>
        {Array.from({ length: 15 }, (_, i) => <tr key={i}><td>{i + 1}º</td>{res.map((r) => { const l = r.linhas[i]; return <td key={r.p.projeto_id}>{l ? <><span className="nota-final p" style={{ background: cor(l.nota) }}>{l.atendidos}/{l.avaliados}</span> {l.u.nome}</> : ""}</td>; })}</tr>)}
      </tbody></table></div>
  );
}
