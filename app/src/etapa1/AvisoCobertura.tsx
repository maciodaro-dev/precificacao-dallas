import type { Base, Edicao, Projeto } from "../tipos";
import { coberturaGeral } from "../parametros";

/** Aviso no topo do resultado: quantos parâmetros em uso têm dado e quais faltam. No modo guiado, em linguagem comum. */
export default function AvisoCobertura({ base, projeto, edicoes, guiado }: { base: Base; projeto: Projeto; edicoes: Record<string, Edicao>; guiado?: boolean }) {
  const c = coberturaGeral(base, projeto, edicoes); if (!c.faltam.length) return null;
  return guiado
    ? <p className="aviso" id="aviso-cobertura"><b>Esta lista ainda está incompleta.</b> Das {c.total} coisas que as suas respostas pedem, só {c.usados} já têm informação para comparar as regiões. Ainda falta informação sobre: {c.faltam.map((p) => p.leigo).join("; ")}. A ordem das regiões pode mudar quando essa informação entrar.</p>
    : <p className="aviso" id="aviso-cobertura"><b>Este ranking usa {c.usados} de {c.total} parâmetros.</b> Faltam dados de: {c.faltam.map((p) => p.nome).join("; ")}. A ordem pode mudar quando esses dados entrarem.</p>;
}
