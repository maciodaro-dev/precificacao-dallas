// Navegação do aplicativo. Cada tela tem um nome simples no endereço (ex.: #guiado-3), de modo que:
// - o botão "← Voltar" de qualquer tela leva à tela anterior do fluxo;
// - o botão voltar do navegador faz o mesmo, porque cada tela visitada vira uma entrada no histórico;
// - voltar nunca apaga respostas, porque as respostas ficam no Projeto, não na tela.
import { useCallback, useEffect, useRef, useState } from "react";
import type { Projeto, RespostasLeigo } from "./tipos";
import { PERGUNTAS } from "./leigo";

export const ler = () => decodeURIComponent(window.location.hash.replace(/^#/, ""));
/** Perguntas do modo guiado que valem para as respostas atuais (a pergunta "todas ao mesmo tempo?" só aparece com mais de 1 casa). */
export const perguntasVisiveis = (r: RespostasLeigo | undefined) => PERGUNTAS.filter((q) => !q.so_se || q.so_se({ casas: "1", ...r }));

/** Tela anterior do fluxo. null = não há anterior (primeira tela). */
export function telaAnterior(rota: string, p: Projeto): string | null {
  const fixas: Record<string, string | null> = {
    "inicio": null, "inicio-onde": "inicio", "inicio-retrato": "inicio-onde", "inicio-compra": "inicio-retrato", "inicio-p2": "inicio-compra", "inicio-p3": "inicio-p2", "inicio-p4": "inicio-p3", "inicio-resumo": "inicio-p4",
    "onde-construir": "inicio", "especialista": "onde-construir", "especialista-resultado": "especialista", "cidade": "onde-construir", "retrato": "inicio-resumo", "base-de-dados": "inicio",
  };
  if (rota in fixas) return fixas[rota];
  if (rota === "guiado-resultado") return `guiado-${perguntasVisiveis(p.leigo).length}`;
  const g = /^guiado-(\d+)$/.exec(rota); if (g) return Number(g[1]) > 1 ? `guiado-${Number(g[1]) - 1}` : "onde-construir";
  // etapa 2: lista → terreno (no modo guiado, um passo por tela) → comparar / resumo
  const t2 = /^(etapa-2-terreno-T-[a-z0-9]+)(?:-p(\d+))?$/i.exec(rota);
  if (t2) return t2[2] !== undefined && Number(t2[2]) > 0 ? `${t2[1]}-p${Number(t2[2]) - 1}` : "etapa-2";
  if (rota === "etapa-2-comparar" || rota === "etapa-2-resumo") return "etapa-2";
  // "Região escolhida": volta para o resultado da etapa 1, de onde a região foi escolhida
  if (rota === "regiao-escolhida") return p.ponto_partida?.tem_terreno ? "retrato" : p.caminho === "cidade" ? "cidade" : p.modo === "expert" ? "especialista-resultado" : p.modo === "leigo" ? "guiado-resultado" : "onde-construir";
  const e = /^etapa-(\d)$/.exec(rota);
  if (e) { const n = Number(e[1]); if (n > 2) return `etapa-${n - 1}`;
    return p.ponto_partida?.tem_terreno ? "retrato" : p.caminho === "cidade" ? "cidade" : p.modo === "expert" ? "especialista-resultado" : p.modo === "leigo" ? "guiado-resultado" : "onde-construir"; }
  return "inicio";
}
/** Primeira tela ao abrir o aplicativo sem endereço: o ponto de partida, ou onde o projeto parou. */
export function telaInicial(p: Projeto | null | undefined): string {
  const pp = p?.ponto_partida;
  if (!pp || pp.tem_terreno == null) return "inicio";
  return pp.tem_terreno ? (pp.concluido ? "inicio-resumo" : "inicio-onde") : "onde-construir";
}

export function useRota(inicial: () => string) {
  const [rota, setRota] = useState(() => ler() || inicial());
  const pilha = useRef<string[]>([rota]);
  useEffect(() => {
    if (!ler()) window.history.replaceState(null, "", "#" + rota);
    const aoMudar = () => { const r = ler() || inicial(); const s = pilha.current;
      if (s.length > 1 && s[s.length - 2] === r) s.pop(); else if (s[s.length - 1] !== r) s.push(r);
      setRota(r); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", aoMudar); return () => window.removeEventListener("hashchange", aoMudar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /** Vai para outra tela (nova entrada no histórico do navegador). */
  const ir = useCallback((r: string) => { if (r !== ler()) window.location.hash = r; }, []);
  /** Volta para a tela anterior do fluxo. Se ela é a entrada anterior do histórico, usa o voltar do navegador; senão, troca a tela atual por ela. */
  const voltar = useCallback((anterior: string | null) => { if (!anterior) return; const s = pilha.current;
    if (s.length > 1 && s[s.length - 2] === anterior) window.history.back();
    else { s[s.length - 1] = anterior; window.history.replaceState(null, "", "#" + anterior); setRota(anterior); window.scrollTo(0, 0); } }, []);
  /** Troca a tela atual sem criar entrada no histórico (ex.: ao trocar de projeto). */
  const substituir = useCallback((r: string) => { pilha.current[pilha.current.length - 1] = r; window.history.replaceState(null, "", "#" + r); setRota(r); window.scrollTo(0, 0); }, []);
  return { rota, ir, voltar, substituir };
}
