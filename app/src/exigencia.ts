// Nível de exigência: quanto do que a pessoa pediu a região precisa atender para aparecer no ranking.
// Aderência = critérios atendidos ÷ critérios com dado para aquela região (contagem simples, sem peso).
// Critério "indiferente" e critério sem dado não entram na conta. A ordem do ranking continua sendo pela nota.
import type { Linha } from "./ranking";

export const NIVEIS: { v: number; rotulo: string }[] = [{ v: 100, rotulo: "O máximo possível" }, { v: 70, rotulo: "70% ou mais" }, { v: 50, rotulo: "50% ou mais" }, { v: 30, rotulo: "30% ou mais" }, { v: 25, rotulo: "25% ou mais" }, { v: 10, rotulo: "10% ou mais" }];
export const NIVEL_PADRAO = 50;
export const aderencia = (l: Linha) => (l.avaliados > 0 ? l.atendidos / l.avaliados : 0);
export const textoAderencia = (l: Linha) => `atende ${l.atendidos} de ${l.avaliados}`;

export interface Corte { visiveis: Linha[]; ocultas: Linha[]; /** frase quando o nível pedido não foi atingido por ninguém */ aviso: string | null; /** nível mais alto que traz resultado, para oferecer a troca com um clique */ sugestao: number | null; nivel: number }
/** Recebe as regiões com dados suficientes (a regra de cobertura mínima vem antes) e separa as que atingem o nível escolhido. */
export function cortar(linhas: Linha[], nivel: number): Corte {
  const tol = 1e-9; const passa = (n: number) => linhas.filter((l) => aderencia(l) >= n / 100 - tol);
  let visiveis = passa(nivel); let aviso: string | null = null; let sugestao: number | null = null;
  if (!visiveis.length && linhas.length) {
    const melhor = Math.max(...linhas.map(aderencia));
    if (nivel >= 100) { visiveis = linhas.filter((l) => aderencia(l) >= melhor - tol); const t = visiveis[0]; aviso = `Nenhuma região atende tudo. Estas atendem ${t.atendidos} de ${t.avaliados}.`; }
    else { sugestao = NIVEIS.filter((x) => x.v < 100).map((x) => x.v).find((v) => passa(v).length > 0) ?? null;
      aviso = sugestao !== null ? `Nenhuma região atende ${nivel}% ou mais do que você pediu. O nível mais alto que traz resultado é ${sugestao}% ou mais.` : "Nenhuma região atende nem 10% do que você pediu."; }
  }
  const ids = new Set(visiveis.map((l) => l.u.unidade_id));
  return { visiveis, ocultas: linhas.filter((l) => !ids.has(l.u.unidade_id)), aviso, sugestao, nivel };
}
