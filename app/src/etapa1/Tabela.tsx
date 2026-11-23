import { useState } from "react";
import type { Base, Projeto } from "../tipos";
import { normalizar, type Linha } from "../ranking";
import { cor, fmt } from "../formato";

interface P { base: Base; projeto: Projeto; linhas: Linha[]; sel: string | null; setSel: (s: string | null) => void; comparar: string[]; alternar: (id: string) => void }
export default function Tabela({ base, projeto, linhas, sel, setSel, comparar, alternar }: P) {
  const [ord, setOrd] = useState<{ col: string; desc: boolean }>({ col: "pos", desc: false });
  const pesos = normalizar(projeto.pesos);
  const crits = base.criterios.filter((c) => pesos[c.id] > 0).sort((a, b) => pesos[b.id] - pesos[a.id]);
  const valor = (l: Linha, col: string): number | string | null =>
    col === "pos" ? (l.posicao ?? 9999) : col === "nome" ? l.u.nome : col === "condado" ? l.u.condado : col === "nota" ? l.nota : col === "cob" ? l.cobertura : (l.porCriterio[col]?.bruto ?? null);
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
          <th title="Marque até 4 unidades para comparar">Comp.</th><Th col="pos">#</Th><Th col="nome">Unidade</Th><Th col="condado">Condado</Th><Th col="nota">Nota</Th>
          <Th col="cob" title="Parte do peso que está em critérios com dado para esta unidade">Cobertura</Th>
          {crits.map((c) => <Th key={c.id} col={c.id} title={`${c.nome} · ${c.unidade_medida} · ${c.direcao === "menor" ? "menor é melhor" : c.direcao === "maior" ? "maior é melhor" : "configurável"}`}>{c.nome}<small>{Math.round(pesos[c.id] * 100)}%</small></Th>)}
        </tr></thead>
        <tbody>
          {ordenadas.map((l) => (
            <tr key={l.u.unidade_id} className={(sel === l.u.unidade_id ? "sel " : "") + (l.eliminada.length ? "elim " : "") + (projeto.unidade_eleita_id === l.u.unidade_id ? "eleita" : "")} onClick={() => setSel(sel === l.u.unidade_id ? null : l.u.unidade_id)}>
              <td onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={comparar.includes(l.u.unidade_id)} disabled={!comparar.includes(l.u.unidade_id) && comparar.length >= 4} onChange={() => alternar(l.u.unidade_id)} /></td>
              <td>{l.posicao ?? "–"}</td>
              <td className="nome">{l.u.nome}{projeto.unidade_eleita_id === l.u.unidade_id && <span className="selo">eleita</span>}{l.eliminada.length > 0 && <span className="motivo">eliminada: {l.eliminada.map((m) => m.filtro + (m.semDado ? " (sem dado)" : "")).join(", ")}</span>}</td>
              <td>{l.u.condado}</td>
              <td><span className="nota-final" style={{ background: cor(l.eliminada.length ? null : l.nota) }}>{l.nota === null ? "–" : l.nota.toFixed(0)}</span></td>
              <td className={l.cobertura < 0.5 ? "baixa" : ""}>{Math.round(l.cobertura * 100)}%</td>
              {crits.map((c) => { const x = l.porCriterio[c.id]; return <td key={c.id} className={x.bruto === null ? "semdado" : ""}>{x.bruto === null ? "sem dado" : <>{fmt(x.bruto, c.unidade_medida)}<small>{x.nota === null ? "" : x.nota.toFixed(0)}</small></>}</td>; })}
            </tr>))}
        </tbody>
      </table>
    </div>
  );
}
