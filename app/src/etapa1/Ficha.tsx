import { useEffect } from "react";

/** Ficha da região: painel lateral que abre ao clicar numa linha da lista ou numa região do mapa. Fecha com o botão, com Esc ou clicando fora. */
export default function Ficha({ fechar, children }: { fechar: () => void; children: React.ReactNode }) {
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === "Escape") fechar(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [fechar]);
  return (<>
    <div className="ficha-fundo nao-imprimir" onClick={fechar} />
    <aside className="ficha" id="ficha" role="dialog" aria-label="Ficha da região"><button className="ficha-fechar" onClick={fechar} aria-label="Fechar a ficha">Fechar ✕</button>{children}</aside>
  </>);
}
