import type { Projeto } from "../tipos";
import { NIVEIS, NIVEL_PADRAO, type Corte } from "../exigencia";

/** Controle no topo do resultado: "Quanto do que você pediu a região precisa atender?" A escolha fica salva no Projeto. */
export function Exigencia({ projeto, alterar, corte }: { projeto: Projeto; alterar: (m: Partial<Projeto>) => void; corte: Corte }) {
  const n = projeto.exigencia ?? NIVEL_PADRAO;
  return (
    <div className="exigencia nao-imprimir" id="exigencia">
      <span className="pergunta-exig">Quanto do que você pediu a região precisa atender?</span>
      <span className="seg" role="group" aria-label="nível de exigência">{NIVEIS.map((x) => <button key={x.v} id={`exig-${x.v}`} className={n === x.v ? "ativo" : ""} aria-pressed={n === x.v} onClick={() => alterar({ exigencia: x.v })}>{x.rotulo}</button>)}</span>
      {corte.aviso && <p className="nota exig-aviso" id="exig-aviso">{corte.aviso}{corte.sugestao !== null && <> <button className="link" id="exig-trocar" onClick={() => alterar({ exigencia: corte.sugestao! })}>Trocar para {corte.sugestao}% ou mais</button></>}</p>}
    </div>);
}
/** Linha abaixo do ranking: quantas regiões ficaram ocultas pelo nível de exigência, com link para mostrá-las. */
export function LinhaOcultas({ corte, mostrar, setMostrar }: { corte: Corte; mostrar: boolean; setMostrar: (b: boolean) => void }) {
  if (!corte.ocultas.length) return null; const n = corte.ocultas.length;
  return <p className="nota ocultas" id="ocultas">{n} {n === 1 ? "região oculta" : "regiões ocultas"} por {corte.nivel >= 100 ? `não ${n === 1 ? "atender" : "atenderem"} tudo o que você pediu` : `${n === 1 ? "atender" : "atenderem"} menos de ${corte.nivel}% do que você pediu`}. <button className="link" id="mostrar-ocultas" onClick={() => setMostrar(!mostrar)}>{mostrar ? "Ocultar de novo" : "Mostrar"}</button></p>;
}
