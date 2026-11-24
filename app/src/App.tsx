import { useEffect, useMemo, useState } from "react";
import type { Base, Edicao, Projeto } from "./tipos";
import { carregarAtivo, carregarEdicoes, carregarProjetos, duplicar, hoje, novoProjeto, DONO_LOCAL, salvarAtivo, salvarEdicoes, salvarProjetos } from "./estado";
import Etapa1 from "./etapa1/Etapa1";
import EtapaVazia, { ETAPAS } from "./EtapaVazia";
import Dados from "./Dados";
import Partida, { rotuloSituacao, situacaoEtapas } from "./Partida";
import { baixar } from "./exportar";
import { telaAnterior, telaInicial, useRota } from "./rota";

export default function App() {
  const [base, setBase] = useState<Base | null>(null);
  const [geo, setGeo] = useState<GeoJSON.FeatureCollection | null>(null);
  const [erro, setErro] = useState("");
  const [projetos, setProjetos] = useState<Projeto[]>(carregarProjetos);
  const [ativoId, setAtivoId] = useState<string | null>(carregarAtivo);
  const [edicoes, setEdicoes] = useState<Record<string, Edicao>>(carregarEdicoes);
  const { rota, ir, voltar, substituir } = useRota(() => telaInicial(carregarProjetos().find((x) => x.projeto_id === carregarAtivo())));
  // A tela vem do endereço: "inicio…" = ponto de partida; "etapa-N" = etapas 2 a 8; o resto pertence à etapa 1.
  const tela: number | "dados" = rota === "base-de-dados" ? "dados" : rota.startsWith("inicio") ? 0 : /^etapa-[2-8]$/.test(rota) ? Number(rota.slice(6)) : 1;
  const [novoNome, setNovoNome] = useState<string | null>(null);
  const [confirmaExcluir, setConfirmaExcluir] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const emb = (id: string) => { const el = document.getElementById(id); return el?.textContent ? Promise.resolve(JSON.parse(el.textContent)) : null; };
    // Página única (pré-visualização): os dados vêm embutidos no HTML; no site normal, são lidos dos arquivos.
    Promise.all([emb("dados-base") ?? fetch("./base.json").then((r) => r.json()), emb("dados-geo") ?? fetch("./unidades.geojson").then((r) => r.json())])
      .then(([b, g]) => { setBase(b); setGeo(g); }).catch((e) => setErro(String(e)));
  }, []);
  useEffect(() => {
    if (base && !projetos.length) { const p = novoProjeto(base, "Projeto 1"); setProjetos([p]); setAtivoId(p.projeto_id); }
    else if (base && !projetos.some((p) => p.projeto_id === ativoId)) setAtivoId(projetos[0].projeto_id);
  }, [base, projetos, ativoId]);
  useEffect(() => salvarProjetos(projetos), [projetos]);
  useEffect(() => { if (ativoId) salvarAtivo(ativoId); }, [ativoId]);
  useEffect(() => salvarEdicoes(edicoes), [edicoes]);

  const projeto = useMemo(() => projetos.find((p) => p.projeto_id === ativoId) ?? null, [projetos, ativoId]);
  if (erro) return <p className="aviso erro">Não foi possível carregar a base de dados: {erro}</p>;
  if (!base || !geo || !projeto) return <p className="carregando">Carregando a base de dados…</p>;

  const alterar = (m: Partial<Projeto>) => setProjetos((ps) => ps.map((p) => (p.projeto_id === projeto.projeto_id ? { ...p, ...m, alterado_em: hoje() } : p)));
  const editar = (uid: string, k: string, v: number | string | null | undefined) => setEdicoes((e) => {
    const n = { ...e }; const ch = `${uid}|${k}`;
    if (v === undefined) delete n[ch]; else n[ch] = { dono_id: DONO_LOCAL, v, data: hoje(), original: e[ch]?.original ?? base.indicadores[uid]?.[k]?.v ?? null };
    return n;
  });
  const importar = (f: File) => f.text().then((t) => {
    const d = JSON.parse(t); if (!Array.isArray(d.projetos)) throw new Error("arquivo inválido");
    setProjetos(d.projetos); setEdicoes(d.edicoes ?? {}); setAtivoId(d.projetos[0]?.projeto_id ?? null); substituir(telaInicial(d.projetos[0]));
  }).catch((e) => setMsg("Não foi possível abrir o arquivo: " + e.message));
  const eleita = base.unidades.find((u) => u.unidade_id === projeto.unidade_eleita_id);
  const temTerreno = projeto.ponto_partida?.tem_terreno === true; const sit = situacaoEtapas(projeto);
  const etapa1 = temTerreno ? "retrato" : projeto.caminho === "cidade" ? "cidade" : projeto.modo === "expert" ? "especialista" : projeto.modo === "leigo" && projeto.leigo ? "guiado-resultado" : "onde-construir";
  const rotaDe = (n: number | "dados") => (n === "dados" ? "base-de-dados" : n === 0 ? telaInicial(projeto) === "onde-construir" ? "inicio" : telaInicial(projeto) : n === 1 ? etapa1 : `etapa-${n}`);
  const anterior = telaAnterior(rota, projeto);
  const trocarProjeto = (id: string) => { setAtivoId(id); substituir(telaInicial(projetos.find((x) => x.projeto_id === id))); };

  return (
    <div className="app">
      <header>
        <div className="marca"><img src="./marca/mark.png" alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />CSD TOOLS <span>Formação de preço · Dallas–Fort Worth</span></div>
        <div className="projeto">
          <label>Projeto
            <select value={projeto.projeto_id} onChange={(e) => trocarProjeto(e.target.value)}>
              {projetos.map((p) => <option key={p.projeto_id} value={p.projeto_id}>{p.nome}</option>)}
            </select>
          </label>
          {novoNome === null ? <button onClick={() => setNovoNome(projeto.nome)}>Renomear</button> :
            <form className="renomear" onSubmit={(e) => { e.preventDefault(); if (novoNome.trim()) alterar({ nome: novoNome.trim() }); setNovoNome(null); }}>
              <input id="nome-projeto" autoFocus value={novoNome} onChange={(e) => setNovoNome(e.target.value)} onKeyDown={(e) => e.key === "Escape" && setNovoNome(null)} /><button className="primario">Salvar nome</button></form>}
          <button onClick={() => { const p = novoProjeto(base, `Projeto ${projetos.length + 1}`); setProjetos([...projetos, p]); setAtivoId(p.projeto_id); substituir("inicio"); }}>Novo</button>
          <button onClick={() => { const p = duplicar(projeto); setProjetos([...projetos, p]); setAtivoId(p.projeto_id); }}>Duplicar</button>
          {!confirmaExcluir ? <button disabled={projetos.length < 2} onClick={() => setConfirmaExcluir(true)}>Excluir</button> :
            <><button className="perigo" onClick={() => { setProjetos(projetos.filter((p) => p.projeto_id !== projeto.projeto_id)); setConfirmaExcluir(false); }}>Excluir "{projeto.nome}"</button><button onClick={() => setConfirmaExcluir(false)}>Cancelar</button></>}
          <button title="Salva projetos e edições manuais num arquivo" onClick={() => baixar(new Blob([JSON.stringify({ dono_id: DONO_LOCAL, projetos, edicoes }, null, 1)], { type: "application/json" }), `projetos_${hoje()}.json`)}>Salvar em arquivo</button>
          <label className="botao">Abrir arquivo<input type="file" accept=".json" hidden onChange={(e) => e.target.files?.[0] && importar(e.target.files[0])} /></label>
        </div>
      </header>
      {msg && <p className="aviso erro" onClick={() => setMsg("")}>{msg}</p>}
      <nav>
        <button className={tela === 0 ? "ativo" : ""} onClick={() => ir(rotaDe(0))}>Início</button>
        {ETAPAS.map((e) => <button key={e.n} className={tela === e.n ? "ativo" : ""} onClick={() => ir(rotaDe(e.n))} title={temTerreno && e.n <= 4 ? rotuloSituacao(sit[e.n]) : undefined}><b className={temTerreno && sit[e.n] === "feita" ? "feita" : temTerreno && sit[e.n] === "parcial" ? "parcial" : ""}>{temTerreno && sit[e.n] === "feita" ? "✓" : e.n}</b> {e.nome}</button>)}
        <button className={tela === "dados" ? "ativo" : ""} onClick={() => ir("base-de-dados")}>Base de dados</button>
        <span className="eleita">{eleita ? <>{temTerreno ? "Região do terreno" : "Unidade escolhida"}: <b>{eleita.nome}</b></> : "Nenhuma unidade escolhida"}</span>
      </nav>
      {(tela === 0 || rota === "retrato") && <Partida key={projeto.projeto_id} base={base} edicoes={edicoes} projeto={projeto} alterar={alterar} passo={rota} ir={ir} voltar={() => voltar(anterior)} />}
      {tela === 1 && rota !== "retrato" && <Etapa1 key={projeto.projeto_id} base={base} geo={geo} projeto={projeto} projetos={projetos} edicoes={edicoes} alterar={alterar} editar={editar} rota={rota} ir={ir} voltar={() => voltar(anterior)} />}
      {typeof tela === "number" && tela > 1 && <><button className="voltar solto" onClick={() => voltar(anterior)}>← Voltar</button><EtapaVazia n={tela} base={base} projeto={projeto} edicoes={edicoes} situacao={temTerreno && tela <= 4 ? rotuloSituacao(sit[tela]) : null} /></>}
      {tela === "dados" && <><button className="voltar solto" onClick={() => voltar(anterior)}>← Voltar</button><Dados base={base} edicoes={edicoes} editar={editar} /></>}
      <p className="aviso-legal">Esta ferramenta é apoio à decisão. Não é recomendação de investimento nem avaliação de imóvel. Confira os dados na fonte antes de decidir.<span>CSD Tools é um produto da CSD Strategy. CSD Strategy is a d/b/a of Green to suit LLC.</span></p>
      {typeof tela === "number" && tela >= 1 && (
        <footer className="passos">
          <button onClick={() => voltar(anterior)}>← Voltar</button>
          <span className="onde">Etapa {tela} de 8 · {ETAPAS[tela - 1].nome}{temTerreno && tela <= 4 && ` · ${rotuloSituacao(sit[tela])}`}{tela === 1 && !eleita && " · escolha uma unidade no resultado para seguir"}</span>
          <button className="primario" disabled={tela === 8 || (tela === 1 && !eleita)} onClick={() => ir(`etapa-${tela + 1}`)}>
            {tela < 8 ? `Próxima etapa: ${ETAPAS[tela].nome} →` : "Última etapa"}</button>
        </footer>)}
    </div>
  );
}
