import type { Base, Edicao } from "./tipos";
import { indicador } from "./ranking";

/** Fontes e datas dos dados usados num resultado, mais o aviso. Aparece em toda tela de resultado. */
export default function FontesUsadas({ base, edicoes, unidades, chaves }: { base: Base; edicoes: Record<string, Edicao>; unidades: string[]; chaves: string[] }) {
  const m = new Map<string, string>();
  for (const u of unidades) for (const k of chaves) { const i = indicador(base, edicoes, u, k); if (i?.v != null && i.f) { const d = m.get(i.f); if (!d || i.ref > d) m.set(i.f, i.ref); } }
  const nome = (f: string) => (f === "usuario" ? "valor digitado por você" : f === "derivado" ? "cálculo da ferramenta" : base.fontes.find((x) => x.id === f)?.nome ?? f);
  return (
    <div className="fontes-usadas">
      <b>Fontes e datas dos dados deste resultado:</b> {m.size === 0 ? "nenhum dos critérios escolhidos tem dado ainda." : [...m].sort().map(([f, d]) => `${nome(f)} (${d})`).join(" · ")}
      <br />Apoio à decisão: não é recomendação de investimento nem avaliação de imóvel.
    </div>
  );
}
