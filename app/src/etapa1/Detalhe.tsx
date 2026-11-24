import { useEffect, useRef, useState } from "react";
import type { Base, Criterio, Edicao, Projeto } from "../tipos";
import { chave, desatualizado, indicador, type Linha } from "../ranking";
import { CONF, cor, fmt } from "../formato";
import { PARAMS } from "../parametros";

interface P { base: Base; projeto: Projeto; edicoes: Record<string, Edicao>; linha: Linha; editar: (u: string, k: string, v: number | string | null | undefined) => void;
  fechar: () => void; eleger: (id: string) => void; irParaEtapa2: () => void; emComparacao: boolean; alternar: (id: string) => void; semRolagem?: boolean }

export default function Detalhe({ base, projeto, edicoes, linha, editar, fechar, eleger, irParaEtapa2, emComparacao, alternar, semRolagem }: P) {
  const u = linha.u; const [ed, setEd] = useState<string | null>(null); const [txt, setTxt] = useState("");
  const caixa = useRef<HTMLElement>(null);
  useEffect(() => { if (!semRolagem) caixa.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [semRolagem]);
  const salvar = (k: string) => { const t = txt.trim().replace(",", "."); editar(u.unidade_id, k, t === "" ? null : isNaN(Number(t)) ? txt.trim() : Number(t)); setEd(null); };
  const linhaDado = (c: Criterio | null, k: string, rotulo: string, principal: boolean) => {
    const i = indicador(base, edicoes, u.unidade_id, k); const ns = c && principal ? PARAMS.filter((d) => d.chave?.startsWith(c.id + "|") && linha.porCriterio[d.id]).map((d) => linha.porCriterio[d.id].nota) : [];
    const st = !ns.length ? "" : ns.every((x) => x === null) ? "semdado" : ns.some((x) => x !== null && x < 100) ? "nao" : "sim"; const nt = ns.find((x) => x !== null);
    const velho = i?.v != null && desatualizado(i.ref);
    return (
      <tr key={k} className={principal ? "principal" : "aux"}>
        <td>{rotulo}</td>
        <td className={i?.v == null ? "semdado" : ""}>
          {ed === k ? <span className="edicao"><input autoFocus value={txt} onChange={(e) => setTxt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") salvar(k); if (e.key === "Escape") setEd(null); }} />
            <button onClick={() => salvar(k)}>OK</button></span>
            : <button className="valor" title="Clique para editar" onClick={() => { setEd(k); setTxt(i?.v == null ? "" : String(i.v)); }}>{i?.v == null ? "sem dado" : fmt(i.v, i.um || c?.unidade_medida)}</button>}
          {i?.editado && <span className="selo ed" title={`valor original: ${i.original ?? "sem dado"}`}>editado {i.data_edicao} <button className="link" onClick={() => editar(u.unidade_id, k, undefined)}>desfazer</button></span>}
        </td>
        <td className={st}>{st === "sim" ? <span className="marca-ok">✓ nota 100</span> : st === "nao" ? <span className="marca-ok">✗ nota {nt}</span> : st === "semdado" ? "sem dado" : ""}</td>
        <td>{i?.v != null && (i.url ? <a href={i.url} target="_blank" rel="noreferrer">{i.f}</a> : i.f)}</td>
        <td>{i?.v != null && <>{i.ref}{velho && <span className="selo velho" title="Data de referência há mais de 6 meses">desatualizado</span>}</>}</td>
        <td><span className={"conf " + (i?.conf ?? "sem_dado")}>{CONF[i?.conf ?? "sem_dado"]}</span></td>
        <td className="obs">{i?.obs || (i?.v == null && c ? c.fonte_planejada : "")}</td>
      </tr>);
  };
  const grupos = [...new Set(base.criterios.map((c) => c.grupo))];
  const eleita = projeto.unidade_eleita_id === u.unidade_id;
  return (
    <section className="detalhe" ref={caixa}>
      <div className="cab">
        <div><h2>{u.nome}</h2><p>{u.tipo === "cidade_isd" ? "Cidade × ISD" : "Área não incorporada"} · {u.condados_pct} · {fmt(u.acres_terra)} acres de terra{u.pct_cidade != null && ` (${fmt(u.pct_cidade)}% da cidade)`} · ID {u.unidade_id}</p></div>
        <div className="acoes">
          <span className="nota-final g" style={{ background: cor(linha.nota) }}>{linha.nota === null ? "–" : linha.nota.toFixed(0)}</span>
          {!semRolagem && <button onClick={() => alternar(u.unidade_id)}>{emComparacao ? "Tirar da comparação" : "Comparar"}</button>}
          {u.tipo === "cidade_isd" && <a className="botao" target="_blank" rel="noreferrer" href={`https://www.homes.com/${u.cidade.toLowerCase().replace(/\./g, "").replace(/[^a-z0-9]+/g, "-")}-tx/land-for-sale/`}>Ver terrenos no Homes.com ↗</a>}
          {eleita ? <button className="primario" onClick={irParaEtapa2}>Ir para a etapa 2</button> : <button className="primario" onClick={() => eleger(u.unidade_id)}>Eleger unidade</button>}
          {!semRolagem && <button onClick={fechar}>Fechar</button>}
        </div>
      </div>
      <p className="nota">Para registrar o que você viu no Homes.com (preço da terra, tamanho típico, quantos anúncios na sua faixa, dias anunciado), clique em "sem dado" nos critérios 1, 2, 3 e 5 abaixo e digite o valor. Fica gravado com a data.</p>
      {u.tipo === "cidade_isd" && <p className="nota">Dados do Census, Zillow e permits valem para a cidade inteira, não para a fatia deste ISD. Nota do ISD e alagamento são específicos da unidade.</p>}
      <p className={linha.falhas?.length ? "naoatende" : "nota"}><b>Não atende:</b> {linha.falhas?.length ? linha.falhas.map((f) => `${f.nome} (${f.valor}; alvo ${f.alvo})`).join("; ") + "." : "nada, entre os parâmetros que têm dado."}</p>
      <div className="rolagem"><table className="simples det">
        <thead><tr><th>Critério</th><th>Valor bruto</th><th>Sua resposta</th><th>Fonte</th><th>Data de referência</th><th>Confiança</th><th>Observação</th></tr></thead>
        {grupos.map((g) => <tbody key={g}><tr className="grupo"><td colSpan={7}>{g}</td></tr>
          {base.criterios.filter((c) => c.grupo === g).flatMap((c) => [linhaDado(c, chave(c, projeto.faixa_id), `${c.id.slice(1)}. ${c.nome}`, true),
            ...(c.aux ?? []).filter((m) => base.indicadores[u.unidade_id]?.[`${c.id}|${m}`] || edicoes[`${u.unidade_id}|${c.id}|${m}`] || ["coberta_sb15", "moratoria_ativa", "mud_pid", "meses_estoque", "preco_venda_sqft", "preco_renda"].includes(m))
              .map((m) => linhaDado(c, `${c.id}|${m}`, "↳ " + m.replace(/_/g, " "), false))])}
        </tbody>)}
        <tbody><tr className="grupo"><td colSpan={7}>Contexto (não entra na nota)</td></tr>
          {["populacao", "crescimento_pop_2020_2025", "idade_casas"].map((m) => linhaDado(null, `ctx|${m}`, m.replace(/_/g, " "), false))}</tbody>
      </table></div>
    </section>
  );
}
