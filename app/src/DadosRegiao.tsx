// Dados da região que as próximas etapas leem da base. Aparecem na etapa 1: na tela "Região escolhida" e na ficha da região.
// As etapas seguintes continuam lendo estes valores pelo ID da região; só não os exibem.
import type { Base, Edicao, Projeto } from "./tipos";
import { indicador } from "./ranking";
import { fmt } from "./formato";

const HERDA: [string, string][] = [["ISD (nota TEA)", "c21|nota_isd_letra"], ["Nota do ISD", "c21|nota_isd_score"], ["Alíquota total de imposto", "c24|aliquota_total"], ["Taxas por casa", "c07|taxas_por_casa"],
  ["Lote mínimo", "c06|lote_minimo_sqft"], ["Coberta pela SB 15", "c06|coberta_sb15"], ["Valor típico da casa", "c16|valor_tipico_casa"], ["Preço de venda por sqft", "c16|preco_venda_sqft"],
  ["Dias no mercado (casa)", "c14|dom_casa"], ["Prazo de aprovação", "c08|prazo_aprovacao_dias"], ["Moratória ativa", "c08|moratoria_ativa"], ["Área em zona de alagamento", "c25|pct_area_sfha"]];

export function QuadroRegiao({ base, edicoes, uid }: { base: Base; edicoes: Record<string, Edicao>; uid: string }) {
  return <table className="simples quadro-regiao" id="quadro-regiao"><thead><tr><th>Dado</th><th>Valor</th><th>Fonte</th><th>Data</th></tr></thead><tbody>
    {HERDA.map(([nome, k]) => { const i = indicador(base, edicoes, uid, k); return (
      <tr key={k}><td>{nome}</td><td className={i?.v == null ? "semdado" : ""}>{i?.v == null ? "sem dado" : fmt(i.v, i.um)}</td><td>{i?.v == null ? "" : i.f}</td><td>{i?.v == null ? "" : i.ref}</td></tr>); })}
  </tbody></table>;
}

/** Tela de confirmação da etapa 1: aparece quando a região é escolhida, e é a "ficha" aberta pelo link "ver dados da região" da etapa 2. */
export default function RegiaoEscolhida({ base, edicoes, projeto, ir, voltar }: { base: Base; edicoes: Record<string, Edicao>; projeto: Projeto; ir: (r: string) => void; voltar: () => void }) {
  const u = base.unidades.find((x) => x.unidade_id === projeto.unidade_eleita_id);
  return <main className="vazia regiao-escolhida">
    <button className="voltar solto" onClick={voltar}>← Voltar</button>
    <h1>Região escolhida</h1>
    {!u ? <p className="aviso">Nenhuma região escolhida neste projeto. Escolha uma no resultado da etapa 1 ou informe o seu terreno em "Início".</p> : <>
      <p className="regiao-nome"><b>{u.nome}</b> · {u.condados_pct}</p>
      <section><h2>Dados da região usados nas próximas etapas</h2>
        <QuadroRegiao base={base} edicoes={edicoes} uid={u.unidade_id} />
        <p className="nota">Estes valores são lidos da base pelo ID da região; nenhuma etapa guarda cópia. Onde aparece "sem dado", a etapa correspondente avisa e não inventa valor.</p></section>
      <div className="acoes"><button id="seguir-etapa2" className="primario" onClick={() => ir("etapa-2")}>Seguir para a etapa 2 →</button><button onClick={voltar}>Escolher outra região</button></div></>}
  </main>;
}
