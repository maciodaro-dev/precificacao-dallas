import type { Base, Edicao, Projeto } from "../tipos";
import { calcular, chave, indicador, normalizar, type Linha } from "../ranking";
import { cor, fmt } from "../formato";

export function CompararUnidades({ base, projeto, edicoes, linhas, remover }: { base: Base; projeto: Projeto; edicoes: Record<string, Edicao>; linhas: Linha[]; remover: (id: string) => void }) {
  if (!linhas.length) return <p className="vazio">Marque até 4 unidades na coluna "Comp." do ranking para compará-las lado a lado.</p>;
  const melhor = (c: (typeof base.criterios)[number]) => { const ns = linhas.map((l) => l.porCriterio[c.id]?.nota ?? null).filter((n): n is number => n !== null); return ns.length > 1 ? Math.max(...ns) : null; };
  return (
    <div className="rolagem"><table className="simples comp">
      <thead><tr><th>Critério</th>{linhas.map((l) => <th key={l.u.unidade_id}>{l.u.nome}<button className="link" onClick={() => remover(l.u.unidade_id)}>remover</button></th>)}</tr></thead>
      <tbody>
        <tr className="principal"><td>Nota final (posição)</td>{linhas.map((l) => <td key={l.u.unidade_id}><span className="nota-final" style={{ background: cor(l.eliminada.length ? null : l.nota) }}>{l.nota === null ? "–" : l.nota.toFixed(0)}</span> {l.posicao ? `#${l.posicao}` : l.eliminada.length ? "eliminada" : ""}</td>)}</tr>
        <tr><td>Cobertura</td>{linhas.map((l) => <td key={l.u.unidade_id}>{Math.round(l.cobertura * 100)}%</td>)}</tr>
        {base.criterios.map((c) => { const m = melhor(c); return (
          <tr key={c.id}><td title={c.fonte_planejada}>{c.id.slice(1)}. {c.nome}<small>{c.unidade_medida}</small></td>
            {linhas.map((l) => { const i = indicador(base, edicoes, l.u.unidade_id, chave(c, projeto.faixa_id)); const n = l.porCriterio[c.id]?.nota ?? null; return (
              <td key={l.u.unidade_id} className={(i?.v == null ? "semdado " : "") + (m !== null && n === m ? "melhor" : "")}>{i?.v == null ? "sem dado" : fmt(i.v, i.um || c.unidade_medida)}{n !== null && <small>nota {n.toFixed(0)}</small>}</td>); })}
          </tr>); })}
      </tbody></table></div>
  );
}

export function CompararProjetos({ base, projetos, edicoes }: { base: Base; projetos: Projeto[]; edicoes: Record<string, Edicao> }) {
  if (projetos.length < 2) return <p className="vazio">Há só um projeto. Use "Duplicar" ou "Novo" no topo para criar outro conjunto de faixa, pesos e filtros e comparar aqui.</p>;
  const res = projetos.map((p) => ({ p, linhas: calcular(base, p, edicoes).filter((l) => l.posicao !== null), pesos: normalizar(p.pesos) }));
  return (
    <div className="rolagem"><table className="simples comp">
      <thead><tr><th></th>{res.map((r) => <th key={r.p.projeto_id}>{r.p.nome}</th>)}</tr></thead>
      <tbody>
        <tr><td>Faixa</td>{res.map((r) => <td key={r.p.projeto_id}>{base.faixas.find((f) => f.id === r.p.faixa_id)?.nome}</td>)}</tr>
        <tr><td>Maiores pesos</td>{res.map((r) => <td key={r.p.projeto_id}>{Object.entries(r.pesos).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${base.criterios.find((c) => c.id === k)?.nome} ${Math.round(v * 100)}%`).join(" · ") || "sem pesos"}</td>)}</tr>
        <tr><td>Filtros</td>{res.map((r) => { const f = r.p.filtros; const t = [f.isd_min && `ISD ≥ ${f.isd_min}`, f.sem_moratoria && "sem moratória", f.com_esgoto && "com esgoto", f.sfha_max !== null && `alagamento ≤ ${f.sfha_max}%`, f.tipo !== "todas" && f.tipo, f.cobertura_min > 0 && `cobertura ≥ ${f.cobertura_min}%`].filter(Boolean); return <td key={r.p.projeto_id}>{t.join(" · ") || "nenhum"}</td>; })}</tr>
        <tr><td>Unidades no ranking</td>{res.map((r) => <td key={r.p.projeto_id}>{r.linhas.length}</td>)}</tr>
        <tr><td>Unidade eleita</td>{res.map((r) => <td key={r.p.projeto_id}>{base.unidades.find((u) => u.unidade_id === r.p.unidade_eleita_id)?.nome ?? "—"}</td>)}</tr>
        {Array.from({ length: 15 }, (_, i) => <tr key={i}><td>{i + 1}º</td>{res.map((r) => { const l = r.linhas[i]; return <td key={r.p.projeto_id}>{l ? <><span className="nota-final p" style={{ background: cor(l.nota) }}>{l.nota!.toFixed(0)}</span> {l.u.nome}</> : ""}</td>; })}</tr>)}
      </tbody></table></div>
  );
}
