import { describe, it, expect } from "vitest";
import { paraRegiao } from "./ranking";
import { avaliar, coberturaGeral, nota, PARAMS, pesoTerreno, textoCobertura } from "./parametros";
import { deduzir, mesclar, projetoDoLeigo } from "./leigo";
import type { Base, Projeto, Indicador, ParamResp } from "./tipos";

const ind = (v: number | string | null): Indicador => ({ v, um: "", f: "t", url: "", ref: "2026-10-01", col: "2026-11-01", conf: v === null ? "sem_dado" : "alta", obs: "" });
const U = (id: string, tipo: "cidade_isd" | "nao_incorporado" = "cidade_isd") => ({ unidade_id: id, nome: id, tipo, cidade: id, place_geoid: "1", isd_id: "1", isd_nome: "x", condado: "c", condado_fips: "1", condados_pct: "", acres_terra: 1, pct_cidade: 100, lat: 0, lon: 0, fonte: "" });
const base: Base = { gerado_em: "", fontes: [], premissas: [], criterios: [], faixas: [{ id: "F2", nome: "$100–500 mil", min: 100000, max: 500000 }], unidades: [U("a"), U("b"), U("c", "nao_incorporado")],
  indicadores: {
    a: { "c21|nota_isd_letra": ind("A"), "c25|pct_area_sfha": ind(12), "c24|aliquota_total": ind(1.9), "c08|moratoria_ativa": ind("nao") },
    b: { "c21|nota_isd_letra": ind("C"), "c25|pct_area_sfha": ind(3), "c24|aliquota_total": ind(2.3), "c08|moratoria_ativa": ind("sim") },
    c: { "c21|nota_isd_letra": ind("B") } } };
const P = (alvo: ParamResp["alvo"], peso: ParamResp["peso"] = "medio"): ParamResp => ({ alvo, peso, origem: "manual" });
const proj = (parametros: Record<string, ParamResp>, extra: Partial<Projeto> = {}): Projeto => ({ projeto_id: "p", nome: "p", criado_em: "", alterado_em: "", faixa_id: "F2",
  unidade_eleita_id: null, eleita_em: null, margem_alvo_pct: null, juros_aa_pct: null, terrenos: [], casas: [], linhas_custo: [], cronograma: [], parametros, ...extra });
const de = (ls: ReturnType<typeof avaliar>, id: string) => ls.find((l) => l.u.unidade_id === id)!;
const par = (id: string) => PARAMS.find((p) => p.id === id)!;

describe("motor único", () => {
  it("nenhuma unidade é eliminada e todas aparecem ordenadas pela nota", () => {
    const r = avaliar(base, proj({ isd: P({ valor: "A" }, "alto"), moratoria: P({ valor: "nao" }, "alto"), limites: P({ valor: "nao" }, "alto") }), {});
    expect(r.length).toBe(3); expect(r.every((l) => l.posicao !== null)).toBe(true); expect(r[0].u.unidade_id).toBe("a");
    expect(r.map((l) => l.nota!)).toEqual([...r.map((l) => l.nota!)].sort((x, y) => y - x));
  });
  it("sim/não vale nota cheia ou zero", () => { expect(nota(par("moratoria"), { valor: "nao" }, U("a"), ind("nao"))).toBe(1); expect(nota(par("moratoria"), { valor: "nao" }, U("a"), ind("sim"))).toBe(0); });
  it("valor escolhido: nota cheia se atende, caindo com a distância", () => {
    const p = par("imposto"); expect(nota(p, { max: 2 }, U("a"), ind(1.9))).toBe(1); expect(nota(p, { max: 2 }, U("a"), ind(2.3))).toBeCloseTo(0.85); expect(nota(p, { max: 2 }, U("a"), ind(5))).toBe(0);
    expect(nota(par("renda"), { min: 100000 }, U("a"), ind(80000))).toBeCloseTo(0.8);
    expect(nota(par("isd"), { valor: "B" }, U("a"), ind("C"))).toBe(0.5); expect(nota(par("isd"), { valor: "B" }, U("a"), ind("A"))).toBe(1);
    expect(nota(par("prazo"), { max: 6 }, U("a"), ind(270))).toBeCloseTo(0.5);
  });
  it("lista o que a unidade não atende, do peso maior para o menor", () => {
    const b = de(avaliar(base, proj({ isd: P({ valor: "A" }, "baixo"), imposto: P({ max: 2 }, "alto"), alagamento: P({ max: 10 }) }), {}), "b");
    expect(b.falhas!.map((f) => f.id)).toEqual(["imposto", "isd"]);
  });
  it("sem dado recebe nota neutra e não entra na lista de não atende; parâmetro sem dado em nenhuma unidade fica fora da conta", () => {
    const r = avaliar(base, proj({ imposto: P({ max: 2 }), taxas: P({ max: 10000 }, "alto") }), {});
    expect(de(r, "c").nota).toBe(50); expect(de(r, "c").falhas!.length).toBe(0); expect(de(r, "a").nota).toBe(100); expect(de(r, "a").porCriterio.taxas.peso).toBe(0);
  });
  it("peso muda a ordem", () => {
    const x = avaliar(base, proj({ alagamento: P({ max: 5 }, "alto"), isd: P({ valor: "A" }, "baixo") }), {}); expect(de(x, "b").nota!).toBeGreaterThan(de(x, "a").nota!);
    const y = avaliar(base, proj({ alagamento: P({ max: 5 }, "baixo"), isd: P({ valor: "A" }, "alto") }), {}); expect(de(y, "a").nota!).toBeGreaterThan(de(y, "b").nota!);
  });
  it("peso do terreno no preço e alerta acima de 25%", () => {
    const t = pesoTerreno(base, proj({}, { n_casas: 1, preco_venda: { min: 300000, max: 500000 } })); expect(t.pct).toBeCloseTo(75); expect(t.alerta).toBe(true);
    expect(pesoTerreno(base, proj({}, { n_casas: 7, preco_venda: { min: 300000, max: 500000 } })).alerta).toBe(false);
  });
  it("peso do terreno: mostra o intervalo da faixa, explica o que fazer e não calcula sem faixa escolhida", () => {
    const t = pesoTerreno(base, proj({}, { n_casas: 1, preco_venda: { min: 300000, max: 500000 } })); expect(t.min).toBeCloseTo(25); expect(t.max).toBeCloseTo(125);
    expect(t.oQueFazer).toMatch(/reduza o investimento no terreno, aumente o nº de casas ou suba o preço de venda/);
    const s = pesoTerreno(base, proj({}, { faixa_id: null, n_casas: 1, preco_venda: { min: 300000, max: 500000 } })); expect(s.semFaixa).toBe(true); expect(s.pct).toBeNull(); expect(s.alerta).toBe(false);
  });
  it("cobertura conta todos os parâmetros em uso, inclusive os que não têm dado em nenhuma unidade", () => {
    // em uso: terreno na faixa (sem dado), imposto (peso médio = 2), taxas (peso alto = 3, sem dado). Peso total 3 + 2 + 3 = 8.
    const pr = proj({ imposto: P({ max: 2 }), taxas: P({ max: 10000 }, "alto") }); const r = avaliar(base, pr, {});
    expect(de(r, "a").cobertura).toBeCloseTo(2 / 8); expect(de(r, "a").avaliados).toBe(1); expect(de(r, "a").emUso).toBe(3); expect(textoCobertura(de(r, "a"))).toBe("25% (1 de 3)");
    expect(de(r, "c").cobertura).toBe(0);
    const g = coberturaGeral(base, pr, {}); expect(g.usados).toBe(1); expect(g.total).toBe(3); expect(g.faltam.map((x) => x.id).sort()).toEqual(["faixa", "taxas"]);
  });
  it("moratória sem dado não pontua: nem cheia, nem zero, nem metade", () => {
    const r = avaliar(base, proj({ isd: P({ valor: "B" }), moratoria: P({ valor: "nao" }, "alto") }), {});
    expect(de(r, "c").nota).toBe(100); // só o ISD conta para "c", e ela atende
    expect(de(r, "c").porCriterio.moratoria.nota).toBeNull(); expect(de(r, "a").nota).toBe(100); expect(de(r, "b").nota).toBeCloseTo(20); // b: ISD C vale metade (peso 2), moratória "sim" vale zero (peso 3)
  });
});
describe("região e pergunta da escola", () => {
  // cidade "le" com duas partes: ISD "A" (30% da área, imposto 1,7) e ISD "C" (70%, imposto 2,1). Na região: ISD principal C, imposto médio 1,98.
  const le = { ...U("le"), partes: [{ parte_id: "le-c", isd_id: "1", isd_nome: "Little ISD", acres: 70, pct_area: 70, pct_domicilios: 70, pequena: false }, { parte_id: "le-a", isd_id: "2", isd_nome: "Frisco ISD", acres: 30, pct_area: 30, pct_domicilios: 30, pequena: false }] };
  const b2: Base = { ...base, unidades: [le, U("x")], partes: [{ ...U("le-c"), regiao_id: "le" }, { ...U("le-a"), regiao_id: "le" }],
    indicadores: { le: { "c21|nota_isd_letra": ind("C"), "c24|aliquota_total": ind(1.98), "c23|renda_mediana": { ...ind(90000), f: "census_acs" } }, "le-a": { "c21|nota_isd_letra": ind("A"), "c24|aliquota_total": ind(1.7) }, "le-c": { "c24|aliquota_total": ind(2.1) },
      x: { "c21|nota_isd_letra": ind("B"), "c24|aliquota_total": ind(1.9), "c23|renda_mediana": ind(90000) } } };
  it("pedindo nota A, vale só a parte da cidade que tem nota A, com o imposto dessa parte", () => {
    const l = de(avaliar(b2, proj({ isd: P({ valor: "A" }, "alto"), imposto: P({ max: 1.8 }), renda: P({ min: 75000 }) }), {}), "le");
    expect(l.recorte!.partes.map((x) => x.parte_id)).toEqual(["le-a"]); expect(l.recorte!.texto).toMatch(/só a parte no Frisco ISD \(30% da área da cidade\)/);
    expect(l.porCriterio.isd.nota).toBe(100); expect(l.porCriterio.imposto.bruto).toBeCloseTo(1.7); expect(l.porCriterio.imposto.nota).toBe(100);
    expect(l.porCriterio.renda.esc).toBe("cidade"); // renda só existe para a cidade inteira
  });
  it("sem pedir escola, ou se nenhuma parte atende, vale a região inteira", () => {
    const s = de(avaliar(b2, proj({ imposto: P({ max: 1.8 }) }), {}), "le"); expect(s.recorte).toBeUndefined(); expect(s.porCriterio.imposto.bruto).toBeCloseTo(1.98);
    const pequena: Base = { ...b2, unidades: [{ ...le, partes: le.partes!.map((x) => (x.parte_id === "le-a" ? { ...x, pequena: true } : x)) }, U("x")] };
    const n = de(avaliar(pequena, proj({ isd: P({ valor: "A" }, "alto") }), {}), "le"); expect(n.recorte).toBeUndefined(); expect(n.porCriterio.isd.nota).toBe(0); expect(n.falhas.map((f) => f.id)).toContain("isd");
  });
  it("id antigo de cidade × ISD vira o id da região", () => { expect(paraRegiao("U-4843012-4820010")).toBe("R-4843012"); expect(paraRegiao("U-ETJ-48085-4808340")).toBe("R-ETJ-48085"); expect(paraRegiao("R-4843012")).toBe("R-4843012"); expect(paraRegiao(null)).toBeNull(); });
});
describe("modo leigo", () => {
  it("1 casa: lote pronto, até 0,5 acre, só dentro da cidade, custo de lotear não se aplica", () => {
    const d = deduzir({ casas: "1" }); expect(d.lote_pronto.alvo).toEqual({ valor: "sim" }); expect(d.tamanho.alvo).toEqual({ max: 0.5 }); expect(d.limites.alvo).toEqual({ valor: "nao" }); expect(d.custo_lotear.alvo).toBeNull();
  });
  it("padrões: sem moratória, escola B ou melhor, rede pública, 60 dias, renda = preço / 3,5", () => {
    const d = deduzir({}); expect(d.moratoria.alvo).toEqual({ valor: "nao" }); expect(d.isd).toMatchObject({ alvo: { valor: "B" }, peso: "alto", origem: "escola" });
    expect(d.rede.alvo).toEqual({ valor: "sim" }); expect(d.dom).toMatchObject({ alvo: { max: 60 }, peso: "alto" }); expect(d.renda.alvo).toEqual({ min: 125000 }); expect(d.seguranca.peso).toBe("alto");
  });
  it("mais de 10 casas: 5 acres ou mais, peso alto em custo de lotear, taxas e prazo", () => {
    const d = deduzir({ casas: "mais10" }); expect(d.tamanho.alvo).toEqual({ min: 5 }); expect([d.custo_lotear.peso, d.taxas.peso, d.prazo.peso]).toEqual(["alto", "alto", "alto"]);
  });
  it("uma de cada vez: liquidez do terreno alta, custo de lotear baixo, tamanho mantido", () => {
    const d = deduzir({ casas: "5a10", construcao: "sequencia" }); expect(d.liquidez_terreno.peso).toBe("alto"); expect(d.custo_lotear.peso).toBe("baixo"); expect(d.tamanho.alvo).toEqual({ min: 1, max: 20 });
    expect(projetoDoLeigo({ casas: "5a10", construcao: "sequencia" }, proj({})).construcao).toBe("sequencia");
  });
  it("aceita esperar: prazo de 12 meses e libera fora da cidade; não vender rápido: 120 dias com peso baixo", () => {
    const d = deduzir({ comecar_logo: false, vender_rapido: false }); expect(d.prazo.alvo).toEqual({ max: 12 }); expect(d.limites.alvo).toBeNull(); expect(d.dom).toMatchObject({ alvo: { max: 120 }, peso: "baixo" });
  });
  it("ajuste manual não é sobrescrito e o conflito é informado", () => {
    const manual: ParamResp = { alvo: { valor: "A" }, peso: "alto", origem: "manual", ajustado: true };
    const m = mesclar(deduzir({ escola: true }), { isd: manual }); expect(m.parametros.isd).toBe(manual); expect(m.conflitos.map((c) => c.id)).toEqual(["isd"]);
    expect(mesclar(deduzir({}), { isd: { ...deduzir({}).isd, ajustado: true } }).conflitos.length).toBe(0);
  });
});
