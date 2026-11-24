import { useState } from "react";
import type { Projeto } from "../tipos";
import type { Linha } from "../ranking";
import { pesoDe, type Param } from "../parametros";
import { cor, fmt, estiloNota } from "../formato";

interface P { params: Param[]; projeto: Projeto; linhas: Linha[]; sel: string | null; setSel: (s: string | null) => void; comparar: string[]; alternar: (id: string) => void }
/** Ranking completo: todas as unidades, nota final e nota por parâmetro com o valor bruto. Fonte, data e confiança aparecem ao passar o mouse em cada valor e no detalhe (clique na linha). */
export default function Tabela({ params, projeto, linhas, sel, setSel, comparar, alternar }: P) {
  const [ord, setOrd] = useState<{ col: string; desc: boolean }>({ col: "pos", desc: false });
  const valor = (l: Linha, col: string): number | string | null =>
    col === "pos" ? (l.posicao ?? 9999) : col === "nome" ? l.u.nome : col === "condado" ? l.u.condado : col === "nota" ? l.nota : col === "cob" ? l.cobertura : (l.porCriterio[col]?.nota ?? null);
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
          <th title="Marque até 4 unidades para comparar">Comp.</th><Th col="pos">#</Th><Th col="nome">Unidade</Th><Th col="condado">Condado</Th>
          <Th col="nota" title="Nota de 0 a 100. Parâmetro sem dado na região não pontua: sai da conta só dela. Leia sempre junto com a coluna Com dado.">Nota</Th>
          <Th col="cob" title="Parâmetros em uso com dado nesta unidade ÷ todos os parâmetros em uso, ponderado pelo peso. Entre parênteses, a contagem simples.">Com dado</Th>
          {params.map((d) => <Th key={d.id} col={d.id} title={d.nome}>{d.nome}<small>peso {pesoDe(projeto, d.id) === "medio" ? "médio" : pesoDe(projeto, d.id)}</small></Th>)}
        </tr></thead>
        <tbody>
          {ordenadas.map((l) => (
            <tr key={l.u.unidade_id} className={(sel === l.u.unidade_id ? "sel " : "") + (projeto.unidade_eleita_id === l.u.unidade_id ? "eleita" : "")} onClick={() => setSel(sel === l.u.unidade_id ? null : l.u.unidade_id)}>
              <td onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={comparar.includes(l.u.unidade_id)} disabled={!comparar.includes(l.u.unidade_id) && comparar.length >= 4} onChange={() => alternar(l.u.unidade_id)} /></td>
              <td>{l.posicao ?? "–"}</td>
              <td className="nome">{l.u.nome}{projeto.unidade_eleita_id === l.u.unidade_id && <span className="selo">eleita</span>}
                {l.poucosDados && <span className="motivo">Nota parcial. Falta dado de: {(l.faltam ?? []).join("; ")}</span>}
                {l.recorte && <span className="recorte">{l.recorte.texto}</span>}
                {!!l.falhas?.length && <span className="motivo">Não atende: {l.falhas.map((f) => f.nome).join("; ")}</span>}</td>
              <td>{l.u.condado}</td>
              <td><span className="nota-final" style={estiloNota(l.nota)}>{l.nota === null ? "–" : l.nota.toFixed(0)}</span></td>
              <td className={l.cobertura < 0.5 ? "baixa" : ""}>{l.avaliados} de {l.emUso}<small>{Math.round(l.cobertura * 100)}% do peso</small></td>
              {params.map((d) => { const x = l.porCriterio[d.id]; const sem = !x || x.nota === null; return (
                <td key={d.id} className={sem ? "semdado" : x.nota === 100 ? "sim" : x.nota === 0 ? "nao" : "parte"} title={sem ? "sem dado para esta unidade" : `Fonte: ${x.fonte ?? "regra da ferramenta"}${x.ref ? ` · data: ${x.ref}` : ""}${x.conf ? ` · confiança: ${x.conf === "media" ? "média" : x.conf}` : ""}${x.esc === "cidade" ? " · dado da cidade inteira, não desta fatia" : ""}`}>{sem ? "sem dado" : <>{x.texto ?? fmt(x.bruto === null ? null : x.bruto / (d.fator ?? 1), d.um === "casas/ano" ? "" : d.um)}<small>nota {x.nota}{x.esc === "cidade" && " · cidade inteira"}</small></>}</td>); })}
            </tr>))}
        </tbody>
      </table>
    </div>
  );
}
