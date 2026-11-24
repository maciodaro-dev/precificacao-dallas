import type { Base, Edicao, Projeto } from "../tipos";
import { coberturaGeral } from "../parametros";

/** Aviso de cobertura, no fim da tela de resultado: quantos critérios em uso têm dado e quais faltam. Texto cinza, sem caixa. */
export default function AvisoCobertura({ base, projeto, edicoes, guiado }: { base: Base; projeto: Projeto; edicoes: Record<string, Edicao>; guiado?: boolean }) {
  const c = coberturaGeral(base, projeto, edicoes); if (!c.faltam.length) return null;
  return <p className="nota cobertura" id="aviso-cobertura">Este ranking usa {c.usados} de {c.total} critérios. Faltam dados de: {c.faltam.map((p) => (guiado ? p.leigo : p.nome)).join("; ")}. A ordem pode mudar quando esses dados entrarem.</p>;
}
