import { useEffect, useMemo, useState } from "react";
import type { Base, Edicao, Projeto } from "./tipos";
import { carregarAtivo, carregarEdicoes, carregarProjetos, duplicar, hoje, novoProjeto, salvarAtivo, salvarEdicoes, salvarProjetos } from "./estado";
import Etapa1 from "./etapa1/Etapa1";
import EtapaVazia, { ETAPAS } from "./EtapaVazia";
import Dados from "./Dados";
import { baixar } from "./exportar";

export default function App() {
  const [base, setBase] = useState<Base | null>(null);
  const [geo, setGeo] = useState<GeoJSON.FeatureCollection | null>(null);
  const [erro, setErro] = useState("");
  const [projetos, setProjetos] = useState<Projeto[]>(carregarProjetos);
  const [ativoId, setAtivoId] = useState<string | null>(carregarAtivo);
  const [edicoes, setEdicoes] = useState<Record<string, Edicao>>(carregarEdicoes);
  const [tela, setTela] = useState<number | "dados">(1);
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
    if (v === undefined) delete n[ch]; else n[ch] = { v, data: hoje(), original: e[ch]?.original ?? base.indicadores[uid]?.[k]?.v ?? null };
    return n;
  });
  const importar = (f: File) => f.text().then((t) => {
    const d = JSON.parse(t); if (!Array.isArray(d.projetos)) throw new Error("arquivo inválido");
    setProjetos(d.projetos); setEdicoes(d.edicoes ?? {}); setAtivoId(d.projetos[0]?.projeto_id ?? null);
  }).catch((e) => setMsg("Não foi possível abrir o arquivo: " + e.message));
  const eleita = base.unidades.find((u) => u.unidade_id === projeto.unidade_eleita_id);

  return (
    <div className="app">
      <header>
        <div className="marca">Formação de preço <span>Região de Dallas, TX</span></div>
        <div className="projeto">
          <label>Projeto
            <select value={projeto.projeto_id} onChange={(e) => setAtivoId(e.target.value)}>
              {projetos.map((p) => <option key={p.projeto_id} value={p.projeto_id}>{p.nome}</option>)}
            </select>
          </label>
          {novoNome === null ? <button onClick={() => setNovoNome(projeto.nome)}>Renomear</button> :
            <form className="renomear" onSubmit={(e) => { e.preventDefault(); if (novoNome.trim()) alterar({ nome: novoNome.trim() }); setNovoNome(null); }}>
              <input id="nome-projeto" autoFocus value={novoNome} onChange={(e) => setNovoNome(e.target.value)} onKeyDown={(e) => e.key === "Escape" && setNovoNome(null)} /><button className="primario">Salvar nome</button></form>}
          <button onClick={() => { const p = novoProjeto(base, `Projeto ${projetos.length + 1}`); setProjetos([...projetos, p]); setAtivoId(p.projeto_id); }}>Novo</button>
          <button onClick={() => { const p = duplicar(projeto); setProjetos([...projetos, p]); setAtivoId(p.projeto_id); }}>Duplicar</button>
          {!confirmaExcluir ? <button disabled={projetos.length < 2} onClick={() => setConfirmaExcluir(true)}>Excluir</button> :
            <><button className="perigo" onClick={() => { setProjetos(projetos.filter((p) => p.projeto_id !== projeto.projeto_id)); setConfirmaExcluir(false); }}>Excluir "{projeto.nome}"</button><button onClick={() => setConfirmaExcluir(false)}>Cancelar</button></>}
          <button title="Salva projetos e edições manuais num arquivo" onClick={() => baixar(new Blob([JSON.stringify({ projetos, edicoes }, null, 1)], { type: "application/json" }), `projetos_${hoje()}.json`)}>Salvar em arquivo</button>
          <label className="botao">Abrir arquivo<input type="file" accept=".json" hidden onChange={(e) => e.target.files?.[0] && importar(e.target.files[0])} /></label>
        </div>
      </header>
      {msg && <p className="aviso erro" onClick={() => setMsg("")}>{msg}</p>}
      <nav>
        {ETAPAS.map((e) => <button key={e.n} className={tela === e.n ? "ativo" : ""} onClick={() => setTela(e.n)}><b>{e.n}</b> {e.nome}</button>)}
        <button className={tela === "dados" ? "ativo" : ""} onClick={() => setTela("dados")}>Base de dados</button>
        <span className="eleita">{eleita ? <>Unidade eleita: <b>{eleita.nome}</b></> : "Nenhuma unidade eleita"}</span>
      </nav>
      {tela === 1 && <Etapa1 base={base} geo={geo} projeto={projeto} projetos={projetos} edicoes={edicoes} alterar={alterar} editar={editar} irParaEtapa2={() => setTela(2)} />}
      {typeof tela === "number" && tela > 1 && <EtapaVazia n={tela} base={base} projeto={projeto} edicoes={edicoes} />}
      {tela === "dados" && <Dados base={base} edicoes={edicoes} editar={editar} />}
      {typeof tela === "number" && (
        <footer className="passos">
          <button disabled={tela === 1} onClick={() => { setTela(tela - 1); window.scrollTo(0, 0); }}>← Etapa anterior{tela > 1 && `: ${ETAPAS[tela - 2].nome}`}</button>
          <span className="onde">Etapa {tela} de 8 · {ETAPAS[tela - 1].nome}{tela === 1 && !eleita && " · eleja uma unidade no ranking para seguir"}</span>
          <button className="primario" disabled={tela === 8 || (tela === 1 && !eleita)} onClick={() => { setTela(tela + 1); window.scrollTo(0, 0); }}>
            {tela < 8 ? `Próxima etapa: ${ETAPAS[tela].nome} →` : "Última etapa"}</button>
        </footer>)}
    </div>
  );
}
