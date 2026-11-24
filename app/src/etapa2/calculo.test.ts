import { describe, expect, it } from "vitest";
import type { Base, Projeto, Terreno } from "../tipos";
import { argumentos, avistaXfinanciado, docsDe, financiamento, linhasDe, opcaoCurta, parcela, pendencias, precoEmUso, progresso, refVelha, respostaItem, resumoTerreno, seguroTitulo, vencimentos, verificarPrimeiro, triagemDe } from "./calculo";

const base = { referencias: [
  { id: "survey", nome: "Survey", min: 400, provavel: 700, max: 1800, unidade: "US$", confianca: "media", geografia: "DFW", data: "2026-11-24", fontes: [] },
  { id: "tri_servidoes", nome: "x", min: 0, provavel: 1000, max: 5000, unidade: "US$", confianca: "baixa", geografia: "Texas", data: "2026-11-24", fontes: [] },
  { id: "prazo_doc_title_commitment", nome: "x", min: 9, provavel: 12, max: 14, unidade: "dias", confianca: "baixa", geografia: "Texas", data: "2026-11-24", fontes: [] },
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
const comprador = { negociacao: { paga_titulo: "comprador" as const } };
describe("pilha de custos", () => {
  it("o valor informado pelo usuário vale sobre a referência; linha sem fonte fica sem valor e é listada", () => {
    const l = linhasDe(base, t({ e2: { custos: { survey: { min: 900, provavel: 900, max: 900, data: "2026-11-24" } } } }));
    expect(l.find((x) => x.linha.id === "survey")!.origem).toBe("informado por mim"); expect(linhasDe(base, t()).find((x) => x.linha.id === "survey")!.origem).toBe("estimativa de referência");
    expect(l.find((x) => x.linha.id === "titulo")!.origem).toBe("tabela oficial"); expect(l.find((x) => x.linha.id === "solo")!.origem).toBe("sem valor");
    const r = resumoTerreno(base, pr, t()); expect(r.semValor).toContain("Laudo de solo"); expect(r.completo).toBe(false);
  });
  it("seguro de título só soma quando o comprador paga; padrão 'a negociar', mostrado à parte", () => {
    const a = resumoTerreno(base, pr, t()); expect(a.linhas.find((x) => x.linha.id === "titulo")!.aParte).toBe("a negociar"); expect(a.aquisicao.provavel).toBe(200000 + 700);
    const b = resumoTerreno(base, pr, t({ e2: comprador })); expect(b.linhas.find((x) => x.linha.id === "titulo")!.aParte).toBeUndefined(); expect(b.aquisicao.provavel).toBe(200000 + seguroTitulo(200000)! + 700);
    expect(resumoTerreno(base, pr, t({ e2: { negociacao: { paga_survey: "vendedor" } } })).aquisicao.provavel).toBe(200000);
  });
  it("sinal em % do preço não soma ao total; fossa só sem rede; financiamento só se financiado", () => {
    const l = linhasDe(base, t()); const s = l.find((x) => x.linha.id === "sinal")!; expect(s.valor!.provavel).toBe(2000); expect(s.linha.naoSoma).toBe(true);
    expect(l.find((x) => x.linha.id === "fossa_teste")!.aplica).toBe(false); expect(linhasDe(base, t({ e2: { agua_esgoto: "poco_fossa" } })).find((x) => x.linha.id === "fossa_teste")!.aplica).toBe(true);
    expect(l.find((x) => x.linha.id === "avaliacao_banco")!.aplica).toBe(false);
  });
});
describe("checklist de documentos e risco", () => {
  const doc = (m: Record<string, { situacao: "nao_pedido" | "pedido" | "recebido_ok" | "recebido_problema" | "nao_se_aplica"; problemas?: string[] }>) => t({ e2: { documentos: m } });
  it("'não pedido' e 'pedido' equivalem a 'não sei'; recebido com problema marca o item; ok exige todos os documentos ligados", () => {
    expect(respostaItem(t(), "zoneamento")).toBe("nao_sei"); expect(respostaItem(doc({ zoneamento_carta: { situacao: "pedido" } }), "zoneamento")).toBe("nao_sei");
    expect(respostaItem(doc({ zoneamento_carta: { situacao: "recebido_ok" } }), "zoneamento")).toBe("ok");
    expect(respostaItem(doc({ zoneamento_carta: { situacao: "recebido_ok" } }), "tamanho_minimo")).toBe("nao_sei");
    expect(respostaItem(doc({ zoneamento_carta: { situacao: "recebido_ok" }, plat: { situacao: "recebido_ok" }, survey: { situacao: "recebido_ok" } }), "tamanho_minimo")).toBe("ok");
    expect(respostaItem(doc({ title_commitment: { situacao: "recebido_problema", problemas: ["servidoes"] } }), "servidoes")).toBe("problema");
    expect(respostaItem(doc({ title_commitment: { situacao: "recebido_problema", problemas: ["servidoes"] } }), "restricoes")).toBe("nao_sei");
    expect(respostaItem(doc({ alagamento_det: { situacao: "recebido_problema" } }), "alagamento")).toBe("problema");
  });
  it("problema confirmado soma ao risco; não verificado só entra no máximo; por casa divide pelo número de casas", () => {
    const r = resumoTerreno(base, pr, doc({ title_commitment: { situacao: "recebido_problema", problemas: ["servidoes"] } }));
    expect(r.riscoConfirmado.provavel).toBe(1000); expect(r.resultado).toBe("condicoes"); expect(r.porCasa.provavel).toBe(r.comRisco.provavel! / 2); expect(argumentos(r.itens).soma.provavel).toBe(1000);
    const n = resumoTerreno(base, pr, doc({ zoneamento_carta: { situacao: "pedido" } }));
    expect(n.riscoConfirmado.provavel).toBe(0); expect(n.exposicao.max).toBe(5000); expect(n.comRisco.max).toBe(n.aquisicao.max! + 5000); expect(n.comRisco.provavel).toBe(n.aquisicao.provavel);
  });
  it("pode inviabilizar: zoneamento, acesso e lote inteiro em floodway", () => {
    expect(resumoTerreno(base, pr, doc({ survey: { situacao: "recebido_problema", problemas: ["acesso"] } })).resultado).toBe("inviabilizar");
    expect(resumoTerreno(base, pr, doc({ alagamento_det: { situacao: "recebido_problema" } })).resultado).toBe("condicoes");
    expect(resumoTerreno(base, pr, t({ e2: { floodway_total: true, documentos: { alagamento_det: { situacao: "recebido_problema" } } } })).resultado).toBe("inviabilizar");
    expect(resumoTerreno(base, pr, t()).resultado).toBe("nao_respondida");
  });
  it("progresso, documentos condicionais e pendências em português e inglês", () => {
    expect(docsDe(t()).some((d) => d.doc.id === "fossa_avaliacao")).toBe(false); expect(docsDe(t({ e2: { agua_esgoto: "poco_fossa", comprador_pj: true, pagamento: { forma: "financiado" } } }))).toHaveLength(18);
    const x = doc({ zoneamento_carta: { situacao: "recebido_ok" }, plat: { situacao: "nao_se_aplica" }, survey: { situacao: "pedido" } }); expect(progresso(x)).toMatchObject({ feitos: 2, total: 15 });
    expect(pendencias(x, "en")).toContain("Survey — requested, waiting"); expect(pendencias(x, "en")).not.toContain("Zoning verification"); expect(pendencias(x, "pt")).toContain("1 Main St");
  });
  it("prazos do contrato viram datas; período de opção curto gera alerta", () => {
    const x = t({ e2: { negociacao: { fim_opcao: "2026-12-01", data_fechamento: "2026-12-20", periodo_opcao_dias: 7 } } }); const v = vencimentos(x, "2026-11-24");
    expect(v.map((y) => [y.id, y.dias])).toEqual([["opcao", 7], ["fechamento", 26]]); expect(vencimentos(x, "2026-12-05")[0].dias).toBe(-4);
    expect(opcaoCurta(base, x)).toEqual({ dias: 12, ate: 14, doc: "Title commitment com as exceções" }); expect(opcaoCurta(base, t({ e2: { negociacao: { periodo_opcao_dias: 30 } } }))).toBeNull();
  });
  it("à vista × financiado", () => {
    const r = resumoTerreno(base, pr, t({ e2: { pagamento: { forma: "financiado", entrada: 40000, juros_aa_pct: 7.5, parcelas: 180 } } })); const c = avistaXfinanciado(r)!;
    expect(c.entradaMaisCustos).toBeCloseTo(c.avista - 160000, 6); expect(c.totalFinanciado).toBeCloseTo(c.avista + r.financiamento!.totalJuros, 6);
  });
  it("primeiro o que pode inviabilizar", () => { expect(verificarPrimeiro(triagemDe(base, t())).slice(0, 2).map((i) => i.item.id)).toEqual(["zoneamento", "acesso"]); });
  it("referência com mais de 6 meses fica sinalizada", () => { expect(refVelha("2026-01-01", "2026-11-24")).toBe(true); expect(refVelha("2026-09-01", "2026-11-24")).toBe(false); });
});
