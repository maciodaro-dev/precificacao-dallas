import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Linha } from "../ranking";
import { cor } from "../formato";

/** Mapa ao vivo: do verde escuro (atende tudo) ao cinza (não atende 4 ou mais escolhas). Cores bem separadas para que cada escolha mude o mapa. */
const CORES_VIVO = ["#14663a", "#5fbf6f", "#f2c94c", "#f2994a", "#9aa1a9"]; const SEM = "#c9ced4";
export default function Mapa({ geo, linhas, sel, setSel, eleita, camada = "nota", nomeCamada, vivo }: { geo: GeoJSON.FeatureCollection; linhas: Linha[]; sel: string | null; setSel: (s: string | null) => void; eleita: string | null; camada?: string; nomeCamada?: string; /** mapa ao lado do painel: uma cor só; quem deixa de atender vai ficando transparente */ vivo?: boolean; }) {
  const div = useRef<HTMLDivElement>(null); const mapa = useRef<L.Map | null>(null); const camadaRef = useRef<L.GeoJSON | null>(null);
  useEffect(() => {
    if (!div.current || mapa.current) return;
    const m = L.map(div.current, { preferCanvas: true }).setView([32.85, -97.05], 8);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap", maxZoom: 16, opacity: 0.6 }).addTo(m);
    mapa.current = m; return () => { m.remove(); mapa.current = null; };
  }, []);
  useEffect(() => {
    const m = mapa.current; if (!m) return; camadaRef.current?.remove();
    const por = new Map(linhas.map((l) => [l.u.unidade_id, l]));
    camadaRef.current = L.geoJSON(geo, {
      filter: (f) => por.has(f.properties.unidade_id),
      style: (f) => { const l = por.get(f!.properties.unidade_id); const id = f!.properties.unidade_id;
        // quando a nota de escola pedida só existe em parte da região, o resto da região fica transparente
        const fora = !!l?.recorte && !l.recorte.partes.some((pt) => pt.parte_id === f!.properties.parte_id);
        if (fora) return { fillColor: "#8b939c", fillOpacity: 0.05, color: id === sel ? "#111" : "#9aa3ad", weight: id === sel ? 1.5 : 0.3, opacity: 0.5, dashArray: "3" };
        if (vivo) { // uma cor por quantidade de escolhas não atendidas: cada escolha nova faz muitas regiões mudarem de cor
          const n = !l || l.poucosDados || l.avaliados === 0 ? null : l.falhas.length; const c = n === null ? SEM : CORES_VIVO[Math.min(n, CORES_VIVO.length - 1)];
          return { fillColor: c, fillOpacity: n === null ? 0.25 : n === 0 ? 0.9 : n >= CORES_VIVO.length - 1 ? 0.45 : 0.75, color: id === sel ? "#111" : n === 0 ? "#0c4526" : "#ffffff", weight: id === sel ? 3 : n === 0 ? 1.4 : 0.5, opacity: 0.9 }; }
        return { fillColor: cor(!l ? null : camada === "nota" ? l.nota : (l.porCriterio[camada]?.nota ?? null)), fillOpacity: 0.7, color: id === sel ? "#111" : id === eleita ? "#1d4ed8" : "#fff", weight: id === sel || id === eleita ? 3 : 0.8 }; },
      onEachFeature: (f, lyr) => { const l = por.get(f.properties.unidade_id);
        const foraT = !!l?.recorte && !l.recorte.partes.some((pt) => pt.parte_id === f.properties.parte_id);
        lyr.bindTooltip(`<b>${f.properties.nome}</b>${f.properties.parte_nome && f.properties.parte_nome !== f.properties.nome ? ` <small>(${String(f.properties.parte_nome).split(" × ").pop()})</small>` : ""}${foraT ? "<br><i>esta parte não tem a nota de escola pedida</i>" : l?.recorte ? `<br><i>${l.recorte.texto}</i>` : ""}<br>${!l ? "" : `nota ${l.nota?.toFixed(0) ?? "–"} · posição ${l.posicao ?? "–"}<br>com dado: ${Math.round(l.cobertura * 100)}% (${l.avaliados} de ${l.emUso} parâmetros)${l.poucosDados ? " · <b>poucos dados</b>" : ""}`}${l && camada !== "nota" ? `<br>${nomeCamada}: ${l.porCriterio[camada]?.nota ?? "sem dado"}` : ""}${l?.falhas?.length ? `<br>Não atende: ${l.falhas.slice(0, 4).map((x) => x.nome).join("; ")}` : ""}`, { sticky: true });
        lyr.on("click", () => setSel(f.properties.unidade_id)); },
    }).addTo(m);
  }, [geo, linhas, sel, eleita, setSel, camada, nomeCamada, vivo]);
  // ao trocar o recorte, enquadra o que está sendo mostrado
  const n = linhas.length;
  useEffect(() => { const b = camadaRef.current?.getBounds(); if (mapa.current && b?.isValid()) mapa.current.fitBounds(b, { padding: [10, 10], animate: false }); }, [n]);
  return (
    <div className="mapa-caixa">
      <div ref={div} className="mapa" />
      {vivo ? <div className="legenda">Escolhas que a região não atende: {["nenhuma (atende tudo)", "1", "2", "3", "4 ou mais"].map((t, k) => <span key={k}><i style={{ background: CORES_VIVO[k] }} />{t}</span>)}<span><i style={{ background: SEM, opacity: 0.4 }} />dados insuficientes</span></div> :
      <div className="legenda">{camada === "nota" ? "Nota final" : `Nota em: ${nomeCamada}`}: {[10, 30, 50, 70, 90].map((n) => <span key={n}><i style={{ background: cor(n) }} />{n - 10}–{n + 10}</span>)}<span><i style={{ background: cor(null) }} />sem dado</span></div>}
    </div>
  );
}
