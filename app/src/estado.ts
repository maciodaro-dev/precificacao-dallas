import type { Base, Edicao, PerfilSalvo, Projeto } from "./tipos";

const K = { projetos: "pd.projetos.v1", ativo: "pd.ativo.v1", edicoes: "pd.edicoes.v1", perfis: "pd.perfis.v1" };
const ler = <T,>(k: string, padrao: T): T => { try { const s = localStorage.getItem(k); return s ? (JSON.parse(s) as T) : padrao; } catch { return padrao; } };
const gravar = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* armazenamento indisponível */ } };
export const hoje = () => new Date().toISOString().slice(0, 10);
/** Dono dos dados privados. Enquanto não há login, existe um único dono local. */
export const DONO_LOCAL = "local";
const id = () => "PRJ-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export function novoProjeto(_base: Base, nome = "Novo projeto"): Projeto {
  return { dono_id: DONO_LOCAL, projeto_id: id(), nome, criado_em: hoje(), alterado_em: hoje(), ponto_partida: { tem_terreno: null }, realizadas: [], faixa_id: "F2",
    unidade_eleita_id: null, eleita_em: null, margem_alvo_pct: null, juros_aa_pct: null, modo: null, caminho: null, n_casas: 1, construcao: "simultaneo", preco_venda: null,
    terrenos: [], casas: [], linhas_custo: [], cronograma: [] };
}
export function duplicar(p: Projeto): Projeto {
  return { ...JSON.parse(JSON.stringify(p)), projeto_id: id(), nome: p.nome + " (cópia)", criado_em: hoje(), alterado_em: hoje() };
}
export const carregarProjetos = () => ler<Projeto[]>(K.projetos, []).map((p) => ({ dono_id: DONO_LOCAL, ...p }));
export const salvarProjetos = (ps: Projeto[]) => gravar(K.projetos, ps);
export const carregarAtivo = () => ler<string | null>(K.ativo, null);
export const salvarAtivo = (i: string) => gravar(K.ativo, i);
export const carregarEdicoes = () => ler<Record<string, Edicao>>(K.edicoes, {});
export const salvarEdicoes = (e: Record<string, Edicao>) => gravar(K.edicoes, e);
export const carregarPerfis = () => ler<PerfilSalvo[]>(K.perfis, []);
export const salvarPerfis = (p: PerfilSalvo[]) => gravar(K.perfis, p);
