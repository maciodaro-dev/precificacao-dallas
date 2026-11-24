import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Linha } from "../ranking";
import { cor } from "../formato";

export default function Mapa({ geo, linhas, sel, setSel, eleita }: { geo: GeoJSON.FeatureCollection; linhas: Linha[]; sel: string | null; setSel: (s: string | null) => void; eleita: string | null }) {
  const div = useRef<HTMLDivElement>(null); const mapa = useRef<L.Map | null>(null); const camada = useRef<L.GeoJSON | null>(null);
  useEffect(() => {
    if (!div.current || mapa.current) return;
    const m = L.map(div.current, { preferCanvas: true }).setView([32.95, -96.75], 9);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap", maxZoom: 16, opacity: 0.6 }).addTo(m);
    mapa.current = m; return () => { m.remove(); mapa.current = null; };
  }, []);
  useEffect(() => {
    const m = mapa.current; if (!m) return; camada.current?.remove();
    const por = new Map(linhas.map((l) => [l.u.unidade_id, l]));
    camada.current = L.geoJSON(geo, {
      style: (f) => { const l = por.get(f!.properties.unidade_id); const id = f!.properties.unidade_id;
        return { fillColor: cor(!l || l.eliminada.length ? null : l.nota), fillOpacity: l?.eliminada.length ? 0.25 : 0.7, color: id === sel ? "#111" : id === eleita ? "#1d4ed8" : "#fff", weight: id === sel || id === eleita ? 3 : 0.8 }; },
      onEachFeature: (f, lyr) => { const l = por.get(f.properties.unidade_id);
        lyr.bindTooltip(`<b>${f.properties.nome}</b><br>${!l ? "" : l.eliminada.length ? "eliminada: " + l.eliminada.map((x) => x.filtro).join(", ") : !l.avaliados ? "sem critério avaliado" : `nota ${l.nota?.toFixed(0)} · atende ${l.atendidos} de ${l.avaliados} critérios · posição ${l.posicao}`}`, { sticky: true });
        lyr.on("click", () => setSel(f.properties.unidade_id)); },
    }).addTo(m);
  }, [geo, linhas, sel, eleita, setSel]);
  return (
    <div className="mapa-caixa">
      <div ref={div} className="mapa" />
      <div className="legenda">Nota: {[10, 30, 50, 70, 90].map((n) => <span key={n}><i style={{ background: cor(n) }} />{n - 10}–{n + 10}</span>)}<span><i style={{ background: cor(null) }} />eliminada ou sem nota</span></div>
    </div>
  );
}
