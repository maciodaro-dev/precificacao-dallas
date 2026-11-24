import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Linha } from "../ranking";
import { cor } from "../formato";

export default function Mapa({ geo, linhas, sel, setSel, eleita, camada = "nota", nomeCamada }: { geo: GeoJSON.FeatureCollection; linhas: Linha[]; sel: string | null; setSel: (s: string | null) => void; eleita: string | null; camada?: string; nomeCamada?: string }) {
  const div = useRef<HTMLDivElement>(null); const mapa = useRef<L.Map | null>(null); const camadaRef = useRef<L.GeoJSON | null>(null);
  useEffect(() => {
    if (!div.current || mapa.current) return;
    const m = L.map(div.current, { preferCanvas: true }).setView([32.95, -96.75], 9);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap", maxZoom: 16, opacity: 0.6 }).addTo(m);
    mapa.current = m; return () => { m.remove(); mapa.current = null; };
  }, []);
  useEffect(() => {
    const m = mapa.current; if (!m) return; camadaRef.current?.remove();
    const por = new Map(linhas.map((l) => [l.u.unidade_id, l]));
    camadaRef.current = L.geoJSON(geo, {
      style: (f) => { const l = por.get(f!.properties.unidade_id); const id = f!.properties.unidade_id;
        return { fillColor: cor(!l ? null : camada === "nota" ? l.nota : (l.porCriterio[camada]?.nota ?? null)), fillOpacity: 0.7, color: id === sel ? "#111" : id === eleita ? "#1d4ed8" : "#fff", weight: id === sel || id === eleita ? 3 : 0.8 }; },
      onEachFeature: (f, lyr) => { const l = por.get(f.properties.unidade_id);
        lyr.bindTooltip(`<b>${f.properties.nome}</b><br>${!l ? "" : `nota ${l.nota?.toFixed(0) ?? "–"} · posição ${l.posicao ?? "–"}`}${l && camada !== "nota" ? `<br>${nomeCamada}: ${l.porCriterio[camada]?.nota ?? "sem dado"}` : ""}${l?.falhas?.length ? `<br>Não atende: ${l.falhas.slice(0, 4).map((x) => x.nome).join("; ")}` : ""}`, { sticky: true });
        lyr.on("click", () => setSel(f.properties.unidade_id)); },
    }).addTo(m);
  }, [geo, linhas, sel, eleita, setSel, camada, nomeCamada]);
  return (
    <div className="mapa-caixa">
      <div ref={div} className="mapa" />
      <div className="legenda">{camada === "nota" ? "Nota final" : `Nota em: ${nomeCamada}`}: {[10, 30, 50, 70, 90].map((n) => <span key={n}><i style={{ background: cor(n) }} />{n - 10}–{n + 10}</span>)}<span><i style={{ background: cor(null) }} />sem dado</span></div>
    </div>
  );
}
