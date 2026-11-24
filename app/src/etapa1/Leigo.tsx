import { useState } from "react";
import type { Base, Edicao, Projeto, RespostasLeigo } from "../tipos";
import type { Linha } from "../ranking";
import { indicador } from "../ranking";
import { RESPOSTAS_PADRAO, projetoDoLeigo, resumo, type Pergunta } from "../leigo";
import { perguntasVisiveis } from "../rota";
import { PARAMS, PESOS, ativos, pesoDe, pesoTerreno, textoCobertura } from "../parametros";
import AvisoCobertura from "./AvisoCobertura";
import ValorAberto from "./ValorAberto";
import { cor, fmt, estiloNota } from "../formato";
import Mapa from "./Mapa";
import FontesUsadas from "../Fontes";

const valorDe = (q: Pergunta, r: RespostasLeigo, faixa: string | null): string => {
  if (q.id === "faixa") return faixa ?? ""; const v = (r as Record<string, unknown>)[q.id];
  if (v === undefined) return q.padrao; return typeof v === "boolean" ? (v ? "sim" : "nao") : String(v);
};
/** Uma pergunta por tela. Só o investimento no terreno é obrigatório; as demais já vêm com o padrão marcado.
 *  Cada resposta é gravada no Projeto na hora (e os parâmetros são deduzidos de novo), para que voltar nunca apague nada. */
export function Perguntas({ base, projeto, alterar, indice, ir, voltar }: { base: Base; projeto: Projeto; alterar: (m: Partial<Projeto>) => void; indice: number; ir: (rota: string) => void; voltar: () => void }) {
  const faixaAberta = projeto.leigo?.faixa_ok ? base.faixas.find((f) => f.id === projeto.faixa_id && f.max === null) : undefined;
  const r: RespostasLeigo = { ...RESPOSTAS_PADRAO, ...projeto.leigo }; const faixa = projeto.leigo?.faixa_ok ? projeto.faixa_id : null;
  const lista = perguntasVisiveis(r); const i = Math.min(Math.max(indice, 0), lista.length - 1); const q = lista[i]; const atual = valorDe(q, r, faixa);
  const gravar = (novo: RespostasLeigo, extra: Partial<Projeto> = {}) => alterar({ caminho: null, ...extra, ...projetoDoLeigo(novo, projeto) });
  const escolher = (v: string) => { const base: RespostasLeigo = { ...projeto.leigo };
    if (q.id === "faixa") gravar({ ...base, faixa_ok: true }, { faixa_id: v });
    else gravar({ ...base, [q.id]: ["vender_rapido", "valorizacao", "comecar_logo", "agua_esgoto", "escola"].includes(q.id) ? v === "sim" : q.id === "preco" ? Number(v) : v }); };
  const ultima = i >= lista.length - 1; const pode = !!faixa;
  const concluir = () => { alterar({ modo: "leigo", caminho: null, ...projetoDoLeigo({ ...projeto.leigo }, projeto) }); ir("guiado-resultado"); };
  return (
    <div className="pergunta">
      <button className="voltar" onClick={voltar}>← Voltar</button>
      <div className="progresso"><span style={{ width: `${(100 * (i + 1)) / lista.length}%` }} /></div>
      <p className="passo-n">Modo guiado · pergunta {i + 1} de {lista.length}{q.obrigatoria ? " · obrigatória" : " · opcional, já com uma resposta sugerida"}</p>
      <h1>{q.texto}</h1>
      <div className="opcoes">{q.opcoes.map((o) => <button key={o.valor} id={`q-${q.id}-${o.valor}`} className={atual === o.valor ? "ativo" : ""} aria-pressed={atual === o.valor} onClick={() => escolher(o.valor)}><b>{o.rotulo}</b>{o.apoio && <span>{o.apoio}</span>}</button>)}</div>
      {q.id === "faixa" && faixaAberta && <ValorAberto projeto={projeto} alterar={alterar} campo="investimento" piso={faixaAberta.min} rotulo="Quanto pretende investir no terreno?" unidade="US$" />}
      {q.id === "preco" && projeto.preco_venda?.min !== undefined && projeto.preco_venda.max === undefined && <ValorAberto projeto={projeto} alterar={alterar} campo="preco_venda" piso={projeto.preco_venda.min} rotulo="Por quanto pretende vender cada casa?" unidade="US$" />}
      <p className="ajuda">{q.ajuda}</p>
      <div className="nav-perg"><span />
        {!ultima && pode && <button onClick={concluir}>Pular para o resultado</button>}
        <button className="primario grande" disabled={!pode} onClick={() => (ultima ? concluir() : ir(`guiado-${i + 2}`))}>{ultima ? "Ver resultado →" : "Próxima →"}</button>
      </div>
      {!pode && <p className="nota">Escolha uma faixa de investimento para continuar.</p>}
    </div>
  );
}

function explicar(l: Linha, pr: Projeto, base: Base, edicoes: Record<string, Edicao>) {
  const ps = ativos(pr).sort((a, b) => PESOS[pesoDe(pr, b.id)] - PESOS[pesoDe(pr, a.id)]);
  const ok = ps.filter((p) => l.porCriterio[p.id]?.nota === 100); const semDado = ps.filter((p) => l.porCriterio[p.id] && l.porCriterio[p.id].nota === null && l.porCriterio[p.id].peso > 0);
  const lista = (xs: string[]) => (xs.length <= 1 ? xs.join("") : xs.slice(0, -1).join(", ") + " e " + xs[xs.length - 1]);
  const val = (id: string) => { const x = l.porCriterio[id]; const p = PARAMS.find((y) => y.id === id)!; return x?.texto ?? (x?.bruto == null ? "" : fmt(x.bruto / (p.fator ?? 1), p.um === "US$" || p.um === "US$/ano" ? p.um : p.um === "%" ? "%" : p.um)); };
  const forte = ok.find((p) => ["max", "min", "intervalo", "letra"].includes(p.forma)) ?? ok[0];
  const f = l.falhas ?? [];
  const prazo = indicador(base, edicoes, l.u.unidade_id, "c08|prazo_aprovacao_dias");
  return {
    porque: ok.length ? `Atende ${ok.length} das ${ps.filter((p) => l.porCriterio[p.id]?.peso > 0).length} respostas que têm dado: ${lista(ok.slice(0, 3).map((p) => p.leigo))}.` : "Não atende por inteiro nenhuma das suas respostas; aparece porque as outras unidades atendem menos.",
    forte: forte ? `${forte.leigo[0].toUpperCase() + forte.leigo.slice(1)}${val(forte.id) ? ` (${val(forte.id)})` : ""}.` : "Nenhum destaque entre as suas respostas.",
    atencao: f.length ? `${f[0].leigo[0].toUpperCase() + f[0].leigo.slice(1)}: ${f[0].valor}; você pediu ${f[0].alvo}.` : semDado.length ? `Faltam dados sobre ${lista(semDado.slice(0, 3).map((p) => p.leigo))}.` : "Nenhum entre as suas respostas.",
    nao: f.map((x) => x.leigo), semDado: semDado.length,
    prazo: prazo?.v != null ? `Prazo de aprovação nesta cidade: ${fmt(prazo.v, "dias")} (dado de ${prazo.ref}).` : `Prazo de aprovação: sem dado da cidade. Estimativa geral: ${pr.leigo?.comecar_logo === false ? "6 a 12 meses ou mais" : "1 a 3 meses"}.`,
  };
}

interface PR { seletor: React.ReactNode; total: number; insuficientes: number; base: Base; geo: GeoJSON.FeatureCollection; projeto: Projeto; edicoes: Record<string, Edicao>; linhas: Linha[]; conflitos: { id: string }[]; eleger: (id: string) => void; irParaEtapa2: () => void; voltar: () => void; abrirExpert: () => void; detalhar: (id: string) => void }
export function ResultadoLeigo({ seletor, total, insuficientes, base, geo, projeto, edicoes, linhas, conflitos, eleger, irParaEtapa2, voltar, abrirExpert, detalhar }: PR) {
  const [dois, setDois] = useState<string[]>([]); const [pagina, setPagina] = useState(false); const [sel, setSel] = useState<string | null>(null);
  const top = linhas.slice(0, 5); const faixa = base.faixas.find((f) => f.id === projeto.faixa_id)?.nome ?? ""; const pt = pesoTerreno(base, projeto);
  const frase = resumo(projeto.leigo ?? {}, faixa); const marcar = (id: string) => setDois((d) => (d.includes(id) ? d.filter((x) => x !== id) : d.length < 2 ? [...d, id] : [d[1], id]));
  const ps = ativos(projeto);
  const cartao = (l: Linha, compacto = false) => { const e = explicar(l, projeto, base, edicoes); const eleita = projeto.unidade_eleita_id === l.u.unidade_id; return (
    <article key={l.u.unidade_id} className={"cartao" + (eleita ? " eleita" : "")}>
      <header><span className="pos">{l.posicao}º</span><h3>{l.u.nome}</h3><span className="nota-final" style={estiloNota(l.nota)} title="Nota de 0 a 100: quanto a unidade atende às suas respostas">{l.nota?.toFixed(0)}</span></header>
      {l.recorte && <p className="recorte"><b>Região:</b> {l.recorte.texto}. O resto da cidade não tem a nota de escola pedida.</p>}
      <p><b>Por que apareceu:</b> {e.porque}</p><p><b>Ponto forte:</b> {e.forte}</p><p><b>Ponto de atenção:</b> {e.atencao}</p>
      <p className={e.nao.length ? "naoatende" : ""}><b>Não atende:</b> {e.nao.length ? e.nao.join("; ") + "." : "nada, entre as respostas que têm dado."}</p>
      <p className="nota">{e.prazo} <b>Com dado: {textoCobertura(l)}</b> das suas respostas nesta região.</p>
      {!compacto && <div className="acoes"><label className="obrig"><input type="checkbox" checked={dois.includes(l.u.unidade_id)} onChange={() => marcar(l.u.unidade_id)} /> comparar</label>
        <button onClick={() => detalhar(l.u.unidade_id)}>Ver todos os dados</button>
        {eleita ? <button className="primario" onClick={irParaEtapa2}>Seguir para a etapa 2 →</button> : <button className="primario" onClick={() => eleger(l.u.unidade_id)}>Escolher esta</button>}</div>}
    </article>); };
  const comp = linhas.filter((l) => dois.includes(l.u.unidade_id));
  return (
    <main className={pagina ? "leigo-res uma-pagina" : "leigo-res"}>
      <div className="cab-passo"><div>{pagina && <p className="passo-n">CSD Tools — Formação de preço · Dallas–Fort Worth</p>}<h1>{pagina ? "Resumo" : "Onde procurar"}</h1><p className="frase">{frase}</p></div>
        <div className="acoes nao-imprimir"><button className="voltar" onClick={voltar}>← Voltar</button><button onClick={abrirExpert}>Abrir no modo especialista</button>
          <button onClick={() => setPagina(!pagina)}>{pagina ? "Voltar ao resultado" : "Resumo de uma página"}</button>{pagina && <button className="primario" onClick={() => window.print()}>Imprimir</button>}</div></div>
      {conflitos.length > 0 && <p className="aviso nao-imprimir">{conflitos.length === 1 ? "Um parâmetro foi ajustado" : `${conflitos.length} parâmetros foram ajustados`} manualmente no modo especialista e não {conflitos.length === 1 ? "segue" : "seguem"} mais as respostas do modo guiado: {conflitos.map((c) => PARAMS.find((p) => p.id === c.id)?.nome).join(", ")}. O ajuste manual foi mantido; abra o modo especialista para rever.</p>}
      <AvisoCobertura base={base} projeto={projeto} edicoes={edicoes} guiado />
      {pt.min !== null && <p className={pt.alerta ? "aviso" : "nota"} id="peso-terreno"><b>Peso do terreno no preço da casa: {pt.min === pt.max ? `${pt.min.toFixed(0)}%` : `de ${pt.min.toFixed(0)}% a ${pt.max!.toFixed(0)}%`}.</b> Conta: {pt.conta}. {pt.oQueFazer} {pt.avisos.join(" ")}</p>}
      <div className="barra nao-imprimir">{seletor}<span className="resumo">{linhas.length} regiões comparáveis de {total}{insuficientes > 0 && ` · ${insuficientes} ficaram de fora desta lista por terem dados insuficientes para comparar (veja no modo especialista)`}</span></div>
      <p className="nota">Nenhuma unidade é eliminada: todas aparecem em ordem de nota. Aqui estão as 5 melhores do recorte escolhido; a posição é a geral, na DFW inteira.</p>
      <div className="cartoes">{top.map((l) => cartao(l, pagina))}</div>
      {!pagina && <>
        <h2>Comparação de duas unidades</h2>
        {comp.length < 2 ? <p className="vazio">Marque "comparar" em duas unidades acima.</p> : <div className="rolagem"><table className="simples comp">
          <thead><tr><th>Sua resposta</th>{comp.map((l) => <th key={l.u.unidade_id}>{l.u.nome} · nota {l.nota?.toFixed(0)}<small>com dado {textoCobertura(l)}</small></th>)}</tr></thead>
          <tbody>{ps.filter((p) => comp.some((l) => l.porCriterio[p.id]?.peso > 0)).map((p) => <tr key={p.id}><td>{p.leigo[0].toUpperCase() + p.leigo.slice(1)}</td>
            {comp.map((l) => { const x = l.porCriterio[p.id]; return <td key={l.u.unidade_id} className={x.nota === null ? "semdado" : x.nota === 100 ? "sim" : "nao"}>{x.nota === null ? "sem dado" : <><span className="marca-ok">{x.nota === 100 ? "✓ atende" : x.nota === 0 ? "✗ não atende" : "△ atende em parte"}</span><small>{x.texto ?? (x.bruto == null ? "" : fmt(x.bruto / (p.fator ?? 1), p.um))}</small></>}</td>; })}</tr>)}</tbody></table></div>}
        <h2>Mapa</h2>
        <Mapa geo={geo} linhas={linhas} sel={sel} setSel={setSel} eleita={projeto.unidade_eleita_id} />
      </>}
      <FontesUsadas base={base} edicoes={edicoes} unidades={top.map((l) => l.u.unidade_id)} chaves={ps.map((p) => p.chave).filter((k): k is string => !!k)} />
    </main>
  );
}
