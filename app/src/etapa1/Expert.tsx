import { useMemo, useState } from "react";
import type { Base, ParamResp, PerfilSalvo, Peso, Projeto } from "../tipos";
import { GRUPOS_P, PARAMS, PRECOS, descreveAlvo, emUso, pesoPadrao, pesoTerreno, textoCobertura, type Param } from "../parametros";
import { deduzir, mesclar, perguntaDe } from "../leigo";
import { DONO_LOCAL, carregarPerfis, hoje, salvarPerfis } from "../estado";
import type { Linha } from "../ranking";
import Mapa from "./Mapa";
import ValorAberto from "./ValorAberto";

const igual = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const origemTexto = (r: ParamResp | undefined) => !r ? "" : r.ajustado ? "ajustado manualmente" : r.origem === "sempre" ? "regra fixa do modo guiado" : r.origem === "padrao" ? "padrão inicial" : r.origem.startsWith("perfil:") ? `do perfil "${r.origem.slice(7)}"` :
  perguntaDe(r.origem) ? `da pergunta ${perguntaDe(r.origem)!.n}: ${perguntaDe(r.origem)!.texto}` : r.origem;

/** Painel do modo especialista. Grava no mesmo conjunto de parâmetros que o modo guiado; o que é alterado aqui fica marcado como ajuste manual. */
export default function Expert({ base, projeto, alterar, verResultado, voltar, geo, linhas }: { geo: GeoJSON.FeatureCollection; linhas: Linha[]; base: Base; projeto: Projeto; alterar: (m: Partial<Projeto>) => void; verResultado: () => void; voltar: () => void }) {
  const ps = projeto.parametros ?? {}; const [perfis, setPerfis] = useState<PerfilSalvo[]>(carregarPerfis); const [nome, setNome] = useState("");
  const [ultimo, setUltimo] = useState<string | null>(null);
  const mudar = (id: string, m: Partial<ParamResp>) => { setUltimo(id); alterar({ modo: "expert", parametros: { ...ps, [id]: { ...(ps[id] ?? { alvo: null, peso: pesoPadrao(id) }), ...m, origem: "manual", ajustado: true } } }); };
  const conflitos = projeto.leigo ? mesclar(deduzir(projeto.leigo), ps).conflitos : [];
  const desfazer = (id: string) => alterar({ parametros: { ...ps, [id]: deduzir(projeto.leigo ?? {})[id] } });
  const faixaSel = base.faixas.find((x) => x.id === projeto.faixa_id);
  const pt = pesoTerreno(base, projeto); const [sel, setSel] = useState<string | null>(null);
  /** O que a última escolha fez: quantas regiões atendem, não atendem ou não têm dado naquele parâmetro. */
  const efeito = useMemo(() => { const p = PARAMS.find((x) => x.id === ultimo); if (!p) return null;
    if (!emUso(p, projeto.parametros?.[p.id])) return { nome: p.nome, marcar: false, texto: "Ficou como indiferente: este parâmetro deixou de restringir as regiões." };
    let sim = 0, parte = 0, nao = 0, sem = 0; for (const l of linhas) { const n = l.porCriterio[p.id]?.nota; if (n == null) sem++; else if (n === 100) sim++; else if (n === 0) nao++; else parte++; }
    if (sim + parte + nao === 0) return { nome: p.nome, marcar: false, texto: "Ainda não há dado deste parâmetro para nenhuma região, por isso o mapa não muda. A escolha fica guardada e passa a valer quando o dado entrar." };
    return { nome: p.nome, marcar: true, texto: `${sim} regiões atendem, ${parte} atendem em parte, ${nao} não atendem${sem ? ` e ${sem} não têm dado` : ""}.` }; }, [ultimo, linhas, projeto.parametros]);
  const tudo = linhas.filter((l) => l.avaliados > 0 && l.falhas.length === 0 && !l.poucosDados); const escolhida = linhas.find((l) => l.u.unidade_id === sel);
  const salvarPerfil = () => { if (!nome.trim()) return; const n: PerfilSalvo = { perfil_id: "PF-" + Date.now().toString(36), dono_id: DONO_LOCAL, nome: nome.trim(), criado_em: hoje(), parametros: ps, n_casas: projeto.n_casas ?? 1, construcao: projeto.construcao ?? "simultaneo", preco_venda: projeto.preco_venda ?? null, faixa_id: projeto.faixa_id, valores_abertos: projeto.valores_abertos };
    const l = [...perfis, n]; setPerfis(l); salvarPerfis(l); setNome(""); };
  const aplicar = (pf: PerfilSalvo) => alterar({ modo: "expert", valores_abertos: pf.valores_abertos, faixa_id: pf.faixa_id, n_casas: pf.n_casas, construcao: pf.construcao, preco_venda: pf.preco_venda, parametros: Object.fromEntries(Object.entries(pf.parametros).map(([k, v]) => [k, { ...v, origem: "perfil:" + pf.nome, ajustado: true }])) });
  const excluir = (id: string) => { const l = perfis.filter((x) => x.perfil_id !== id); setPerfis(l); salvarPerfis(l); };
  const INF = Number.POSITIVE_INFINITY;
  const dentro = (o: Param["opcoes"][number], alvo: ParamResp["alvo"]) => !!o.a && !!alvo && (o.a.min ?? -INF) >= (alvo.min ?? -INF) && (o.a.max ?? INF) <= (alvo.max ?? INF);
  /** Parâmetro que aceita faixas vizinhas: marcar ou desmarcar uma opção refaz o intervalo; se as marcadas não forem vizinhas, vale só a clicada. */
  const clicarVizinha = (p: Param, i: number) => { const r = ps[p.id]; const sel = p.opcoes.map((o, j) => (emUso(p, r) && dentro(o, r!.alvo)) !== (j === i));
    const idx = sel.map((x, j) => (x ? j : -1)).filter((j) => j >= 0); if (!idx.length) return mudar(p.id, { alvo: null });
    const cont = idx[idx.length - 1] - idx[0] + 1 === idx.length; const de = cont ? p.opcoes[idx[0]].a! : p.opcoes[i].a!, ate = cont ? p.opcoes[idx[idx.length - 1]].a! : p.opcoes[i].a!;
    const alvo: { min?: number; max?: number } = {}; if (de.min !== undefined) alvo.min = de.min; if (ate.max !== undefined) alvo.max = ate.max; mudar(p.id, { alvo }); };
  const linha = (p: Param) => { const r = ps[p.id]; const on = emUso(p, r); const marcada = (o: Param["opcoes"][number]) => !!r && (p.vizinhas ? on && dentro(o, r.alvo) : igual(o.a, r.alvo));
    const fora = on && p.forma !== "oferta" && !p.opcoes.some(marcada);
    return (
      <div key={p.id} className={"subcrit" + (on ? " definido" : "")}>
        <h4 title={p.ajuda}>{p.nome}{base.criterios.find((c) => p.chave?.startsWith(c.id + "|"))?.cobertura !== "coletado" && p.forma !== "so_cidade" && <i>sem dado ainda</i>}</h4>
        {p.forma === "oferta" ? <p className="nota">Segue a faixa de investimento escolhida acima.</p> :
          <div className="botoes">{p.opcoes.map((o, i) => <button key={i} id={`o-${p.id}-${i}`} className={marcada(o) ? "ativo" : ""} aria-pressed={marcada(o)} onClick={() => (p.vizinhas ? clicarVizinha(p, i) : mudar(p.id, { alvo: o.a }))}>{o.rotulo}</button>)}
            {fora && <button className="ativo" title="Valor deduzido das respostas do modo guiado, fora das opções fixas">{descreveAlvo(p, r!.alvo)}</button>}
            {on && !p.opcoes.some((o) => o.a === null) && <button onClick={() => mudar(p.id, { alvo: null })}>Indiferente</button>}</div>}
        {p.id === "tamanho" && on && r!.alvo!.min !== undefined && r!.alvo!.max === undefined && <ValorAberto projeto={projeto} alterar={alterar} campo="tamanho_acres" piso={r!.alvo!.min} rotulo="Que tamanho de terreno procura?" unidade="acres" />}
        <div className="extras"><span className="seg" role="group" aria-label="peso">peso {(["baixo", "medio", "alto"] as Peso[]).map((w) => <button key={w} id={`w-${p.id}-${w}`} className={(r?.peso ?? pesoPadrao(p.id)) === w ? "ativo" : ""} disabled={!on} onClick={() => mudar(p.id, { peso: w })}>{w === "medio" ? "médio" : w}</button>)}</span>
          <span className={"origem" + (r?.ajustado ? " manual" : "")}>{origemTexto(r)}</span></div>
      </div>); };
  return (
    <div>
      <button className="voltar" onClick={voltar}>← Voltar</button>
      <div className="cab-passo"><div><h1>Modo especialista</h1><p>Todos os parâmetros. Cada resposta é sim/não ou um valor entre opções fixas e afeta só a nota: nenhuma unidade é eliminada.</p></div>
        <div className="acoes"><button className="primario grande" onClick={verResultado}>Ver resultado →</button></div></div>
      {conflitos.length > 0 && <div className="aviso"><b>Ajustes manuais diferentes das respostas do modo guiado</b> (o ajuste manual é mantido e não é sobrescrito):
        <ul>{conflitos.map((c) => { const p = PARAMS.find((x) => x.id === c.id)!; return <li key={c.id}>{p.nome}: você definiu <b>{descreveAlvo(p, c.manual.alvo, projeto, base)}, peso {c.manual.peso}</b>; as respostas do modo guiado dariam {descreveAlvo(p, c.deduzido.alvo, projeto, base)}, peso {c.deduzido.peso}. <button className="link" onClick={() => desfazer(c.id)}>usar o das perguntas</button></li>; })}</ul></div>}
      <div className="painel-com-mapa">
      <div className="form-criterios sequencial">
        <section className="bloco"><h3>Entradas de cálculo</h3>
          <div className="subcrit definido"><h4>Faixa de investimento no terreno{!projeto.faixa_id && <i>escolha uma</i>}</h4><div className="botoes">{base.faixas.map((x) => <button key={x.id} className={projeto.faixa_id === x.id ? "ativo" : ""} onClick={() => { setUltimo("faixa"); alterar({ faixa_id: x.id }); }}>{x.nome}</button>)}</div>
            {faixaSel && faixaSel.max === null && <ValorAberto projeto={projeto} alterar={alterar} campo="investimento" piso={faixaSel.min} rotulo="Quanto pretende investir no terreno?" unidade="US$" />}</div>
          <div className="subcrit definido"><h4>Número de casas</h4><div className="extras"><input id="n-casas" type="number" min={1} step={1} value={projeto.n_casas ?? 1} onChange={(e) => alterar({ n_casas: Math.max(1, Math.round(Number(e.target.value) || 1)) })} />
            <span className="seg">{(["simultaneo", "sequencia"] as const).map((m) => <button key={m} className={(projeto.construcao ?? "simultaneo") === m ? "ativo" : ""} disabled={(projeto.n_casas ?? 1) < 2} onClick={() => alterar({ construcao: m })}>{m === "simultaneo" ? "ao mesmo tempo" : "em sequência"}</button>)}</span></div>
            <p className="nota">Em sequência, a etapa 6 calcula o custo da terra parada entre uma casa e outra.</p></div>
          <div className="subcrit definido"><h4>Preço de venda de cada casa</h4><div className="botoes">{PRECOS.map((o, i) => <button key={i} id={`pv-${i}`} className={igual({ min: o.min, max: o.max }, projeto.preco_venda) ? "ativo" : ""} onClick={() => alterar({ preco_venda: { min: o.min, max: o.max } })}>{o.rotulo}</button>)}</div>
            {projeto.preco_venda?.min !== undefined && projeto.preco_venda.max === undefined && <ValorAberto projeto={projeto} alterar={alterar} campo="preco_venda" piso={projeto.preco_venda.min} rotulo="Por quanto pretende vender cada casa?" unidade="US$" />}</div>
          <div className="subcrit"><h4>Calculados (apenas exibidos)</h4>
            {pt.semFaixa ? <p className="nota" id="peso-terreno"><b>Peso do terreno no preço:</b> escolha acima a faixa de investimento no terreno para calcular.</p>
              : <p className={pt.alerta ? "aviso" : "nota"} id="peso-terreno"><b>Peso do terreno no preço: {pt.min === null ? "—" : pt.min === pt.max ? `${pt.min.toFixed(0)}%` : `de ${pt.min.toFixed(0)}% a ${pt.max!.toFixed(0)}%`}</b>{pt.conta && ` · ${pt.conta}`}{pt.oQueFazer && <><br />{pt.oQueFazer}</>}{pt.avisos.map((a) => <span key={a}><br />{a}</span>)}</p>}
            <p className="nota"><b>Margem potencial:</b> sem dado. Depende do custo de construção (etapa 5) e do preço de venda por sqft da cidade.</p></div>
        </section>
        {GRUPOS_P.map((g) => <section className="bloco" key={g}><h3>{g}</h3>{PARAMS.filter((p) => p.grupo === g).map(linha)}</section>)}
        <section className="bloco"><h3>Perfis salvos</h3>
          <p className="nota">Guarde esta combinação de parâmetros com um nome para reutilizar em outros projetos.</p>
          <form className="extras" onSubmit={(e) => { e.preventDefault(); salvarPerfil(); }}><input id="nome-perfil" placeholder="nome do perfil" value={nome} onChange={(e) => setNome(e.target.value)} /><button disabled={!nome.trim()}>Salvar perfil</button></form>
          {perfis.length === 0 ? <p className="nota">Nenhum perfil salvo.</p> : perfis.map((pf) => <div key={pf.perfil_id} className="extras perfil"><b>{pf.nome}</b><small>{pf.criado_em}</small><button onClick={() => aplicar(pf)}>Aplicar neste projeto</button><button className="link" onClick={() => excluir(pf.perfil_id)}>excluir</button></div>)}
        </section>
      </div>
      <aside className="mapa-vivo">
        <h3>O que as suas escolhas fazem no mapa</h3>
        <p className="nota"><b>{tudo.length} de {linhas.length} regiões</b> atendem tudo o que você escolheu, entre os dados que existem. A cor de cada região mostra quantas das suas escolhas ela não atende: veja a legenda abaixo do mapa. Quanto mais escolhas você faz, mais regiões mudam de cor.</p>
        {efeito && <p className="efeito" id="efeito-escolha"><b>Sua última escolha: {efeito.nome}.</b> {efeito.texto}</p>}
        <Mapa geo={geo} linhas={linhas} sel={sel} setSel={setSel} eleita={null} vivo />
        {escolhida ? <p className="nota"><b>{escolhida.u.nome}</b>{escolhida.recorte && ` (${escolhida.recorte.texto})`} · nota {escolhida.nota?.toFixed(0) ?? "–"} · com dado {textoCobertura(escolhida)}. {escolhida.falhas.length ? "Não atende: " + escolhida.falhas.map((f) => f.nome).join("; ") + "." : "Atende tudo o que tem dado."}</p> : <p className="nota">Clique numa região do mapa para ver o que ela não atende.</p>}
        <p className="nota">Parâmetros marcados "sem dado ainda" não mudam o mapa.</p>
      </aside>
      </div>
      <div className="fim-passo"><button className="primario grande" onClick={verResultado}>Ver resultado →</button></div>
    </div>
  );
}
