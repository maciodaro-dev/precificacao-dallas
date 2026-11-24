import type { Base, Edicao, Projeto } from "../tipos";
import { chave, indicador, type Linha } from "../ranking";
import { avaliar, ativos, descreveAlvo, PARAMS, textoCobertura } from "../parametros";
import { cor, fmt } from "../formato";

export function CompararUnidades({ base, projeto, edicoes, linhas, remover }: { base: Base; projeto: Projeto; edicoes: Record<string, Edicao>; linhas: Linha[]; remover: (id: string) => void }) {
  if (!linhas.length) return <p className="vazio">Marque até 4 unidades na coluna "Comp." do ranking para compará-las lado a lado.</p>;
  const situacao = (l: Linha, cid: string) => { const ns = PARAMS.filter((d) => d.chave?.startsWith(cid + "|")).map((d) => l.porCriterio[d.id]?.nota).filter((n): n is number => n != null); return ns.length ? (ns.every((n) => n === 100) ? "sim" : "nao") : ""; };
  return (
    <div className="rolagem"><table className="simples comp">
      <thead><tr><th>Critério</th>{linhas.map((l) => <th key={l.u.unidade_id}>{l.u.nome}<button className="link" onClick={() => remover(l.u.unidade_id)}>remover</button></th>)}</tr></thead>
      <tbody>
        <tr className="principal"><td>Nota (posição)</td>{linhas.map((l) => <td key={l.u.unidade_id}><span className="nota-final" style={{ background: cor(l.nota) }}>{l.nota === null ? "–" : l.nota.toFixed(0)}</span> {l.posicao ? `#${l.posicao}` : ""}</td>)}</tr>
        <tr><td>Com dado<small>parâmetros em uso com dado, ponderado pelo peso</small></td>{linhas.map((l) => <td key={l.u.unidade_id} className={l.cobertura < 0.5 ? "baixa" : ""}>{textoCobertura(l)}</td>)}</tr>
        <tr><td>Não atende</td>{linhas.map((l) => <td key={l.u.unidade_id} className={l.falhas?.length ? "nao" : ""}>{l.falhas?.length ? l.falhas.map((f) => `${f.nome} (${f.valor}; alvo ${f.alvo})`).join("; ") : "nada, entre os parâmetros com dado"}</td>)}</tr>
        {base.criterios.map((c) => (
          <tr key={c.id}><td title={c.fonte_planejada}>{c.id.slice(1)}. {c.nome}<small>{c.unidade_medida}</small></td>
            {linhas.map((l) => { const i = indicador(base, edicoes, l.u.unidade_id, chave(c, projeto.faixa_id)); const st = situacao(l, c.id); return (
              <td key={l.u.unidade_id} className={(i?.v == null ? "semdado " : "") + st}>{i?.v == null ? "sem dado" : fmt(i.v, i.um || c.unidade_medida)}{i?.v != null && i.esc === "cidade" && <small>dado da cidade inteira</small>}{st && <small>{st === "sim" ? "✓ atende" : "✗ não atende por inteiro"}</small>}</td>); })}
          </tr>))}
      </tbody></table></div>
  );
}

export function CompararProjetos({ base, projetos, edicoes }: { base: Base; projetos: Projeto[]; edicoes: Record<string, Edicao> }) {
  if (projetos.length < 2) return <p className="vazio">Há só um projeto. Use "Duplicar" ou "Novo" no topo para criar outro conjunto de faixa, pesos e filtros e comparar aqui.</p>;
  const res = projetos.map((p) => ({ p, linhas: avaliar(base, p, edicoes).filter((l) => l.posicao !== null), defs: ativos(p) }));
  return (
    <div className="rolagem"><table className="simples comp">
      <thead><tr><th></th>{res.map((r) => <th key={r.p.projeto_id}>{r.p.nome}</th>)}</tr></thead>
      <tbody>
        <tr><td>Faixa</td>{res.map((r) => <td key={r.p.projeto_id}>{base.faixas.find((f) => f.id === r.p.faixa_id)?.nome ?? "não escolhida"}</td>)}</tr>
        <tr><td>Modo</td>{res.map((r) => <td key={r.p.projeto_id}>{r.p.modo === "leigo" ? "guiado" : r.p.modo === "expert" ? "especialista" : "—"}</td>)}</tr>
        <tr><td>Casas</td>{res.map((r) => <td key={r.p.projeto_id}>{r.p.n_casas ?? 1}{(r.p.n_casas ?? 1) > 1 ? (r.p.construcao === "sequencia" ? ", em sequência" : ", ao mesmo tempo") : ""}</td>)}</tr>
        <tr><td>Parâmetros em uso</td>{res.map((r) => <td key={r.p.projeto_id}>{r.defs.map((d) => `${d.nome}: ${descreveAlvo(d, r.p.parametros?.[d.id]?.alvo, r.p, base)}`).join(" · ") || "nenhum"}</td>)}</tr>
        
        <tr><td>Unidade eleita</td>{res.map((r) => <td key={r.p.projeto_id}>{base.unidades.find((u) => u.unidade_id === r.p.unidade_eleita_id)?.nome ?? "—"}</td>)}</tr>
        {Array.from({ length: 15 }, (_, i) => <tr key={i}><td>{i + 1}º</td>{res.map((r) => { const l = r.linhas[i]; return <td key={r.p.projeto_id}>{l ? <><span className="nota-final p" style={{ background: cor(l.nota) }}>{l.nota?.toFixed(0)}</span> {l.u.nome}<small>com dado {textoCobertura(l)}</small></> : ""}</td>; })}</tr>)}
      </tbody></table></div>
  );
}
