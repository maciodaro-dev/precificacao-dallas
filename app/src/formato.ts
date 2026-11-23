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
export function cor(nota: number | null): string {
  if (nota === null) return "#c9ced6";
  const e = ["#b3402e", "#d98a3d", "#e3c94f", "#8fbf5a", "#2f8f5b"];
  return e[Math.min(4, Math.floor(nota / 20))];
}
