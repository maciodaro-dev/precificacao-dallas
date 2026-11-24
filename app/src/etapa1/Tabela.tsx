import { useEffect, useState } from "react";
import type { Base, Edicao } from "../tipos";
import type { Linha } from "../ranking";
import { estiloNota } from "../formato";
import { aderencia, textoAderencia } from "../exigencia";
import { resumoLinha } from "./resumo";

interface P { base: Base; edicoes: Record<string, Edicao>; linhas: Linha[]; sel: string | null; setSel: (s: string | null) => void; comparar: string[]; alternar: (id: string) => void; eleita: string | null; id?: string }
/** Lista enxuta do resultado: região, atende, nota e cinco dados. O detalhe de cada critério (valor, nota, fonte, data, confiança), o que não atende e as observações de ISD ficam na ficha da região (clique na linha). */
export default function Tabela({ base, edicoes, linhas, sel, setSel, comparar, alternar, eleita, id }: P) {
  const [ord, setOrd] = useState<{ col: string; desc: boolean }>({ col: "pos", desc: false });
  const dados = linhas.map((l, i) => ({ l, pos: i + 1, r: resumoLinha(base, edicoes, l) }));
  const valor = (d: (typeof dados)[number], col: string): number | string | null =>
    col === "pos" ? d.pos : col === "nome" ? d.l.u.nome : col === "nota" ? d.l.nota : col === "atende" ? aderencia(d.l) : (d.r.find((c) => c.id === col)?.ordem ?? null);
  const ordenadas = [...dados].sort((a, b) => { const x = valor(a, ord.col), y = valor(b, ord.col);
    if (x === null && y === null) return 0; if (x === null) return 1; if (y === null) return -1;
    const r = typeof x === "string" ? x.localeCompare(String(y)) : x - (y as number); return ord.desc ? -r : r; });
  // numeração de 1 em diante só das regiões exibidas, na ordem em que aparecem
  const Th = ({ col, children, title }: { col: string; children: React.ReactNode; title?: string }) =>
    <th title={title} onClick={() => setOrd((o) => ({ col, desc: o.col === col ? !o.desc : col !== "pos" && col !== "nome" }))} className={ord.col === col ? "ord" : ""}>{children}{ord.col === col ? (ord.desc ? " ▼" : " ▲") : ""}</th>;
  // quando a região é escolhida no mapa, a lista rola até a linha
  useEffect(() => { if (sel) document.getElementById(`linha-${sel}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [sel]);
  const cab = dados[0]?.r ?? resumoLinha(base, edicoes, { u: { unidade_id: "" }, porCriterio: {} } as unknown as Linha);
  return (
    <div className="rolagem">
      <table className="ranking enxuta" id={id}>
        <thead><tr>
          <Th col="pos">#</Th><Th col="nome">Região</Th>
          <Th col="atende" title="Critérios atendidos ÷ critérios com dado para a região (contagem simples)">Atende</Th>
          <Th col="nota" title="Nota de 0 a 100, só com os critérios que têm dado na região">Nota</Th>
          {cab.map((c) => <Th key={c.id} col={c.id} title={c.rotulo}>{c.rotulo}</Th>)}
          <th title="Marque até 4 regiões para comparar" className="comp">Comparar</th>
        </tr></thead>
        <tbody>
          {ordenadas.map(({ l, r }, i) => (
            <tr key={l.u.unidade_id} id={`linha-${l.u.unidade_id}`} className={(sel === l.u.unidade_id ? "sel " : "") + (eleita === l.u.unidade_id ? "eleita" : "")} onClick={() => setSel(sel === l.u.unidade_id ? null : l.u.unidade_id)}>
              <td className="num">{i + 1}</td>
              <td className="nome">{l.u.nome}{eleita === l.u.unidade_id && <span className="selo">escolhida</span>}<small>{l.u.tipo === "cidade_isd" ? `Condado de ${l.u.condado}` : "fora dos limites de cidade"}</small></td>
              <td className="num">{l.atendidos} de {l.avaliados}</td>
              <td><span className="nota-final" style={estiloNota(l.nota)} title={textoAderencia(l)}>{l.nota === null ? "–" : l.nota.toFixed(0)}</span><small className="cob-nota">{l.avaliados} de {l.emUso} critérios</small></td>
              {r.map((c) => <td key={c.id} className={c.valor === null ? "semdado" : "num"} title={c.cidadeInteira ? "dado da cidade inteira" : undefined}>{c.valor ?? "sem dado"}{c.marca && <span className="marca-preco" title="Há preço anunciado, registrado manualmente, nesta região (veja a ficha)"> ●</span>}</td>)}
              <td className="comp" onClick={(e) => e.stopPropagation()}><input type="checkbox" aria-label={`comparar ${l.u.nome}`} checked={comparar.includes(l.u.unidade_id)} disabled={!comparar.includes(l.u.unidade_id) && comparar.length >= 4} onChange={() => alternar(l.u.unidade_id)} /></td>
            </tr>))}
          {!ordenadas.length && <tr><td colSpan={10} className="vazio">Nenhuma região para mostrar com este nível de exigência.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
