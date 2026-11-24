import { describe, expect, it } from "vitest";
import type { Linha } from "./ranking";
import { aderencia, cortar, textoAderencia } from "./exigencia";

const L = (id: string, atendidos: number, avaliados: number, nota: number): Linha => ({ u: { unidade_id: id, nome: id } as Linha["u"], nota, cobertura: 1, emUso: 10, porCriterio: {}, posicao: null, atendidos, avaliados, falhas: [] });
const ls = [L("a", 8, 8, 100), L("b", 6, 8, 90), L("c", 4, 8, 70), L("d", 2, 8, 40), L("e", 1, 10, 20)];

describe("nível de exigência", () => {
  it("aderência é contagem simples: atendidos ÷ critérios com dado", () => { expect(aderencia(ls[1])).toBeCloseTo(0.75); expect(textoAderencia(ls[1])).toBe("atende 6 de 8"); expect(aderencia(L("z", 0, 0, 0))).toBe(0); });
  it("só aparecem as regiões que atingem o nível; a ordem é a de entrada (nota)", () => {
    const c = cortar(ls, 50); expect(c.visiveis.map((l) => l.u.unidade_id)).toEqual(["a", "b", "c"]); expect(c.ocultas.map((l) => l.u.unidade_id)).toEqual(["d", "e"]); expect(c.aviso).toBeNull();
    expect(cortar(ls, 25).visiveis.length).toBe(4); expect(cortar(ls, 10).visiveis.length).toBe(5); expect(cortar(ls, 70).visiveis.length).toBe(2);
  });
  it("o máximo possível: só 100%; se ninguém atinge, mostra o nível mais alto alcançado e diz qual foi", () => {
    expect(cortar(ls, 100).visiveis.map((l) => l.u.unidade_id)).toEqual(["a"]);
    const c = cortar(ls.slice(1), 100); expect(c.visiveis.map((l) => l.u.unidade_id)).toEqual(["b"]); expect(c.aviso).toBe("Nenhuma região atende tudo. Estas atendem 6 de 8.");
  });
  it("se nenhuma região atinge o nível, sugere o mais alto que traz resultado", () => {
    const c = cortar(ls.slice(3), 70); expect(c.visiveis.length).toBe(0); expect(c.sugestao).toBe(25); expect(c.aviso).toMatch(/25% ou mais/);
    expect(cortar([L("x", 0, 9, 0)], 50).sugestao).toBeNull();
  });
});
