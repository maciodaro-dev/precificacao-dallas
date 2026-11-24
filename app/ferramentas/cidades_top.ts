// Lista as cidades das N primeiras unidades do ranking padrão. Uso: npx vite-node ferramentas/cidades_top.ts 50
import fs from "node:fs";
import type { Base, Projeto } from "../src/tipos";
import { avaliar } from "../src/parametros";
import { deduzir } from "../src/leigo";
const base: Base = JSON.parse(fs.readFileSync(new URL("../public/base.json", import.meta.url), "utf8"));
const pr = { faixa_id: "F2", n_casas: 1, construcao: "simultaneo", preco_venda: { min: 300000, max: 500000 }, parametros: deduzir({}) } as unknown as Projeto;
const ls = avaliar(base, pr, {}).slice(0, Number(process.argv[2] ?? 50));
const cs = new Map<string, string>(); for (const l of ls) if (l.u.tipo === "cidade_isd" && !cs.has(l.u.cidade)) cs.set(l.u.cidade, `${l.u.cidade} (${l.u.condado}, ${l.u.lado})`);
console.log(cs.size, [...cs.values()].join("; "));
