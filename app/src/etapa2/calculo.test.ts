import { describe, expect, it } from "vitest";
import type { Base, Projeto, Terreno } from "../tipos";
import { financiamento, linhasDe, parcela, perguntas, precoEmUso, refVelha, resumoTerreno, seguroTitulo, verificarPrimeiro, triagemDe } from "./calculo";

const base = { referencias: [
  { id: "survey", nome: "Survey", min: 400, provavel: 700, max: 1800, unidade: "US$", confianca: "media", geografia: "DFW", data: "2026-11-24", fontes: [] },
  { id: "tri_servidoes", nome: "x", min: 0, provavel: 1000, max: 5000, unidade: "US$", confianca: "baixa", geografia: "Texas", data: "2026-11-24", fontes: [] },
  { id: "sinal_pct", nome: "Sinal", min: 1, provavel: 1, max: 3, unidade: "% do preço", confianca: "media", geografia: "Texas", data: "2026-11-24", fontes: [] },
] } as unknown as Base;
const pr = { n_casas: 2 } as Projeto;
const t = (m: Partial<Terreno> = {}): Terreno => ({ terreno_id: "T-1", unidade_id: "", endereco: "1 Main St", parcel_id: "", acres: 0.25, preco_pedido: 200000, isd_id_proprio: null, mud_pid: null, isencao_agricola: false, status: "candidato", ...m });

describe("seguro de título (tabela do TDI)", () => {
  it("usa a tabela até US$ 100 mil", () => { expect(seguroTitulo(25000)).toBe(308); expect(seguroTitulo(100000)).toBe(780); expect(seguroTitulo(99600)).toBe(780); });
  it("usa a fórmula acima de US$ 100 mil", () => { expect(seguroTitulo(200000)).toBe(Math.round(100000 * 0.00494) + 780); expect(seguroTitulo(1500000)).toBe(Math.round(500000 * 0.00406) + 5226); });
  it("sem preço, não calcula", () => { expect(seguroTitulo(0)).toBeNull(); });
});
describe("pagamento", () => {
  it("parcela fixa", () => { expect(parcela(100000, 6, 120)!).toBeCloseTo(1110.21, 1); expect(parcela(1200, 0, 12)).toBe(100); });
  it("financiamento: entrada ou valor financiado, total de juros e saldo zerando", () => {
    const f = financiamento(200000, { pagamento: { forma: "financiado", entrada: 40000, juros_aa_pct: 7.5, parcelas: 180 } })!;
    expect(f.financiado).toBe(160000); expect(f.saldo).toHaveLength(180); expect(f.saldo[179].saldo).toBeLessThan(0.01); expect(f.totalJuros).toBeCloseTo(f.parcela * 180 - 160000, 6);
    expect(financiamento(200000, { pagamento: { forma: "a_vista" } })).toBeNull();
  });
});
describe("preço em uso", () => {
  it("fechado > oferta > anunciado", () => {
    expect(precoEmUso(t())).toEqual({ valor: 200000, tipo: "anunciado" }); expect(precoEmUso(t({ e2: { oferta: 180000 } }))!.tipo).toBe("oferta");
    expect(precoEmUso(t({ e2: { oferta: 180000, preco_fechado: 185000 } }))).toEqual({ valor: 185000, tipo: "fechado" }); expect(precoEmUso(t({ preco_pedido: null }))).toBeNull();
  });
});
describe("pilha de custos", () => {
  it("o valor informado pelo usuário vale sobre a referência; linha sem fonte fica sem valor e é listada", () => {
    const l = linhasDe(base, t({ e2: { custos: { survey: { min: 900, provavel: 900, max: 900, data: "2026-11-24" } } } }));
    expect(l.find((x) => x.linha.id === "survey")!.origem).toBe("informado por mim"); expect(linhasDe(base, t()).find((x) => x.linha.id === "survey")!.origem).toBe("estimativa de referência");
    expect(l.find((x) => x.linha.id === "titulo")!.origem).toBe("tabela oficial"); expect(l.find((x) => x.linha.id === "solo")!.origem).toBe("sem valor");
    const r = resumoTerreno(base, pr, t()); expect(r.semValor).toContain("Laudo de solo"); expect(r.completo).toBe(false);
  });
  it("sinal em % do preço não soma ao total; fossa só sem rede; financiamento só se financiado", () => {
    const l = linhasDe(base, t()); const s = l.find((x) => x.linha.id === "sinal")!; expect(s.valor!.provavel).toBe(2000); expect(s.linha.naoSoma).toBe(true);
    expect(l.find((x) => x.linha.id === "fossa_teste")!.aplica).toBe(false); expect(linhasDe(base, t({ e2: { agua_esgoto: "poco_fossa" } })).find((x) => x.linha.id === "fossa_teste")!.aplica).toBe(true);
    const r = resumoTerreno(base, pr, t()); expect(r.aquisicao.provavel).toBe(200000 + seguroTitulo(200000)! + 700);
  });
  it("problema confirmado soma ao risco; 'não sei' só entra no máximo; por casa divide pelo número de casas", () => {
    const r = resumoTerreno(base, pr, t({ e2: { triagem: { servidoes: { resposta: "problema" }, zoneamento: { resposta: "ok" } } } }));
    expect(r.riscoConfirmado.provavel).toBe(1000); expect(r.resultado).toBe("condicoes"); expect(r.porCasa.provavel).toBe(r.comRisco.provavel! / 2);
    const n = resumoTerreno(base, pr, t({ e2: { triagem: { servidoes: { resposta: "nao_sei" } } } }));
    expect(n.riscoConfirmado.provavel).toBe(0); expect(n.exposicao.max).toBe(5000); expect(n.comRisco.max).toBe(n.aquisicao.max! + 5000); expect(n.comRisco.provavel).toBe(n.aquisicao.provavel);
  });
  it("pode inviabilizar: zoneamento, acesso e lote inteiro em floodway", () => {
    expect(resumoTerreno(base, pr, t({ e2: { triagem: { acesso: { resposta: "problema" } } } })).resultado).toBe("inviabilizar");
    expect(resumoTerreno(base, pr, t({ e2: { triagem: { alagamento: { resposta: "problema" } } } })).resultado).toBe("condicoes");
    expect(resumoTerreno(base, pr, t({ e2: { floodway_total: true, triagem: { alagamento: { resposta: "problema" } } } })).resultado).toBe("inviabilizar");
    expect(resumoTerreno(base, pr, t()).resultado).toBe("nao_respondida");
  });
});
describe("perguntas e ordem de verificação", () => {
  it("gera o texto em português e em inglês só com os itens em aberto", () => {
    const x = t({ e2: { triagem: { zoneamento: { resposta: "ok" }, acesso: { resposta: "nao_sei" } } } });
    expect(perguntas(x, base, "en")).toContain("legal access to a public road"); expect(perguntas(x, base, "en")).not.toContain("current zoning"); expect(perguntas(x, base, "pt")).toContain("1 Main St");
  });
  it("primeiro o que pode inviabilizar", () => { expect(verificarPrimeiro(triagemDe(base, t())).slice(0, 2).map((i) => i.item.id)).toEqual(["zoneamento", "acesso"]); });
  it("referência com mais de 6 meses fica sinalizada", () => { expect(refVelha("2026-01-01", "2026-11-24")).toBe(true); expect(refVelha("2026-09-01", "2026-11-24")).toBe(false); });
});
