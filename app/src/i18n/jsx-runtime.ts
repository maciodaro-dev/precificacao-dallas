// Camada entre o JSX e o React: todo texto escrito dentro de um elemento de tela (e os atributos title, placeholder, aria-label e alt)
// passa por tr() antes de ser desenhado. Assim a interface inteira é traduzida sem reescrever os componentes.
import * as R from "react/jsx-runtime";
import { tr } from "./index";
export type { JSX } from "react/jsx-runtime";
export const Fragment = R.Fragment;
const ATRIBUTOS = ["title", "placeholder", "aria-label", "alt"];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function traduzirProps(type: unknown, props: any): any {
  if (typeof type !== "string" || !props || type === "script" || type === "style") return props;
  let p = props; const c = props.children;
  if (typeof c === "string") p = { ...p, children: tr(c) };
  else if (Array.isArray(c) && c.some((x) => typeof x === "string")) p = { ...p, children: c.map((x) => (typeof x === "string" ? tr(x) : x)) };
  for (const a of ATRIBUTOS) if (typeof props[a] === "string" && props[a]) { if (p === props) p = { ...p }; p[a] = tr(props[a]); }
  return p;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const jsx = (type: any, props: any, key?: any) => R.jsx(type, traduzirProps(type, props), key);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const jsxs = (type: any, props: any, key?: any) => R.jsxs(type, traduzirProps(type, props), key);
