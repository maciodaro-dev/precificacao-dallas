import type { Base, Edicao, Filtros, Projeto } from "./tipos";

const K = { projetos: "pd.projetos.v1", ativo: "pd.ativo.v1", edicoes: "pd.edicoes.v1" };
const ler = <T,>(k: string, padrao: T): T => { try { const s = localStorage.getItem(k); return s ? (JSON.parse(s) as T) : padrao; } catch { return padrao; } };
const gravar = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* armazenamento indisponível */ } };
export const hoje = () => new Date().toISOString().slice(0, 10);
const id = () => "PRJ-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export const FILTROS_PADRAO: Filtros = { isd_min: "", sem_moratoria: false, com_esgoto: false, sfha_max: null, tipo: "todas", cobertura_min: 0, eliminar_sem_dado: false };

export function novoProjeto(base: Base, nome = "Novo projeto"): Projeto {
  // Começa só com os critérios que já têm dado, em pesos iguais, para o primeiro ranking já fazer sentido.
  const pesos = Object.fromEntries(base.criterios.filter((c) => c.cobertura === "coletado").map((c) => [c.id, 10]));
  return { projeto_id: id(), nome, criado_em: hoje(), alterado_em: hoje(), faixa_id: "F2", perfil_origem: "so_com_dado", pesos,
    tamanho: { modo: "maior", min: 0.25, max: 2 }, filtros: { ...FILTROS_PADRAO }, unidade_eleita_id: null, eleita_em: null, margem_alvo_pct: null, juros_aa_pct: null, caminho: null, respostas: {},
    terrenos: [], casas: [], linhas_custo: [], cronograma: [] };
}
export function duplicar(p: Projeto): Projeto {
  return { ...JSON.parse(JSON.stringify(p)), projeto_id: id(), nome: p.nome + " (cópia)", criado_em: hoje(), alterado_em: hoje() };
}
export const carregarProjetos = () => ler<Projeto[]>(K.projetos, []);
export const salvarProjetos = (ps: Projeto[]) => gravar(K.projetos, ps);
export const carregarAtivo = () => ler<string | null>(K.ativo, null);
export const salvarAtivo = (i: string) => gravar(K.ativo, i);
export const carregarEdicoes = () => ler<Record<string, Edicao>>(K.edicoes, {});
export const salvarEdicoes = (e: Record<string, Edicao>) => gravar(K.edicoes, e);
