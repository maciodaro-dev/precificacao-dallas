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
export const idiomaAtual = () => atual;
export function definirIdioma(i: Idioma) { atual = i; try { localStorage.setItem(CHAVE, i); } catch { /* sem armazenamento */ } if (typeof document !== "undefined") document.documentElement.lang = i === "pt" ? "pt-BR" : i; }

const NUM = /\d+(?:[.,]\d+)*/g;
/** Chave com os números trocados por {0}, {1}…: "atende 6 de 8" → "atende {0} de {1}". */
export function chaveNumerica(s: string): { chave: string; nums: string[] } { const nums: string[] = []; return { chave: s.replace(NUM, (m) => { nums.push(m); return `{${nums.length - 1}}`; }), nums }; }
declare global { interface Window { __i18nColeta?: Set<string> } }

/** Traduz um texto da interface. Tenta o texto exato; depois o mesmo texto com os números trocados por marcadores. */
export function tr(s: string): string {
  if (!s) return s; const k = s.trim(); if (!k) return s;
  if (typeof window !== "undefined" && window.__i18nColeta && /[A-Za-zÀ-ÿ]{2}/.test(k)) window.__i18nColeta.add(/\d/.test(k) ? chaveNumerica(k).chave : k);
  if (atual === "pt") return s;
  const d = DIC[atual]; let r: string | undefined = d[k];
  if (r === undefined && /\d/.test(k)) { const { chave, nums } = chaveNumerica(k); const t = d[chave]; if (t !== undefined) r = t.replace(/\{(\d+)\}/g, (_, i) => nums[Number(i)] ?? ""); }
  if (r === undefined) return s;
  return s.slice(0, s.length - s.trimStart().length) + r + s.slice(s.trimEnd().length);
}
