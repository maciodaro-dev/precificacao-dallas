import { useMemo, useState } from "react";
import type { Base, Edicao, Projeto } from "../tipos";
import { calcular, normalizar, pesoCorrelacionado } from "../ranking";
import { exportarCsv, exportarXlsx } from "../exportar";
import Painel from "./Painel";
import Tabela from "./Tabela";
import Detalhe from "./Detalhe";
import Mapa from "./Mapa";
import { CompararUnidades, CompararProjetos } from "./Comparar";

export interface Props {
  base: Base; geo: GeoJSON.FeatureCollection; projeto: Projeto; projetos: Projeto[]; edicoes: Record<string, Edicao>;
  alterar: (m: Partial<Projeto>) => void; editar: (u: string, k: string, v: number | string | null | undefined) => void; irParaEtapa2: () => void;
}
export default function Etapa1(p: Props) {
  const { base, projeto, edicoes } = p;
  const [aba, setAba] = useState<"ranking" | "mapa" | "unidades" | "projetos">("ranking");
  const [sel, setSel] = useState<string | null>(null);
  const [comparar, setComparar] = useState<string[]>([]);
  const linhas = useMemo(() => calcular(base, projeto, edicoes), [base, projeto, edicoes]);
  const pesos = normalizar(projeto.pesos);
  const corr = pesoCorrelacionado(base, projeto.pesos);
  const vivas = linhas.filter((l) => !l.eliminada.length);
  const cobMedia = vivas.length ? vivas.reduce((a, l) => a + l.cobertura, 0) / vivas.length : 0;
  const semPeso = Object.keys(pesos).length === 0;
  const alternar = (id: string) => setComparar((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length < 4 ? [...c, id] : c));
  const eleger = (id: string) => { p.alterar({ unidade_eleita_id: id, eleita_em: new Date().toISOString().slice(0, 10) }); };
  const linhaSel = linhas.find((l) => l.u.unidade_id === sel) ?? null;

  return (
    <div className="etapa1">
      <Painel {...p} />
      <main id="resultado">
        <ol className="guia">
          <li className="feito"><b>1</b> Escolha a faixa, a estratégia e os pesos no painel</li>
          <li className={linhaSel || projeto.unidade_eleita_id ? "feito" : "agora"}><b>2</b> Veja o ranking abaixo e clique numa unidade para abrir o detalhe</li>
          <li className={projeto.unidade_eleita_id ? "feito" : linhaSel ? "agora" : ""}><b>3</b> Clique em "Eleger unidade"</li>
          <li className={projeto.unidade_eleita_id ? "agora" : ""}><b>4</b> {projeto.unidade_eleita_id ? <button className="primario" onClick={p.irParaEtapa2}>Seguir para a etapa 2 →</button> : "Siga para a etapa 2"}</li>
        </ol>
        {corr > 0.4 && <p className="aviso">ISD, segurança e renda somam {Math.round(corr * 100)}% do peso. Esses critérios andam juntos: o ranking pode estar contando a mesma coisa três vezes.</p>}
        {semPeso && <p className="aviso erro">Todos os pesos estão em zero. Dê peso a pelo menos um critério.</p>}
        {!semPeso && cobMedia < 0.5 && <p className="aviso">Em média, só {Math.round(cobMedia * 100)}% do peso deste projeto está em critérios que já têm dado. A nota é calculada apenas com o que existe; veja a coluna "Cobertura" e a tela "Base de dados".</p>}
        <div className="barra">
          <div className="abas">
            {([["ranking", "Ranking"], ["mapa", "Mapa"], ["unidades", `Comparar unidades (${comparar.length}/4)`], ["projetos", "Comparar projetos"]] as const).map(([k, n]) =>
              <button key={k} className={aba === k ? "ativo" : ""} onClick={() => setAba(k)}>{n}</button>)}
          </div>
          <label className="escolher">Ver perfil de
            <select id="escolher-unidade" value={sel ?? ""} onChange={(e) => { setSel(e.target.value || null); if (aba === "unidades" || aba === "projetos") setAba("ranking"); }}>
              <option value="">escolha a cidade…</option>
              {[...base.unidades].sort((x, y) => x.nome.localeCompare(y.nome)).map((u) => <option key={u.unidade_id} value={u.unidade_id}>{u.nome}</option>)}
            </select></label>
          <span className="resumo">{vivas.length} unidades no ranking · {linhas.length - vivas.length} eliminadas</span>
          <div className="exportar">
            <button onClick={() => exportarXlsx(base, projeto, linhas, edicoes)}>Exportar .xlsx</button>
            <button onClick={() => exportarCsv(base, projeto, linhas, edicoes, "ranking")}>Ranking .csv</button>
            <button onClick={() => exportarCsv(base, projeto, linhas, edicoes, "dados")}>Dados .csv</button>
          </div>
        </div>
        {aba === "ranking" && <Tabela base={base} projeto={projeto} linhas={linhas} sel={sel} setSel={setSel} comparar={comparar} alternar={alternar} />}
        {aba === "mapa" && <Mapa geo={p.geo} linhas={linhas} sel={sel} setSel={setSel} eleita={projeto.unidade_eleita_id} />}
        {aba === "unidades" && <CompararUnidades base={base} projeto={projeto} edicoes={edicoes} linhas={linhas.filter((l) => comparar.includes(l.u.unidade_id))} remover={alternar} />}
        {aba === "projetos" && <CompararProjetos base={base} projetos={p.projetos} edicoes={edicoes} />}
        {linhaSel && aba !== "unidades" && aba !== "projetos" &&
          <Detalhe key={linhaSel.u.unidade_id} base={base} projeto={projeto} edicoes={edicoes} linha={linhaSel} editar={p.editar} fechar={() => setSel(null)} eleger={eleger} irParaEtapa2={p.irParaEtapa2}
            emComparacao={comparar.includes(linhaSel.u.unidade_id)} alternar={alternar} />}
      </main>
    </div>
  );
}
