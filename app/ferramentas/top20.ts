// Imprime as 20 primeiras do ranking com o projeto padrão do modo especialista. Uso: npx vite-node ferramentas/top20.ts [faixa]
import fs from "node:fs";
import type { Base, Projeto } from "../src/tipos";
import { avaliar, ativos } from "../src/parametros";
import { deduzir } from "../src/leigo";
const base: Base = JSON.parse(fs.readFileSync(new URL("../public/base.json", import.meta.url), "utf8"));
const pr = { faixa_id: process.argv[2] ?? "F2", n_casas: 1, construcao: "simultaneo", preco_venda: { min: 300000, max: 500000 }, parametros: deduzir({}) } as unknown as Projeto;
const ls = avaliar(base, pr, {}); const nUso = ativos(pr).length;
console.log("| # | Unidade | Nota | Com dado | Não atende |\n|--:|---|--:|--:|---|");
for (const l of ls.slice(0, 20)) console.log(`| ${l.posicao} | ${l.u.nome} | ${l.nota?.toFixed(1)} | ${Math.round(l.cobertura * 100)}% (${l.avaliados} de ${nUso}) | ${l.falhas.map((f) => f.nome).join("; ") || "–"} |`);
