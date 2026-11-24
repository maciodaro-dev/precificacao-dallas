import { describe, it, expect } from "vitest";
import { retrato } from "./retrato";
import type { Base, Indicador } from "./tipos";

const ind = (v: number | string): Indicador => ({ v, um: "", f: "t", url: "", ref: "2026-10-01", col: "2026-11-01", conf: "alta", obs: "" });
const ids = Array.from({ length: 10 }, (_, i) => "u" + i);
const base = { unidades: ids.map((id) => ({ unidade_id: id })), indicadores: Object.fromEntries(ids.map((id, i) => [id, { "c21|nota_isd_score": ind(70 + i * 3), "c24|aliquota_total": ind(1.5 + i * 0.1) }])) } as unknown as Base;

describe("retrato da unidade", () => {
  it("melhor quarto vira ponto forte e pior quarto vira ponto de atenção, respeitando a direção", () => {
    const melhor = retrato(base, {}, "u9"); expect(melhor.fortes.map((p) => p.nome)).toEqual(["Escola (nota do distrito)"]); expect(melhor.atencao.map((p) => p.nome)).toEqual(["Imposto anual do imóvel"]);
    const pior = retrato(base, {}, "u0"); expect(pior.atencao.map((p) => p.nome)).toEqual(["Escola (nota do distrito)"]); expect(pior.fortes.map((p) => p.nome)).toEqual(["Imposto anual do imóvel"]);
  });
  it("lista o que não tem dado e não inventa posição", () => { const r = retrato(base, {}, "u5"); expect(r.semDado).toContain("Dias para vender a casa"); expect(r.fortes.length + r.atencao.length).toBe(0); expect(r.neutros.length).toBe(2); });
  it("moratória ativa entra como ponto de atenção", () => {
    const b2 = { ...base, indicadores: { ...base.indicadores, u5: { ...base.indicadores.u5, "c08|moratoria_ativa": ind("sim") } } } as Base; expect(retrato(b2, {}, "u5").atencao[0].nome).toBe("Moratória");
  });
});
