export function fmt(v: number | string | null | undefined, um = ""): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "string") return v === "sim" ? "Sim" : v === "nao" ? "Não" : v;
  const dolar = um.startsWith("US$");
  const dec = Math.abs(v) >= 100 || Number.isInteger(v) ? 0 : Math.abs(v) >= 10 ? 1 : 2;
  const n = v.toLocaleString("pt-BR", { maximumFractionDigits: dec, minimumFractionDigits: 0 });
  if (dolar) return "$" + n + um.slice(3);
  if (um === "%" || um.startsWith("% ")) return n + "%";
  return n + (um && !["sim/nao", "A-F"].includes(um) ? " " + um.replace("pontos 0-100", "pts") : "");
}
export const CONF: Record<string, string> = { alta: "Alta", media: "Média", baixa: "Baixa", sem_dado: "Sem dado" };
/** Escala sóbria derivada do navy da marca: do mais claro (nota baixa) ao navy (nota alta). A nota aparece sempre em número; a cor é só reforço. */
export const ESCALA = ["#DCE0E8", "#B4BDCC", "#8693AB", "#4E6182", "#17253C"];
/** Estilo do selo de nota: fundo da escala e texto com contraste suficiente. */
export const estiloNota = (nota: number | null) => ({ background: cor(nota), color: nota !== null && nota >= 60 ? "#EDEDEB" : "#22242A" });
export function cor(nota: number | null): string {
  if (nota === null) return "#E3E2DD";
  const e = ESCALA;
  return e[Math.min(4, Math.floor(nota / 20))];
}
