import { useState } from "react";
import type { Base, Criterio, Edicao, Projeto } from "../tipos";
import { chave, desatualizado, indicador, type Linha } from "../ranking";
import { CONF, cor, fmt } from "../formato";

interface P { base: Base; projeto: Projeto; edicoes: Record<string, Edicao>; linha: Linha; editar: (u: string, k: string, v: number | string | null | undefined) => void;
  fechar: () => void; eleger: (id: string) => void; irParaEtapa2: () => void; emComparacao: boolean; alternar: (id: string) => void }

export default function Detalhe({ base, projeto, edicoes, linha, editar, fechar, eleger, irParaEtapa2, emComparacao, alternar }: P) {
  const u = linha.u; const [ed, setEd] = useState<string | null>(null); const [txt, setTxt] = useState("");
  const salvar = (k: string) => { const t = txt.trim().replace(",", "."); editar(u.unidade_id, k, t === "" ? null : isNaN(Number(t)) ? txt.trim() : Number(t)); setEd(null); };
  const linhaDado = (c: Criterio | null, k: string, rotulo: string, principal: boolean) => {
    const i = indicador(base, edicoes, u.unidade_id, k); const n = c && principal ? linha.porCriterio[c.id] : undefined; const velho = i?.v != null && desatualizado(i.ref);
    return (
      <tr key={k} className={principal ? "principal" : "aux"}>
        <td>{rotulo}</td>
        <td className={i?.v == null ? "semdado" : ""}>
          {ed === k ? <span className="edicao"><input autoFocus value={txt} onChange={(e) => setTxt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") salvar(k); if (e.key === "Escape") setEd(null); }} />
            <button onClick={() => salvar(k)}>OK</button></span>
            : <button className="valor" title="Clique para editar" onClick={() => { setEd(k); setTxt(i?.v == null ? "" : String(i.v)); }}>{i?.v == null ? "sem dado" : fmt(i.v, i.um || c?.unidade_medida)}</button>}
          {i?.editado && <span className="selo ed" title={`valor original: ${i.original ?? "sem dado"}`}>editado {i.data_edicao} <button className="link" onClick={() => editar(u.unidade_id, k, undefined)}>desfazer</button></span>}
        </td>
        <td>{n?.nota != null ? <span className="nota-final p" style={{ background: cor(n.nota) }}>{n.nota.toFixed(0)}</span> : ""}</td>
        <td>{n ? Math.round(n.peso * 100) + "%" : ""}</td>
        <td>{i?.v != null && (i.url ? <a href={i.url} target="_blank" rel="noreferrer">{i.f}</a> : i.f)}</td>
        <td>{i?.v != null && <>{i.ref}{velho && <span className="selo velho" title="Data de referência há mais de 6 meses">desatualizado</span>}</>}</td>
        <td><span className={"conf " + (i?.conf ?? "sem_dado")}>{CONF[i?.conf ?? "sem_dado"]}</span></td>
        <td className="obs">{i?.obs || (i?.v == null && c ? c.fonte_planejada : "")}</td>
      </tr>);
  };
  const grupos = [...new Set(base.criterios.map((c) => c.grupo))];
  const eleita = projeto.unidade_eleita_id === u.unidade_id;
  return (
    <section className="detalhe">
      <div className="cab">
        <div><h2>{u.nome}</h2><p>{u.tipo === "cidade_isd" ? "Cidade × ISD" : "Área não incorporada"} · {u.condados_pct} · {fmt(u.acres_terra)} acres de terra{u.pct_cidade != null && ` (${fmt(u.pct_cidade)}% da cidade)`} · ID {u.unidade_id}</p></div>
        <div className="acoes">
          <span className="nota-final g" style={{ background: cor(linha.eliminada.length ? null : linha.nota) }}>{linha.nota === null ? "–" : linha.nota.toFixed(0)}</span>
          <button onClick={() => alternar(u.unidade_id)}>{emComparacao ? "Tirar da comparação" : "Comparar"}</button>
          {eleita ? <button className="primario" onClick={irParaEtapa2}>Ir para a etapa 2</button> : <button className="primario" onClick={() => eleger(u.unidade_id)}>Eleger unidade</button>}
          <button onClick={fechar}>Fechar</button>
        </div>
      </div>
      {u.tipo === "cidade_isd" && <p className="nota">Dados do Census, Zillow e permits valem para a cidade inteira, não para a fatia deste ISD. Nota do ISD e alagamento são específicos da unidade.</p>}
      <div className="rolagem"><table className="simples det">
        <thead><tr><th>Critério</th><th>Valor bruto</th><th>Nota</th><th>Peso</th><th>Fonte</th><th>Data de referência</th><th>Confiança</th><th>Observação</th></tr></thead>
        {grupos.map((g) => <tbody key={g}><tr className="grupo"><td colSpan={8}>{g}</td></tr>
          {base.criterios.filter((c) => c.grupo === g).flatMap((c) => [linhaDado(c, chave(c, projeto.faixa_id), `${c.id.slice(1)}. ${c.nome}`, true),
            ...(c.aux ?? []).filter((m) => base.indicadores[u.unidade_id]?.[`${c.id}|${m}`] || edicoes[`${u.unidade_id}|${c.id}|${m}`] || ["coberta_sb15", "moratoria_ativa", "mud_pid", "meses_estoque", "preco_venda_sqft", "preco_renda"].includes(m))
              .map((m) => linhaDado(c, `${c.id}|${m}`, "↳ " + m.replace(/_/g, " "), false))])}
        </tbody>)}
        <tbody><tr className="grupo"><td colSpan={8}>Contexto (não entra na nota)</td></tr>
          {["populacao", "crescimento_pop_2020_2025"].map((m) => linhaDado(null, `ctx|${m}`, m.replace(/_/g, " "), false))}</tbody>
      </table></div>
    </section>
  );
}
