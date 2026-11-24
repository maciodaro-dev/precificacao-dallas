// Idiomas da interface. O texto de origem é o português; cada dicionário mapeia o texto em português para o idioma.
// A tradução é aplicada na hora de desenhar a tela (ver jsx-runtime.ts), então os componentes continuam escritos em português.
// Texto sem tradução aparece em português. Dados da base (observações das fontes, nomes de cidades) não são traduzidos.
import en from "./en.json";
import es from "./es.json";
import hi from "./hi.json";

export type Idioma = "pt" | "en" | "es" | "hi";
export const IDIOMAS: { id: Idioma; nome: string }[] = [{ id: "pt", nome: "Português" }, { id: "en", nome: "English" }, { id: "es", nome: "Español" }, { id: "hi", nome: "हिन्दी" }];
const CHAVE = "pd.idioma.v1";
const DIC: Record<Exclude<Idioma, "pt">, Record<string, string>> = { en, es, hi };
const ler = (): Idioma => { try { const v = localStorage.getItem(CHAVE) as Idioma | null; return v && IDIOMAS.some((i) => i.id === v) ? v : "pt"; } catch { return "pt"; } };
let atual: Idioma = typeof localStorage === "undefined" ? "pt" : ler();
if (typeof document !== "undefined") document.documentElement.lang = atual === "pt" ? "pt-BR" : atual;
export const idiomaAtual = () => atual;
export function definirIdioma(i: Idioma) { atual = i; try { localStorage.setItem(CHAVE, i); } catch { /* sem armazenamento */ } if (typeof document !== "undefined") document.documentElement.lang = i === "pt" ? "pt-BR" : i; }

const NUM = /\d+(?:[.,]\d+)*/g;
/** Chave com os números trocados por {0}, {1}…: "atende 6 de 8" → "atende {0} de {1}". */
export function chaveNumerica(s: string): { chave: string; nums: string[] } { const nums: string[] = []; return { chave: s.replace(NUM, (m) => { nums.push(m); return `{${nums.length - 1}}`; }), nums }; }
declare global { interface Window { __i18nColeta?: Set<string> } }

// Frases com nomes próprios no meio (distritos escolares, condados): traduzidas por padrão, mantendo os nomes.
const E = { en: " and ", es: " y ", hi: " और " } as const;
const PADROES: { re: RegExp; f: (m: RegExpMatchArray, l: Exclude<Idioma, "pt">) => string }[] = [
  { re: /^(Vale )?só a parte no (.+?)(?: \((\S+)% da área (da cidade|fora de cidade)\))?(\.)?$/, f: (m, l) => { const isds = m[2].split(" e no ").join(E[l]); const cid = m[4] === "da cidade"; const pct = m[3];
      if (l === "en") return `${m[1] ? "Only counts" : "only"} the part in ${isds}${pct ? ` (${pct}% of the ${cid ? "city's area" : "area outside city limits"})` : ""}${m[5] ?? ""}`;
      if (l === "es") return `${m[1] ? "Vale solo" : "solo"} la parte en ${isds}${pct ? ` (${pct}% del área ${cid ? "de la ciudad" : "fuera de la ciudad"})` : ""}${m[5] ?? ""}`;
      return `${m[1] ? "केवल यह हिस्सा मान्य: " : "केवल यह हिस्सा: "}${isds}${pct ? ` (${cid ? "शहर के क्षेत्रफल का" : "शहर के बाहर के क्षेत्रफल का"} ${pct}%)` : ""}${m[5] ? "।" : ""}`; } },
  { re: /^Fora de cidade · condado de (.+)$/, f: (m, l) => (l === "en" ? `Outside city limits · ${m[1]} County` : l === "es" ? `Fuera de ciudad · condado de ${m[1]}` : `शहर के बाहर · ${m[1]} County`) },
  { re: /^Condado de (.+)$/, f: (m, l) => (l === "en" ? `${m[1]} County` : l === "es" ? `Condado de ${m[1]}` : `${m[1]} County`) },
  { re: /^(.+ (?:ISD|CISD|MISD)) e mais (\d+)$/, f: (m, l) => (l === "en" ? `${m[1]} and ${m[2]} more` : l === "es" ? `${m[1]} y ${m[2]} más` : `${m[1]} और ${m[2]} अन्य`) },
];
function porPadrao(k: string, l: Exclude<Idioma, "pt">): string | undefined { for (const p of PADROES) { const m = k.match(p.re); if (m) return p.f(m, l); } return undefined; }

/** Traduz um texto da interface. Tenta o texto exato; depois o mesmo texto com os números trocados por marcadores. */
export function tr(s: string): string {
  if (!s) return s; const k = s.trim(); if (!k) return s;
  if (typeof window !== "undefined" && window.__i18nColeta && /[A-Za-zÀ-ÿ]{2}/.test(k)) window.__i18nColeta.add(/\d/.test(k) ? chaveNumerica(k).chave : k);
  if (atual === "pt") return s;
  const d = DIC[atual]; let r: string | undefined = d[k];
  if (r === undefined && /\d/.test(k)) { const { chave, nums } = chaveNumerica(k); const t = d[chave]; if (t !== undefined) r = t.replace(/\{(\d+)\}/g, (_, i) => nums[Number(i)] ?? ""); }
  if (r === undefined) r = porPadrao(k, atual);
  if (r === undefined) return s;
  return s.slice(0, s.length - s.trimStart().length) + r + s.slice(s.trimEnd().length);
}
