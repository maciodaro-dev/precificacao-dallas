import type { Projeto, ValoresAbertos } from "../tipos";

/** Campo que aparece quando a pessoa escolhe uma opção aberta ("mais de X") que entra em cálculo. Sem valor, a conta usa o piso da opção e a tela avisa. */
export default function ValorAberto({ projeto, alterar, campo, piso, rotulo, unidade }: { projeto: Projeto; alterar: (m: Partial<Projeto>) => void; campo: keyof ValoresAbertos; piso: number; rotulo: string; unidade: string }) {
  const v = projeto.valores_abertos?.[campo]; const abaixo = typeof v === "number" && v < piso;
  const gravar = (t: string) => { const n = Number(t.replace(/[^0-9.,]/g, "").replace(",", ".")); const va = { ...projeto.valores_abertos }; if (t.trim() === "" || !isFinite(n) || n <= 0) delete va[campo]; else va[campo] = n; alterar({ valores_abertos: va }); };
  const fmt = (n: number) => (unidade === "US$" ? "$" + n.toLocaleString("pt-BR") : `${n.toLocaleString("pt-BR")} ${unidade}`);
  return (
    <div className="valor-aberto">
      <label>{rotulo} <input id={`va-${campo}`} type="number" min={piso} step="any" value={v ?? ""} placeholder={String(piso)} onChange={(e) => gravar(e.target.value)} /> <small>{unidade}</small></label>
      {v === undefined && <p className="aviso">Sem valor informado, a conta usa o mínimo desta opção: {fmt(piso)}.</p>}
      {abaixo && <p className="aviso">{fmt(v!)} fica abaixo do mínimo da opção marcada ({fmt(piso)}). Corrija o valor ou escolha outra opção.</p>}
    </div>);
}
