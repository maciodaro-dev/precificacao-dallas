import { describe, it, expect } from "vitest";
import { calcular, normalizar, percentil, pesoCorrelacionado, desatualizado } from "./ranking";
import type { Base, Projeto, Indicador } from "./tipos";

const ind = (v: number | string | null): Indicador => ({ v, um: "", f: "t", url: "", ref: "2026-10-01", col: "2026-11-01", conf: v === null ? "sem_dado" : "alta", obs: "" });
const U = (id: string) => ({ unidade_id: id, nome: id, tipo: "cidade_isd" as const, cidade: id, place_geoid: "1", isd_id: "1", isd_nome: "x", condado: "c", condado_fips: "1", condados_pct: "", acres_terra: 1, pct_cidade: 100, lat: 0, lon: 0, fonte: "" });
const base: Base = {
  gerado_em: "", faixas: [], perfis: [], fontes: [], premissas: [], unidades: ["a", "b", "c"].map(U),
  criterios: [
    { id: "c21", grupo: "g", nome: "isd", metrica: "nota_isd_score", unidade_medida: "", direcao: "maior", fonte_planejada: "", cobertura: "", correlacionado: true },
    { id: "c25", grupo: "g", nome: "sfha", metrica: "pct_area_sfha", unidade_medida: "", direcao: "menor", fonte_planejada: "", cobertura: "" },
    { id: "c02", grupo: "g", nome: "tam", metrica: "tamanho_tipico_acres", unidade_medida: "", direcao: "configuravel", fonte_planejada: "", cobertura: "" },
  ],
  indicadores: {
    a: { "c21|nota_isd_score": ind(90), "c21|nota_isd_letra": ind("A"), "c25|pct_area_sfha": ind(10), "c02|tamanho_tipico_acres": ind(1) },
    b: { "c21|nota_isd_score": ind(70), "c21|nota_isd_letra": ind("C"), "c25|pct_area_sfha": ind(0), "c02|tamanho_tipico_acres": ind(5) },
    c: { "c21|nota_isd_score": ind(80), "c21|nota_isd_letra": ind("B"), "c25|pct_area_sfha": ind(null) },
  },
};
const proj = (pesos: Record<string, number>, f: Partial<Projeto["filtros"]> = {}): Projeto => ({
  projeto_id: "p", nome: "p", criado_em: "", alterado_em: "", faixa_id: "F1", perfil_origem: "", pesos, tamanho: { modo: "faixa", min: 0.5, max: 2 },
  filtros: { isd_min: "", sem_moratoria: false, com_esgoto: false, sfha_max: null, tipo: "todas", cobertura_min: 0, eliminar_sem_dado: false, ...f },
  unidade_eleita_id: null, eleita_em: null, margem_alvo_pct: null, juros_aa_pct: null, terrenos: [], casas: [], linhas_custo: [], cronograma: [] });

describe("ranking", () => {
  it("normaliza pesos para somar 1", () => { const n = normalizar({ a: 30, b: 10, c: 0 }); expect(n.a).toBeCloseTo(0.75); expect(n.c).toBeUndefined(); });
  it("percentil interpola", () => expect(percentil([0, 10], 0.5)).toBe(5));
  it("respeita a direção do critério", () => {
    const r = calcular(base, proj({ c21: 1 }), {}); expect(r[0].u.unidade_id).toBe("a");
    const r2 = calcular(base, proj({ c25: 1 }), {}); expect(r2[0].u.unidade_id).toBe("b");
  });
  it("redistribui o peso quando falta dado e informa a cobertura", () => {
    const c = calcular(base, proj({ c21: 1, c25: 1 }), {}).find((l) => l.u.unidade_id === "c")!;
    expect(c.cobertura).toBeCloseTo(0.5); expect(c.porCriterio.c25.nota).toBeNull(); expect(c.nota).not.toBeNull();
  });
  it("filtro eliminatório de ISD mínimo", () => {
    const r = calcular(base, proj({ c21: 1 }, { isd_min: "B" }), {}); const b = r.find((l) => l.u.unidade_id === "b")!;
    expect(b.eliminada.length).toBe(1); expect(b.posicao).toBeNull();
  });
  it("sem dado só elimina se o usuário pedir", () => {
    expect(calcular(base, proj({ c21: 1 }, { sfha_max: 5 }), {}).find((l) => l.u.unidade_id === "c")!.eliminada.length).toBe(0);
    expect(calcular(base, proj({ c21: 1 }, { sfha_max: 5, eliminar_sem_dado: true }), {}).find((l) => l.u.unidade_id === "c")!.eliminada.length).toBe(1);
  });
  it("tamanho com faixa-alvo dá 100 dentro da faixa", () => {
    const r = calcular(base, proj({ c02: 1 }), {}); expect(r.find((l) => l.u.unidade_id === "a")!.nota).toBe(100); expect(r.find((l) => l.u.unidade_id === "b")!.nota).toBe(0);
  });
  it("edição manual substitui o valor da base", () => {
    const r = calcular(base, proj({ c21: 1 }), { "b|c21|nota_isd_score": { v: 99, data: "2026-11-23", original: 70 } }); expect(r[0].u.unidade_id).toBe("b");
  });
  it("soma o peso dos critérios correlacionados", () => expect(pesoCorrelacionado(base, { c21: 50, c25: 50 })).toBeCloseTo(0.5));
  it("sinaliza dado com mais de 6 meses", () => { expect(desatualizado("2025-12-31", new Date("2026-11-23"))).toBe(true); expect(desatualizado("2026-08-15", new Date("2026-11-23"))).toBe(false); });
});
