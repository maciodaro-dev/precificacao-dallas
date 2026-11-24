import type { Base, Edicao, Projeto } from "./tipos";
import { indicador } from "./ranking";
import { fmt } from "./formato";

export const ETAPAS = [
  { n: 1, nome: "Território", le: "", grava: "" },
  { n: 2, nome: "Aquisição do terreno", le: "Unidade eleita do projeto; preço da terra (c01), alíquotas (c24) e alagamento (c25) da unidade; premissas.",
    grava: "Terrenos candidatos; linhas de custo da etapa 2 (preço, closing, title, survey); due diligence do terreno (zona FEMA do lote, laudo de solo, easements, deed restrictions/HOA, acesso, distância da rede, direitos minerais, rollback tax de isenção agrícola, área mínima para fossa); marcos de due diligence e fechamento. Para terreno já possuído: preço pago, data da compra e valor de mercado atual." },
  { n: 3, nome: "Aprovações e projeto", le: "Zoneamento e lote mínimo (c06), taxas por casa (c07), prazo de aprovação (c08), água e esgoto (c09) da unidade; terreno.",
    grava: "Casas do projeto; linhas de custo da etapa 3 (platting, uso permitido, engenharia, arquitetura, permits, impact fees); marcos de aprovação. A etapa tem duas partes, aprovações da prefeitura e projeto da casa, e pode ficar parcialmente realizada." },
  { n: 4, nome: "Preparação do lote", le: "Custo de lotear (c10), água e esgoto (c09), alagamento (c25); terreno e casas.",
    grava: "Linhas de custo da etapa 4 (terraplenagem, redes, rua, drenagem, ligações); marcos de infraestrutura." },
  { n: 5, nome: "Construção", le: "Casas (sqft, padrão de acabamento, fundação); premissas de custo por sqft.", grava: "Linhas de custo da etapa 5, incluindo contingência; marcos de obra." },
  { n: 6, nome: "Carregamento", le: "Durações do cronograma; dias no mercado (c14), alíquota (c24) e seguro (c26) da unidade; soma das etapas 2 a 5; juros do projeto.",
    grava: "Linhas de custo da etapa 6 (juros, imposto, seguro, overhead), calculadas por fórmula e refeitas quando prazo ou custo muda. Conta só o prazo que falta (o tempo desde a compra de um terreno já possuído não entra) e, em construção \"em sequência\", o custo da terra parada entre uma casa e outra. Aqui entra a opção de contar o tempo de compra do terreno como custo." },
  { n: 7, nome: "Venda e entrega", le: "Preço de mercado (c16) e dias no mercado (c14) da unidade; casas.", grava: "Linhas de custo da etapa 7 (comissão, closing do vendedor, concessões, garantia, marketing)." },
  { n: 8, nome: "Preço final", le: "Todas as linhas de custo, margem alvo do projeto, preço de mercado da unidade, vendas de referência.",
    grava: "A meta de margem. Mostra preço por custo (mín/provável/máx) ao lado do preço de mercado, a diferença, a margem resultante e a sensibilidade. Com terreno já possuído, a margem aparece sobre o preço pago e sobre o valor atual." },
];
const HERDA: [string, string][] = [["ISD (nota TEA)", "c21|nota_isd_letra"], ["Nota do ISD", "c21|nota_isd_score"], ["Alíquota total de imposto", "c24|aliquota_total"], ["Taxas por casa", "c07|taxas_por_casa"],
  ["Lote mínimo", "c06|lote_minimo_sqft"], ["Coberta pela SB 15", "c06|coberta_sb15"], ["Valor típico da casa", "c16|valor_tipico_casa"], ["Preço de venda por sqft", "c16|preco_venda_sqft"],
  ["Dias no mercado (casa)", "c14|dom_casa"], ["Prazo de aprovação", "c08|prazo_aprovacao_dias"], ["Moratória ativa", "c08|moratoria_ativa"], ["Área em zona de alagamento", "c25|pct_area_sfha"]];

export default function EtapaVazia({ n, base, projeto, edicoes, situacao }: { n: number; base: Base; projeto: Projeto; edicoes: Record<string, Edicao>; situacao: string | null }) {
  const lancados = projeto.linhas_custo.filter((l) => l.etapa === n && l.realizado !== undefined && l.origem === "ponto_partida");
  const e = ETAPAS[n - 1]; const u = base.unidades.find((x) => x.unidade_id === projeto.unidade_eleita_id);
  return (
    <main className="vazia">
      <h1>Etapa {n} — {e.nome}</h1>
      <p className="aviso">Esta etapa ainda não foi construída. O esquema de dados já existe; a tela será feita depois que a etapa anterior for validada.</p>
      {situacao && <section><h2>Situação no seu projeto: {situacao}</h2>
        {lancados.length === 0 ? <p>Nada foi lançado como já realizado nesta etapa.</p> : <table className="simples"><thead><tr><th>Item</th><th>Realizado</th><th>Data</th><th>Fonte</th></tr></thead><tbody>
          {lancados.map((l) => <tr key={l.linha_id}><td>{l.categoria}</td><td className={l.realizado == null ? "semdado" : ""}>{l.realizado == null ? "valor não informado" : "$" + l.realizado.toLocaleString("pt-BR")}</td><td>{l.data}</td><td>{l.fonte}</td></tr>)}</tbody></table>}
        <p className="nota">Estas respostas vêm do ponto de partida e podem ser alteradas lá, em "Início", sem perder o que foi lançado.</p></section>}
      <div className="duas">
        <section><h2>O que esta etapa lê</h2><p>{e.le}</p></section>
        <section><h2>O que esta etapa grava</h2><p>{e.grava}</p></section>
      </div>
      <section>
        <h2>Herdado da região do projeto</h2>
        {!u ? <p>Nenhuma região escolhida neste projeto. Escolha uma na etapa 1 ou informe o seu terreno em "Início".</p> : (
          <>
            <p><b>{u.nome}</b> · {u.condados_pct} · ID {u.unidade_id}</p>
            <table className="simples"><thead><tr><th>Dado</th><th>Valor</th><th>Fonte</th><th>Data</th></tr></thead><tbody>
              {HERDA.map(([nome, k]) => { const i = indicador(base, edicoes, u.unidade_id, k); return (
                <tr key={k}><td>{nome}</td><td className={i?.v == null ? "semdado" : ""}>{i?.v == null ? "sem dado" : fmt(i.v, i.um)}</td><td>{i?.v == null ? "" : i.f}</td><td>{i?.v == null ? "" : i.ref}</td></tr>); })}
            </tbody></table>
            <p className="nota">Estes valores são lidos da base pelo ID da unidade; nenhuma etapa guarda cópia.</p>
          </>)}
      </section>
    </main>
  );
}
