import { describe, expect, it } from "vitest";
import { chaveNumerica, definirIdioma, tr } from "./index";
import en from "./en.json"; import es from "./es.json"; import hi from "./hi.json";

describe("idiomas", () => {
  it("em português nada muda", () => { definirIdioma("pt"); expect(tr("Ver resultado →")).toBe("Ver resultado →"); });
  it("traduz texto exato, texto com números e mantém espaços das pontas", () => {
    definirIdioma("en"); expect(tr("atende 6 de 8")).toBe("meets 6 of 8"); expect(tr(" Registrar ")).toBe(" Save "); expect(tr("Frisco")).toBe("Frisco");
    definirIdioma("es"); expect(tr("nota 97")).toBe("puntaje 97"); definirIdioma("hi"); expect(tr("atende 6 de 8")).toBe("8 में से 6 पूरे"); definirIdioma("pt");
  });
  it("frases com nomes de distritos escolares e condados mantêm os nomes", () => {
    definirIdioma("en"); expect(tr("só a parte no Frisco ISD e no Prosper ISD (14,4% da área da cidade)")).toBe("only the part in Frisco ISD and Prosper ISD (14,4% of the city's area)"); expect(tr("Condado de Collin")).toBe("Collin County");
    expect(tr("Fora de cidade · condado de Ellis")).toBe("Outside city limits · Ellis County"); definirIdioma("pt");
  });
  it("os três dicionários têm as mesmas chaves e os mesmos marcadores de número", () => {
    const ks = Object.keys(en).sort(); expect(Object.keys(es).sort()).toEqual(ks); expect(Object.keys(hi).sort()).toEqual(ks);
    const marc = (s: string) => (s.match(/\{\d+\}/g) ?? []).sort().join();
    for (const d of [en, es, hi] as Record<string, string>[]) for (const k of ks) expect(marc(d[k]), k).toBe(marc(k));
    expect(chaveNumerica("atende 6 de 8").chave).toBe("atende {0} de {1}");
  });
  it("Groundwork e a assinatura não são traduzidos", () => { for (const d of [en, es, hi] as Record<string, string>[]) { expect(d["Groundwork"] ?? "Groundwork").toBe("Groundwork"); expect(d["by CSD Tools"] ?? "by CSD Tools").toBe("by CSD Tools"); } });
});
