import type { Base, Edicao, Projeto } from "../tipos";
import { indicador, type Linha } from "../ranking";
import { fmt } from "../formato";
import Detalhe from "./Detalhe";
import FontesUsadas from "../Fontes";

// Caminho "já sei onde quero construir": escolhe a cidade e vê tudo o que essa escolha significa.
const GRUPOS: [string, [string, string][]][] = [
  ["Custo", [["Property tax total", "c24|aliquota_total"], ["Taxas por casa (impact fees, permit)", "c07|taxas_por_casa"], ["Lote mínimo exigido", "c06|lote_minimo_sqft"], ["Coberta pela SB 15 (lote de 3.000 sqft)", "c06|coberta_sb15"], ["Valor típico da casa", "c16|valor_tipico_casa"]]],
  ["Tempo", [["Prazo de aprovação", "c08|prazo_aprovacao_dias"], ["Moratória ativa", "c08|moratoria_ativa"], ["Dias no mercado (casa)", "c14|dom_casa"], ["Casas novas licenciadas por ano", "c15|permits_unifamiliares_ano"]]],
  ["Comprador", [["Nota do ISD (TEA)", "c21|nota_isd_letra"], ["Pontuação do ISD", "c21|nota_isd_score"], ["Renda mediana", "c23|renda_mediana"], ["Preço da casa ÷ renda", "c23|preco_renda"], ["Segurança", "c22|seguranca_texto"], ["Minutos até o polo de emprego mais próximo", "c19|min_polo_mais_proximo"]]],
  ["Risco e valorização", [["Área em zona de alagamento (FEMA)", "c25|pct_area_sfha"], ["Seguro médio", "c26|seguro_medio"], ["Valorização em 5 anos", "c18|valorizacao_5a"]]],
];
interface P { base: Base; projeto: Projeto; edicoes: Record<string, Edicao>; linhas: Linha[]; sel: string | null; setSel: (s: string | null) => void;
  editar: (u: string, k: string, v: number | string | null | undefined) => void; eleger: (id: string) => void; irParaEtapa2: () => void }

export default function Cidade({ base, projeto, edicoes, linhas, sel, setSel, editar, eleger, irParaEtapa2 }: P) {
  const cidades = [...new Set(base.unidades.map((u) => u.cidade))].sort((a, b) => a.localeCompare(b));
  const atual = base.unidades.find((u) => u.unidade_id === sel);
  const daCidade = atual ? base.unidades.filter((u) => u.cidade === atual.cidade) : [];
  const linha = linhas.find((l) => l.u.unidade_id === sel) ?? null;
  const semDado = atual ? GRUPOS.flatMap((g) => g[1]).filter(([, k]) => indicador(base, edicoes, atual.unidade_id, k)?.v == null).length : 0;
  return (
    <main>
      <div className="cab-passo"><div><h1>Onde você quer construir?</h1><p>Escolha a cidade e veja tudo o que essa escolha significa em custo, prazo, comprador e risco.</p></div></div>
      <div className="escolha-cidade">
        <label>Cidade <select id="cidade-escolhida" value={atual?.cidade ?? ""} onChange={(e) => setSel(base.unidades.find((u) => u.cidade === e.target.value)?.unidade_id ?? null)}>
          <option value="">escolha…</option>{cidades.map((c) => <option key={c}>{c}</option>)}</select></label>
        {daCidade.length > 1 && <div className="isds"><span>Distrito escolar (ISD):</span>
          {daCidade.map((u) => <button key={u.unidade_id} className={u.unidade_id === sel ? "ativo" : ""} onClick={() => setSel(u.unidade_id)}>{u.isd_nome}{u.pct_cidade != null && <small> {fmt(u.pct_cidade)}% da cidade</small>}</button>)}</div>}
      </div>
      {daCidade.length > 1 && <p className="nota">Esta cidade é atendida por mais de um ISD. O ISD muda a nota da escola e o imposto, então cada combinação é tratada como um lugar diferente.</p>}
      {!atual && <p className="vazio">Escolha uma cidade para ver o que ela significa para o projeto.</p>}
      {atual && linha && <>
        <div className="significa">
          {GRUPOS.map(([g, itens]) => <section key={g}><h3>{g}</h3>
            {itens.map(([nome, k]) => { const i = indicador(base, edicoes, atual.unidade_id, k); return (
              <div key={k} className="item"><span>{nome}</span><b className={i?.v == null ? "semdado" : ""}>{i?.v == null ? "sem dado" : fmt(i.v, i.um)}</b></div>); })}
          </section>)}
        </div>
        <FontesUsadas base={base} edicoes={edicoes} unidades={[atual.unidade_id]} chaves={GRUPOS.flatMap((g) => g[1]).map(([, k]) => k)} />
        {semDado > 0 && <p className="aviso">{semDado} destes dados ainda não existem para esta cidade. Enquanto estiverem vazios, os custos e prazos correspondentes não entram nas contas das próximas etapas; você pode preenchê-los no detalhe abaixo.</p>}
        {linha.nota !== null && <p className="nota">Pelos parâmetros deste projeto, esta escolha tem nota {linha.nota.toFixed(0)} e fica em {linha.posicao}º lugar entre {linhas.length} unidades.</p>}
        <Detalhe key={atual.unidade_id} base={base} projeto={projeto} edicoes={edicoes} linha={linha} editar={editar} fechar={() => setSel(null)} eleger={eleger} irParaEtapa2={irParaEtapa2}
          emComparacao={false} alternar={() => {}} semRolagem />
      </>}
    </main>
  );
}
