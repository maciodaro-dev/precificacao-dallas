import { QuadroRegiao } from "../DadosRegiao";
import { useEffect, useRef, useState } from "react";
import type { Base, Criterio, Edicao, Projeto } from "../tipos";
import { chave, desatualizado, indicador, type Linha } from "../ranking";
import { CONF, cor, fmt, estiloNota } from "../formato";
import { PARAMS, textoCobertura } from "../parametros";
import { CHAVE_PRECO_ANUNCIADO } from "./resumo";

interface P { base: Base; projeto: Projeto; edicoes: Record<string, Edicao>; linha: Linha; editar: (u: string, k: string, v: number | string | null | undefined) => void;
  fechar: () => void; eleger: (id: string) => void; irParaEtapa2: () => void; emComparacao: boolean; alternar: (id: string) => void; semRolagem?: boolean }

/** Preço anunciado (Homes.com), registrado manualmente. Dado privado do projeto: não vai para a base pública nem, por padrão, para as exportações.
 *  Aparece ao lado do custo de referência do cadastro. Quando o custo de referência existir, a relação entre os dois vira sugestão de fator de ajuste, que só vale se a pessoa confirmar. */
function PrecoAnunciado({ base, edicoes, unidadeId, editar }: { base: Base; edicoes: Record<string, Edicao>; unidadeId: string; editar: P["editar"] }) {
  const e = edicoes[`${unidadeId}|${CHAVE_PRECO_ANUNCIADO}`]; const [txt, setTxt] = useState(e?.v != null ? String(e.v) : ""); const velho = !!e && e.v != null && desatualizado(e.data);
  const ref = indicador(base, {}, unidadeId, "c01|custo_referencia_acre"); const refV = typeof ref?.v === "number" ? ref.v : null; const obs = typeof e?.v === "number" ? e.v : null;
  const gravar = () => { const n = Number(txt.replace(/[^0-9.,]/g, "").replace(/\./g, "").replace(",", ".")); editar(unidadeId, CHAVE_PRECO_ANUNCIADO, txt.trim() === "" || !isFinite(n) || n <= 0 ? undefined : n); };
  return (
    <section className="preco-anunciado" id="preco-anunciado">
      <h3>Terreno: preço anunciado e custo de referência</h3>
      <div className="lado-a-lado">
        <div><span className="rot">Preço anunciado, registrado manualmente</span>
          <div className="linha-preco"><input id="preco-anunciado-valor" inputMode="decimal" placeholder="US$ por acre" value={txt} onChange={(ev) => setTxt(ev.target.value)} onKeyDown={(ev) => { if (ev.key === "Enter") gravar(); }} /> <small>US$ por acre</small> <button onClick={gravar}>Registrar</button>{e && <button className="link" onClick={() => { setTxt(""); editar(unidadeId, CHAVE_PRECO_ANUNCIADO, undefined); }}>apagar</button>}</div>
          {obs !== null ? <p className="nota">Registrado em {e!.data} por {e!.dono_id === "local" || !e!.dono_id ? "você" : e!.dono_id}.{velho && <span className="selo velho">desatualizado: mais de 6 meses</span>}</p> : <p className="nota">Nada registrado. Veja os anúncios no Homes.com e anote aqui o preço por acre que encontrou.</p>}</div>
        <div><span className="rot">Custo de referência do terreno (cadastro)</span>
          <p className={refV === null ? "valor-ref semdado" : "valor-ref"}>{refV === null ? "sem dado" : fmt(refV, "US$/acre")}</p>
          <p className="nota">{refV === null ? "O custo de referência depende do cadastro de terrenos vagos, ainda em coleta." : "Valor de cadastro; costuma ficar abaixo do que se paga."}</p></div>
      </div>
      {obs !== null && refV !== null && <p className="relacao" id="relacao-preco"><b>Anúncios {(obs / refV).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} vez{obs / refV >= 2 ? "es" : ""} {obs >= refV ? "acima" : "abaixo"} do cadastro.</b> Sugestão: usar {(obs / refV).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} como fator de ajuste do custo de referência desta região. Só vale se você confirmar.</p>}
      {obs !== null && refV === null && <p className="nota">Quando o custo de referência desta região existir, a ferramenta vai mostrar a relação entre o preço anunciado e o cadastro e sugerir essa relação como fator de ajuste, para você confirmar.</p>}
      <p className="nota privado">Dado privado do seu projeto: não vai para a base pública e só entra nos arquivos exportados se você marcar essa opção. Preço anunciado não é valor de cadastro nem preço de venda fechado.</p>
    </section>);
}
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
        <td className="obs">{i?.v != null && i.esc === "cidade" && <span className="selo velho">dado da cidade inteira</span>}{i?.obs || (i?.v == null && c ? c.fonte_planejada : "")}</td>
      </tr>);
  };
  const grupos = [...new Set(base.criterios.map((c) => c.grupo))];
  const eleita = projeto.unidade_eleita_id === u.unidade_id;
  return (
    <section className="detalhe" ref={caixa}>
      <div className="cab">
        <div><h2>{u.nome}</h2><p>{u.tipo === "cidade_isd" ? "Cidade" : "Área fora de cidade"} · {u.isd_nome} · {u.condados_pct} · {fmt(u.acres_terra)} acres de terra · ID {u.unidade_id}</p></div>
        <div className="acoes">
          <span className="nota-final g" style={estiloNota(linha.nota)}>{linha.nota === null ? "–" : linha.nota.toFixed(0)}</span><span className="com-dado">com dado {textoCobertura(linha)}</span>
          {<button onClick={() => alternar(u.unidade_id)}>{emComparacao ? "Tirar da comparação" : "Comparar"}</button>}
          {u.tipo === "cidade_isd" && <a className="botao" target="_blank" rel="noreferrer" href={`https://www.homes.com/${u.cidade.toLowerCase().replace(/\./g, "").replace(/[^a-z0-9]+/g, "-")}-tx/land-for-sale/`}>Ver terrenos no Homes.com ↗</a>}
          {eleita ? <button className="primario" onClick={irParaEtapa2}>Ir para a etapa 2</button> : <button className="primario" id="escolher-regiao" onClick={() => eleger(u.unidade_id)}>Escolher esta região</button>}
          {!semRolagem && <button onClick={fechar}>Fechar</button>}
        </div>
        <details id="ficha-dados-regiao" className="ficha-regiao"><summary>Dados da região usados nas próximas etapas</summary><QuadroRegiao base={base} edicoes={edicoes} uid={u.unidade_id} /></details>
      </div>
      <PrecoAnunciado base={base} edicoes={edicoes} unidadeId={u.unidade_id} editar={editar} />
      <p className="nota">Tamanho típico, quantidade de anúncios na sua faixa e dias anunciado também podem ser registrados: clique em "sem dado" nos critérios 2, 3 e 5 da tabela abaixo. Ficam gravados com a data, como dado privado do seu projeto.</p>
      {u.tipo === "cidade_isd" && <p className="nota">Cada dado abaixo diz se é desta fatia ou da cidade inteira. Onde aparece "dado da cidade inteira", o valor não representa bem esta fatia e a confiança é baixa.</p>}
      {linha.recorte && <p className="obs-fatia"><b>Vale {linha.recorte.texto}.</b> O resto {u.tipo === "cidade_isd" ? "da cidade" : "da área"} não tem a nota de escola pedida. Imposto, alagamento, renda e tempo até o emprego usados na nota são os dessa parte; a tabela abaixo mostra os valores da região inteira.</p>}
      {u.partes && u.partes.length > 1 && <div className="rolagem"><table className="simples partes">
        <thead><tr><th>Distrito escolar (ISD) nesta região</th><th>Nota do ISD</th><th>% da área</th><th>% dos domicílios</th><th>Imposto total</th><th>Área em zona de alagamento</th><th>Renda (setor censitário)</th></tr></thead>
        <tbody>{u.partes.map((pt) => { const v = (k: string) => base.indicadores[pt.parte_id]?.[k] ?? base.indicadores[u.unidade_id]?.[k]; const vale = !linha.recorte || linha.recorte.partes.some((x) => x.parte_id === pt.parte_id); return (
          <tr key={pt.parte_id} className={vale ? "" : "fora"}><td>{pt.isd_nome}{pt.pequena && <small>parte pequena</small>}{linha.recorte && <small>{vale ? "✓ vale para a nota" : "fora: não tem a nota de escola pedida"}</small>}</td>
            <td>{String(v("c21|nota_isd_letra")?.v ?? "sem dado")}</td><td>{pt.pct_area == null ? "–" : fmt(pt.pct_area) + "%"}</td><td>{pt.pct_domicilios == null ? "–" : fmt(pt.pct_domicilios) + "%"}</td>
            <td>{v("c24|aliquota_total")?.v == null ? "sem dado" : fmt(v("c24|aliquota_total")!.v, "%")}</td><td>{v("c25|pct_area_sfha")?.v == null ? "sem dado" : fmt(v("c25|pct_area_sfha")!.v, "%")}</td>
            <td>{base.indicadores[pt.parte_id]?.["c23|renda_mediana"]?.v == null ? "–" : fmt(base.indicadores[pt.parte_id]["c23|renda_mediana"].v, "US$/ano")}</td></tr>); })}</tbody></table></div>}
      <p className="nota"><b>{linha.atendidos} de {linha.avaliados}</b> critérios com dado atendidos.{linha.poucosDados && <> <b>Dados insuficientes para comparar.</b> Falta dado de: {(linha.faltam ?? []).join("; ")}.</>}</p>
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
