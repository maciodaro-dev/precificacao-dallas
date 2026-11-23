import type { Props } from "./Etapa1";
import { normalizar } from "../ranking";
import { FILTROS_PADRAO } from "../estado";

export default function Painel({ base, projeto, alterar }: Props) {
  const n = normalizar(projeto.pesos); const f = projeto.filtros; const t = projeto.tamanho;
  const grupos = [...new Set(base.criterios.map((c) => c.grupo))];
  const filtro = (m: Partial<typeof f>) => alterar({ filtros: { ...f, ...m } });
  return (
    <aside>
      <section>
        <h3>Faixa de investimento no terreno</h3>
        <div className="faixas">{base.faixas.map((x) => <button key={x.id} className={projeto.faixa_id === x.id ? "ativo" : ""} onClick={() => alterar({ faixa_id: x.id })}>{x.nome}</button>)}</div>
        <p className="nota">Muda o critério 3 (oferta na faixa) e o 12 (margem). Ambos dependem de anúncios de terrenos, ainda sem dado.</p>
      </section>
      <section>
        <h3>Estratégia</h3>
        <div className="perfis">{base.perfis.map((x) => <button key={x.id} className={projeto.perfil_origem === x.id ? "ativo" : ""} onClick={() => alterar({ pesos: { ...x.pesos }, perfil_origem: x.id })}>{x.nome}</button>)}
          <button className={projeto.perfil_origem === "so_com_dado" ? "ativo" : ""} onClick={() => alterar({ pesos: Object.fromEntries(base.criterios.filter((c) => c.cobertura === "coletado").map((c) => [c.id, 10])), perfil_origem: "so_com_dado" })}>Só critérios com dado</button></div>
        <p className="nota">As cinco estratégias prontas dependem de critérios ainda sem dado. "Só critérios com dado" usa os {base.criterios.filter((c) => c.cobertura === "coletado").length} que já têm dado, com pesos iguais.</p>
      </section>
      <section>
        <h3>Pesos <button className="link" onClick={() => alterar({ pesos: {}, perfil_origem: "personalizado" })}>zerar</button></h3>
        {grupos.map((g) => <div key={g} className="grupo"><h4>{g}</h4>
          {base.criterios.filter((c) => c.grupo === g).map((c) => (
            <label key={c.id} className={"peso" + (c.cobertura !== "coletado" ? " semfonte" : "")} title={c.fonte_planejada}>
              <span className="nome">{c.nome}{c.cobertura !== "coletado" && <i> sem dado</i>}</span>
              <input type="range" min={0} max={50} step={1} value={projeto.pesos[c.id] ?? 0}
                onChange={(e) => alterar({ pesos: { ...projeto.pesos, [c.id]: Number(e.target.value) }, perfil_origem: "personalizado" })} />
              <span className="pct">{n[c.id] ? Math.round(n[c.id] * 100) + "%" : "–"}</span>
            </label>))}
        </div>)}
        <p className="nota">Os percentuais são os pesos normalizados (somam 100%).</p>
      </section>
      <section>
        <h3>Tamanho do terreno (critério 2)</h3>
        <select value={t.modo} onChange={(e) => alterar({ tamanho: { ...t, modo: e.target.value as typeof t.modo } })}>
          <option value="maior">Maior é melhor</option><option value="menor">Menor é melhor</option><option value="faixa">Faixa-alvo</option>
        </select>
        {t.modo === "faixa" && <div className="linha">de <input type="number" step="0.05" min={0} value={t.min} onChange={(e) => alterar({ tamanho: { ...t, min: Number(e.target.value) } })} /> a{" "}
          <input type="number" step="0.05" min={0} value={t.max} onChange={(e) => alterar({ tamanho: { ...t, max: Number(e.target.value) } })} /> acres</div>}
      </section>
      <section>
        <h3>Filtros eliminatórios <button className="link" onClick={() => alterar({ filtros: { ...FILTROS_PADRAO } })}>limpar</button></h3>
        <label className="linha">ISD mínimo <select value={f.isd_min} onChange={(e) => filtro({ isd_min: e.target.value as typeof f.isd_min })}>
          <option value="">qualquer</option><option>A</option><option>B</option><option>C</option><option>D</option></select></label>
        <label className="linha"><input type="checkbox" checked={f.sem_moratoria} onChange={(e) => filtro({ sem_moratoria: e.target.checked })} /> Sem moratória ativa</label>
        <label className="linha"><input type="checkbox" checked={f.com_esgoto} onChange={(e) => filtro({ com_esgoto: e.target.checked })} /> Com rede de esgoto</label>
        <label className="linha">Alagamento FEMA até <input type="number" min={0} max={100} placeholder="–" value={f.sfha_max ?? ""} onChange={(e) => filtro({ sfha_max: e.target.value === "" ? null : Number(e.target.value) })} /> % da área</label>
        <label className="linha">Tipo <select value={f.tipo} onChange={(e) => filtro({ tipo: e.target.value as typeof f.tipo })}>
          <option value="todas">todas</option><option value="cidade_isd">só cidades</option><option value="nao_incorporado">só não incorporadas</option></select></label>
        <label className="linha">Cobertura mínima <input type="number" min={0} max={100} step={10} value={f.cobertura_min} onChange={(e) => filtro({ cobertura_min: Number(e.target.value) })} /> % do peso</label>
        <label className="linha"><input type="checkbox" checked={f.eliminar_sem_dado} onChange={(e) => filtro({ eliminar_sem_dado: e.target.checked })} /> Eliminar unidade sem dado no filtro</label>
      </section>
    </aside>
  );
}
