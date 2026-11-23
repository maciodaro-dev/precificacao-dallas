import { describe, it, expect } from "vitest";
import { avaliar, ativas } from "./definicoes";
import type { Base, Projeto, Indicador, Resposta } from "./tipos";

const ind = (v: number | string | null): Indicador => ({ v, um: "", f: "t", url: "", ref: "2026-10-01", col: "2026-11-01", conf: v === null ? "sem_dado" : "alta", obs: "" });
const U = (id: string, tipo: "cidade_isd" | "nao_incorporado" = "cidade_isd") => ({ unidade_id: id, nome: id, tipo, cidade: id, place_geoid: "1", isd_id: "1", isd_nome: "x", condado: "c", condado_fips: "1", condados_pct: "", acres_terra: 1, pct_cidade: 100, lat: 0, lon: 0, fonte: "" });
const base: Base = { gerado_em: "", faixas: [], perfis: [], fontes: [], premissas: [], criterios: [], unidades: [U("a"), U("b"), U("c", "nao_incorporado")],
  indicadores: {
    a: { "c21|nota_isd_letra": ind("A"), "c25|pct_area_sfha": ind(12), "c24|aliquota_total": ind(1.9), "c16|valor_tipico_casa": ind(500000), "c08|moratoria_ativa": ind("nao") },
    b: { "c21|nota_isd_letra": ind("C"), "c25|pct_area_sfha": ind(3), "c24|aliquota_total": ind(2.3), "c16|valor_tipico_casa": ind(900000), "c08|moratoria_ativa": ind("sim") },
    c: { "c21|nota_isd_letra": ind("B") } } };
const proj = (respostas: Record<string, Resposta>): Projeto => ({ projeto_id: "p", nome: "p", criado_em: "", alterado_em: "", faixa_id: "F2", perfil_origem: "", pesos: {}, tamanho: { modo: "maior", min: 0, max: 1 },
  filtros: { isd_min: "", sem_moratoria: false, com_esgoto: false, sfha_max: null, tipo: "todas", cobertura_min: 0, eliminar_sem_dado: false },
  unidade_eleita_id: null, eleita_em: null, margem_alvo_pct: null, juros_aa_pct: null, terrenos: [], casas: [], linhas_custo: [], cronograma: [], respostas });
const de = (ls: ReturnType<typeof avaliar>, id: string) => ls.find((l) => l.u.unidade_id === id)!;

describe("critérios definidos", () => {
  it("número máximo, letra mínima e intervalo", () => {
    const r = avaliar(base, proj({ alagamento: { v: 10 }, isd: { v: "B" }, preco_casa: { min: 400000, max: 600000 } }), {});
    expect(de(r, "a").atendidos).toBe(2); expect(de(r, "a").porCriterio.alagamento.nota).toBe(0);
    expect(de(r, "b").atendidos).toBe(1); expect(r[0].u.unidade_id).toBe("a");
  });
  it("sem dado não conta como atende nem como não atende", () => {
    const c = de(avaliar(base, proj({ alagamento: { v: 10 }, isd: { v: "B" } }), {}), "c");
    expect(c.atendidos).toBe(1); expect(c.avaliados).toBe(1); expect(c.cobertura).toBeCloseTo(0.5);
  });
  it("obrigatório elimina quem não atende", () => {
    const r = avaliar(base, proj({ imposto: { v: 2, obrigatorio: true } }), {});
    expect(de(r, "b").eliminada.length).toBe(1); expect(de(r, "a").posicao).toBe(1); expect(de(r, "c").eliminada.length).toBe(0);
  });
  it("não aceita moratória", () => { const r = avaliar(base, proj({ moratoria: { v: "nao" } }), {}); expect(de(r, "a").atendidos).toBe(1); expect(de(r, "b").atendidos).toBe(0); });
  it("lote pronto = sim desliga os critérios de terra bruta; cenário não avalia", () => {
    expect(ativas(proj({ lote_pronto: { v: "sim" }, etj: { v: "nao" }, rede: { v: "sim" } })).length).toBe(0);
    const r = avaliar(base, proj({ lote_pronto: { v: "nao" }, etj: { v: "nao", obrigatorio: true } }), {});
    expect(de(r, "c").eliminada.length).toBe(1); expect(de(r, "a").atendidos).toBe(1);
  });
  it("prazo em meses é comparado com dias", () => {
    const b2 = { ...base, indicadores: { ...base.indicadores, a: { ...base.indicadores.a, "c08|prazo_aprovacao_dias": ind(100) } } };
    expect(de(avaliar(b2, proj({ prazo: { v: 3 } }), {}), "a").atendidos).toBe(0); expect(de(avaliar(b2, proj({ prazo: { v: 4 } }), {}), "a").atendidos).toBe(1);
  });
});
