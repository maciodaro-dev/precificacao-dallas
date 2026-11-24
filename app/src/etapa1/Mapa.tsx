import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Linha } from "../ranking";
import { cor } from "../formato";

const VERDE_ESCURO = "#14663a", VERDE_MEDIO = "#35b36b", CINZA = "#8b939c";
/** No mapa ao vivo: fração da escala (da pior nota do momento até 100) a partir da qual a região conta como "atende em parte". */
const LIMITE_PARTE = 0.6;
/** Quanto menor a nota, mais transparente. A escala vai da pior nota do momento até 100 e é acentuada (ao cubo), para que cada escolha mude o mapa de forma visível. */
export const opacidadeVivo = (nota: number | null, pior = 40) => { if (nota === null || pior >= 100) return 0.04; const x = Math.max(0, (nota - pior) / (100 - pior)); return 0.04 + 0.5 * x * x * x; };
export default function Mapa({ geo, linhas, sel, setSel, eleita, camada = "nota", nomeCamada, vivo, destaque }: { geo: GeoJSON.FeatureCollection; linhas: Linha[]; sel: string | null; setSel: (s: string | null) => void; eleita: string | null; camada?: string; nomeCamada?: string; /** mapa ao lado do painel: uma cor só; quem deixa de atender vai ficando transparente */ vivo?: boolean; /** no mapa ao vivo: parâmetro da última escolha; quem não o atende ganha contorno vermelho */ destaque?: string | null }) {
  const div = useRef<HTMLDivElement>(null); const mapa = useRef<L.Map | null>(null); const camadaRef = useRef<L.GeoJSON | null>(null);
  useEffect(() => {
    if (!div.current || mapa.current) return;
    const m = L.map(div.current, { preferCanvas: true }).setView([32.85, -97.05], 8);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap", maxZoom: 16, opacity: 0.6 }).addTo(m);
    mapa.current = m; return () => { m.remove(); mapa.current = null; };
  }, []);
  useEffect(() => {
    const m = mapa.current; if (!m) return; camadaRef.current?.remove();
    const por = new Map(linhas.map((l) => [l.u.unidade_id, l])); const pior = Math.min(...linhas.map((l) => l.nota ?? 100));
    camadaRef.current = L.geoJSON(geo, {
      filter: (f) => por.has(f.properties.unidade_id),
      style: (f) => { const l = por.get(f!.properties.unidade_id); const id = f!.properties.unidade_id;
        // quando a nota de escola pedida só existe em parte da região, o resto da região fica transparente
        const fora = !!l?.recorte && !l.recorte.partes.some((pt) => pt.parte_id === f!.properties.parte_id);
        if (fora) return { fillColor: "#8b939c", fillOpacity: 0.05, color: id === sel ? "#111" : "#9aa3ad", weight: id === sel ? 1.5 : 0.3, opacity: 0.5, dashArray: "3" };
        if (vivo) { const tudo = !!l && l.avaliados > 0 && l.falhas.length === 0; const x = l?.nota == null || pior >= 100 ? 0 : Math.max(0, (l.nota - pior) / (100 - pior));
          // três classes bem separadas: verde escuro (atende tudo), verde médio (atende em parte), cinza (atende pouco)
          const parte = !tudo && x >= LIMITE_PARTE; const op = tudo ? 0.88 : parte ? 0.35 + 0.3 * ((x - LIMITE_PARTE) / (1 - LIMITE_PARTE)) : 0.28;
          const nd = destaque && l ? l.porCriterio[destaque]?.nota : null; const falha = nd != null && nd < 100;
          return { fillColor: tudo ? VERDE_ESCURO : parte ? VERDE_MEDIO : CINZA, fillOpacity: op, color: id === sel ? "#111" : falha ? "#c0392b" : tudo ? "#1b5e3b" : "#9aa3ad", weight: id === sel ? 3 : falha ? 0.7 : tudo ? 1.2 : 0.4, opacity: tudo ? 0.9 : falha ? 0.55 : 0.5 }; }
        return { fillColor: cor(!l ? null : camada === "nota" ? l.nota : (l.porCriterio[camada]?.nota ?? null)), fillOpacity: 0.7, color: id === sel ? "#111" : id === eleita ? "#1d4ed8" : "#fff", weight: id === sel || id === eleita ? 3 : 0.8 }; },
      onEachFeature: (f, lyr) => { const l = por.get(f.properties.unidade_id);
        const foraT = !!l?.recorte && !l.recorte.partes.some((pt) => pt.parte_id === f.properties.parte_id);
        lyr.bindTooltip(`<b>${f.properties.nome}</b>${f.properties.parte_nome && f.properties.parte_nome !== f.properties.nome ? ` <small>(${String(f.properties.parte_nome).split(" × ").pop()})</small>` : ""}${foraT ? "<br><i>esta parte não tem a nota de escola pedida</i>" : l?.recorte ? `<br><i>${l.recorte.texto}</i>` : ""}<br>${!l ? "" : `nota ${l.nota?.toFixed(0) ?? "–"} · posição ${l.posicao ?? "–"}<br>com dado: ${Math.round(l.cobertura * 100)}% (${l.avaliados} de ${l.emUso} parâmetros)`}${l && camada !== "nota" ? `<br>${nomeCamada}: ${l.porCriterio[camada]?.nota ?? "sem dado"}` : ""}${l?.falhas?.length ? `<br>Não atende: ${l.falhas.slice(0, 4).map((x) => x.nome).join("; ")}` : ""}`, { sticky: true });
        lyr.on("click", () => setSel(f.properties.unidade_id)); },
    }).addTo(m);
  }, [geo, linhas, sel, eleita, setSel, camada, nomeCamada, vivo, destaque]);
  // ao trocar o recorte, enquadra o que está sendo mostrado
  const n = linhas.length;
  useEffect(() => { const b = camadaRef.current?.getBounds(); if (mapa.current && b?.isValid()) mapa.current.fitBounds(b, { padding: [10, 10], animate: false }); }, [n]);
  return (
    <div className="mapa-caixa">
      <div ref={div} className="mapa" />
      {vivo ? <div className="legenda"><span><i style={{ background: VERDE_ESCURO, opacity: 0.9 }} />atende tudo o que você escolheu</span><span><i style={{ background: VERDE_MEDIO, opacity: 0.6 }} />atende em parte</span><span><i style={{ background: CINZA, opacity: 0.45 }} />atende pouco</span>{destaque && <span><i style={{ background: "none", outline: "2px solid #c0392b" }} />não atende por inteiro a última escolha</span>}</div> :
      <div className="legenda">{camada === "nota" ? "Nota final" : `Nota em: ${nomeCamada}`}: {[10, 30, 50, 70, 90].map((n) => <span key={n}><i style={{ background: cor(n) }} />{n - 10}–{n + 10}</span>)}<span><i style={{ background: cor(null) }} />sem dado</span></div>}
    </div>
  );
}
