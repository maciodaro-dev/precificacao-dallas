import { describe, it, expect } from "vitest";
import { desatualizado, indicador, numero } from "./ranking";
import type { Base } from "./tipos";

describe("leitura da base", () => {
  it("sinaliza dado com mais de 6 meses", () => {
    expect(desatualizado("2025-12-31", new Date("2026-11-23"))).toBe(true); expect(desatualizado("2026-08-15", new Date("2026-11-23"))).toBe(false);
  });
  it("sim e não viram 1 e 0; vazio vira sem dado", () => { expect(numero("sim")).toBe(1); expect(numero("nao")).toBe(0); expect(numero("")).toBeNull(); expect(numero(null)).toBeNull(); });
  it("correção manual fica por cima do valor da base e guarda o original", () => {
    const base = { indicadores: { a: { "c24|aliquota_total": { v: 2, um: "%", f: "x", url: "", ref: "2026-01-01", col: "2026-01-01", conf: "alta", obs: "" } } } } as unknown as Base;
    const i = indicador(base, { "a|c24|aliquota_total": { v: 2.3, data: "2026-11-24", original: 2 } }, "a", "c24|aliquota_total")!;
    expect(i.v).toBe(2.3); expect(i.editado).toBe(true); expect(i.original).toBe(2); expect(i.f).toBe("usuario");
  });
});
