import * as D from "react/jsx-dev-runtime";
import { traduzirProps } from "./jsx-runtime";
export type { JSX } from "react/jsx-runtime";
export const Fragment = D.Fragment;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const jsxDEV = (type: any, props: any, key: any, isStatic: boolean, source: any, self: any) => D.jsxDEV(type, traduzirProps(type, props), key, isStatic, source, self);
