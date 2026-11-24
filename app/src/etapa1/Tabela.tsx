import { useState } from "react";
import type { Projeto } from "../tipos";
import type { Linha } from "../ranking";
import type { Definicao } from "../definicoes";
import { cor, fmt } from "../formato";

interface P { defs: Definicao[]; projeto: Projeto; linhas: Linha[]; sel: string | null; setSel: (s: string | null) => void; comparar: string[]; alternar: (id: string) => void }
export default function Tabela({ defs, projeto, linhas, sel, setSel, comparar, alternar }: P) {
  const [ord, setOrd] = useState<{ col: string; desc: boolean }>({ col: "pos", desc: false });
  const valor = (l: Linha, col: string): number | string | null =>
    col === "pos" ? (l.posicao ?? 9999) : col === "nome" ? l.u.nome : col === "condado" ? l.u.condado : col === "nota" ? l.nota : col === "at" ? (l.atendidos ?? null) : col === "cob" ? (l.avaliados ?? null) : (l.porCriterio[col]?.bruto ?? null);
  const ordenadas = [...linhas].sort((a, b) => {
    const x = valor(a, ord.col), y = valor(b, ord.col);
    if (x === null && y === null) return 0; if (x === null) return 1; if (y === null) return -1;
    const r = typeof x === "string" ? x.localeCompare(String(y)) : x - (y as number);
    return ord.desc ? -r : r;
  });
  const Th = ({ col, children, title }: { col: string; children: React.ReactNode; title?: string }) =>
    <th title={title} onClick={() => setOrd((o) => ({ col, desc: o.col === col ? !o.desc : col !== "pos" && col !== "nome" && col !== "condado" }))} className={ord.col === col ? "ord" : ""}>{children}{ord.col === col ? (ord.desc ? " ▼" : " ▲") : ""}</th>;
  return (
    <div className="rolagem">
      <table className="ranking">
        <thead><tr>
          <th title="Marque até 4 unidades para comparar">Comp.</th><Th col="pos">#</Th><Th col="nome">Unidade</Th><Th col="condado">Condado</Th><Th col="nota" title="Percentual do peso dos seus critérios que a cidade atende, entre os que têm dado">Nota</Th>
          <Th col="at" title="Quantos dos seus critérios a cidade atende, entre os que têm dado">Atende</Th>
          <Th col="cob" title="Quantos dos seus critérios têm dado para esta cidade">Com dado</Th>
          {defs.map((d) => <Th key={d.id} col={d.id} title={d.pergunta}>{d.pergunta.replace(/, no (máximo|mínimo)$/, "")}<small>peso {projeto.respostas?.[d.id]?.peso ?? 1}</small></Th>)}
        </tr></thead>
        <tbody>
          {ordenadas.map((l) => (
            <tr key={l.u.unidade_id} className={(sel === l.u.unidade_id ? "sel " : "") + (l.eliminada.length ? "elim " : "") + (projeto.unidade_eleita_id === l.u.unidade_id ? "eleita" : "")} onClick={() => setSel(sel === l.u.unidade_id ? null : l.u.unidade_id)}>
              <td onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={comparar.includes(l.u.unidade_id)} disabled={!comparar.includes(l.u.unidade_id) && comparar.length >= 4} onChange={() => alternar(l.u.unidade_id)} /></td>
              <td>{l.posicao ?? "–"}</td>
              <td className="nome">{l.u.nome}{projeto.unidade_eleita_id === l.u.unidade_id && <span className="selo">eleita</span>}{l.eliminada.length > 0 && <span className="motivo">eliminada: {l.eliminada.map((m) => m.filtro + (m.semDado ? " (sem dado)" : "")).join(", ")}</span>}</td>
              <td>{l.u.condado}</td>
              <td><span className="nota-final" style={{ background: cor(l.eliminada.length ? null : l.nota) }}>{l.nota === null ? "–" : l.nota.toFixed(0)}</span></td>
              <td>{l.avaliados ? `${l.atendidos} de ${l.avaliados}` : "–"}</td>
              <td className={l.cobertura < 0.5 ? "baixa" : ""}>{defs.length ? `${l.avaliados ?? 0} de ${defs.length}` : "–"}</td>
              {defs.map((d) => { const x = l.porCriterio[d.id]; const sem = !x || x.nota === null; return (
                <td key={d.id} className={sem ? "semdado" : x.nota === 100 ? "sim" : "nao"}>{sem ? "sem dado" : <><span className="marca-ok">{x.nota === 100 ? "✓" : "✗"}</span> {x.texto ?? fmt(x.bruto, d.fator ? "dias" : d.um === "casas/ano" ? "" : d.um ?? "")}</>}</td>); })}
            </tr>))}
        </tbody>
      </table>
    </div>
  );
}
