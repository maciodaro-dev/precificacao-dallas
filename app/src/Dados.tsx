import { useMemo, useState } from "react";
import type { Base, Edicao } from "./tipos";
import { chave, indicador } from "./ranking";

export default function Dados({ base, edicoes, editar }: { base: Base; edicoes: Record<string, Edicao>; editar: (u: string, k: string, v: number | string | null | undefined) => void }) {
  const [aba, setAba] = useState<"pend" | "fontes" | "premissas" | "edicoes">("pend");
  const [crit, setCrit] = useState("");
  const cobertura = useMemo(() => base.criterios.map((c) => {
    const ks = c.por_faixa ? base.faixas.map((f) => chave(c, f.id)) : [chave(c, "")];
    const n = base.unidades.filter((u) => ks.some((k) => indicador(base, edicoes, u.unidade_id, k)?.v != null)).length;
    return { c, n };
  }), [base, edicoes]);
  const total = cobertura.reduce((a, x) => a + x.n, 0), max = base.unidades.length * base.criterios.length;
  const sel = base.criterios.find((c) => c.id === crit);
  return (
    <main className="dados">
      <h1>Base de dados</h1>
      <p>Base gerada em {base.gerado_em}. {base.unidades.length} unidades, {base.criterios.length} critérios. Preenchimento da métrica principal: <b>{total} de {max}</b> ({Math.round((100 * total) / max)}%).</p>
      <div className="abas">
        {([["pend", "Pendências por critério"], ["fontes", "Fontes e licenças"], ["premissas", "Registro de premissas"], ["edicoes", `Edições manuais (${Object.keys(edicoes).length})`]] as const).map(([k, n]) =>
          <button key={k} className={aba === k ? "ativo" : ""} onClick={() => setAba(k)}>{n}</button>)}
      </div>
      {aba === "pend" && <>
        <table className="simples"><thead><tr><th>Critério</th><th>Grupo</th><th>Unidades com dado</th><th>Situação</th><th>Fonte planejada</th><th></th></tr></thead><tbody>
          {cobertura.map(({ c, n }) => <tr key={c.id}><td>{c.id} · {c.nome}</td><td>{c.grupo}</td><td>{n} / {base.unidades.length}</td>
            <td><span className={"sit " + c.cobertura}>{c.cobertura}</span></td><td>{c.fonte_planejada}</td>
            <td><button onClick={() => setCrit(crit === c.id ? "" : c.id)}>{crit === c.id ? "Fechar" : "Preencher"}</button></td></tr>)}
        </tbody></table>
        {sel && <section><h2>Preencher: {sel.nome} ({sel.unidade_medida})</h2>
          <p className="nota">O valor informado fica marcado como edição manual, com a data de hoje. Campo vazio = sem dado.</p>
          <table className="simples"><thead><tr><th>Unidade</th><th>Valor</th><th>Motivo da pendência</th></tr></thead><tbody>
            {base.unidades.map((u) => { const k = chave(sel, "F2"); const i = indicador(base, edicoes, u.unidade_id, k); return (
              <tr key={u.unidade_id}><td>{u.nome}</td><td><input defaultValue={i?.v ?? ""} key={String(i?.v)} onBlur={(e) => { const t = e.target.value.trim(); const atual = i?.v ?? "";
                if (String(atual) === t) return; editar(u.unidade_id, k, t === "" ? null : isNaN(Number(t.replace(",", "."))) ? t : Number(t.replace(",", "."))); }} /></td>
                <td>{i?.v == null ? i?.obs || sel.fonte_planejada : i.editado ? "editado em " + i.data_edicao : i.f}</td></tr>); })}
          </tbody></table>{sel.por_faixa && <p className="nota">Critério por faixa: esta lista edita a faixa $100–500 mil. As outras faixas são editadas no detalhe da unidade, na etapa 1.</p>}</section>}
      </>}
      {aba === "fontes" && <><p className="nota">Levantamento de licenças de 2026-11-24. Não é parecer jurídico: linhas "a confirmar" ou "com restrição" precisam ser conferidas nos termos originais antes de qualquer uso comercial.</p>
        <div className="rolagem"><table className="simples"><thead><tr><th>Fonte</th><th>Critérios</th><th>Licença / termos</th><th>Uso comercial</th><th>Redistribuição</th><th>Atualização</th><th>Situação</th><th>Alternativa</th></tr></thead><tbody>
        {base.fontes.map((f) => <tr key={f.id}><td>{f.url ? <a href={f.url} target="_blank" rel="noreferrer">{f.nome}</a> : f.nome}<small>{f.orgao}</small></td><td>{f.criterios}</td>
          <td>{f.licenca}{f.termos_url && <small><a href={f.termos_url} target="_blank" rel="noreferrer">termos</a> · {f.verificacao}</small>}</td>
          <td><span className={"sit " + (f.uso_comercial === "sim" ? "ok" : f.uso_comercial === "não" ? "bloqueado" : "pendente")}>{f.uso_comercial}</span></td><td>{f.redistribuicao}</td><td>{f.periodicidade}</td>
          <td><span className={"sit " + f.situacao}>{f.situacao}</span>{f.obs && <small>{f.obs}</small>}</td><td>{f.alternativa}</td></tr>)}</tbody></table></div></>}
      {aba === "premissas" && <table className="simples"><thead><tr><th>ID</th><th>Premissa</th><th>Valor</th><th>Autor</th><th>Data</th><th>Justificativa</th><th>Usada em</th></tr></thead><tbody>
        {base.premissas.map((p) => <tr key={p.premissa_id}><td>{p.premissa_id}</td><td>{p.descricao}</td><td>{p.valor} {p.unidade}</td><td>{p.autor}</td><td>{p.data}</td><td>{p.justificativa}</td><td>{p.usada_em}</td></tr>)}</tbody></table>}
      {aba === "edicoes" && (Object.keys(edicoes).length === 0 ? <p>Nenhum valor foi editado manualmente.</p> :
        <table className="simples"><thead><tr><th>Unidade</th><th>Dado</th><th>Valor original</th><th>Valor editado</th><th>Data</th><th></th></tr></thead><tbody>
          {Object.entries(edicoes).map(([ch, e]) => { const [uid, ...r] = ch.split("|"); const k = r.join("|"); return (
            <tr key={ch}><td>{base.unidades.find((u) => u.unidade_id === uid)?.nome ?? uid}</td><td>{k}</td><td>{String(e.original ?? "sem dado")}</td><td>{String(e.v ?? "sem dado")}</td><td>{e.data}</td>
              <td><button onClick={() => editar(uid, k, undefined)}>Restaurar</button></td></tr>); })}</tbody></table>)}
    </main>
  );
}
