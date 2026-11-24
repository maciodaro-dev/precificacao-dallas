import { tr } from "../i18n";
import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Linha } from "../ranking";
import { cor, estiloNota } from "../formato";

/** Mapa ao vivo: uma cor distinta por quantidade de escolhas não atendidas, para leitura fácil. */
// cores diferentes (não tons da mesma cor), sóbrias: navy, verde-petróleo, ocre, bordô e cinza
const CORES_VIVO = ["#17253C", "#3F7D6E", "#C9A24B", "#8F3F49", "#B9BBBE"]; const SEM = "#F4F4F2";
export default function Mapa({ geo, linhas, sel, setSel, eleita, camada = "nota", nomeCamada, vivo, apagadas }: { geo: GeoJSON.FeatureCollection; linhas: Linha[]; sel: string | null; setSel: (s: string | null) => void; eleita: string | null; camada?: string; nomeCamada?: string; /** mapa ao lado do painel: uma cor só; quem deixa de atender vai ficando transparente */ vivo?: boolean; /** regiões abaixo do nível de exigência: aparecem em cinza claro */ apagadas?: Set<string>; }) {
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
        if (apagadas?.has(id)) return { fillColor: "#D9DBDE", fillOpacity: 0.35, color: id === sel ? "#8C6A3D" : "#ffffff", weight: id === sel ? 3 : 0.5, opacity: 0.9 };
        if (vivo) { // uma cor por quantidade de escolhas não atendidas: cada escolha nova faz muitas regiões mudarem de cor
          const n = !l || l.poucosDados || l.avaliados === 0 ? null : l.falhas.length; const c = n === null ? SEM : CORES_VIVO[Math.min(n, CORES_VIVO.length - 1)];
          return { fillColor: c, fillOpacity: n === null ? 0.5 : 0.85, color: id === sel ? "#8C6A3D" : n === null ? "#B9BBBE" : "#ffffff", weight: id === sel ? 3 : 0.6, opacity: 0.95, dashArray: n === null ? "3" : undefined }; }
        return { fillColor: cor(!l ? null : camada === "nota" ? l.nota : (l.porCriterio[camada]?.nota ?? null)), fillOpacity: 0.7, color: id === sel ? "#8C6A3D" : id === eleita ? "#17253C" : "#fff", weight: id === sel || id === eleita ? 3 : 0.8 }; },
      onEachFeature: (f, lyr) => { const l = por.get(f.properties.unidade_id);
        const foraT = !!l?.recorte && !l.recorte.partes.some((pt) => pt.parte_id === f.properties.parte_id);
        // o balão do mapa é HTML montado à mão (não passa pela camada de tradução do JSX): cada frase é traduzida aqui
        const linhasT = [`<b>${f.properties.nome}</b>${f.properties.parte_nome && f.properties.parte_nome !== f.properties.nome ? ` <small>(${String(f.properties.parte_nome).split(" × ").pop()})</small>` : ""}`];
        if (foraT) linhasT.push(`<i>${tr("esta parte não tem a nota de escola pedida")}</i>`); else if (l?.recorte) linhasT.push(`<i>${tr(l.recorte.texto)}</i>`);
        if (l) { linhasT.push(tr(`nota ${l.nota?.toFixed(0) ?? "–"}`) + " · " + tr(`atende ${l.atendidos} de ${l.avaliados}`)); linhasT.push(tr(`com dado: ${l.avaliados} de ${l.emUso} parâmetros`) + (l.poucosDados ? ` · <b>${tr("dados insuficientes")}</b>` : "")); }
        if (l?.falhas?.length) linhasT.push(tr("Não atende:") + " " + l.falhas.slice(0, 4).map((x) => tr(x.nome)).join("; "));
        lyr.bindTooltip(linhasT.join("<br>"), { sticky: true });
        lyr.on("click", () => setSel(f.properties.unidade_id)); },
    }).addTo(m);
  }, [geo, linhas, sel, eleita, setSel, camada, nomeCamada, vivo, apagadas]);
  // ao trocar o recorte, enquadra o que está sendo mostrado
  // ao trocar o recorte ou o nível de exigência, aproxima o mapa das regiões exibidas (as que estão em cinza claro não contam)
  const exibidas = linhas.filter((l) => !apagadas?.has(l.u.unidade_id)).map((l) => l.u.unidade_id).join(",");
  useEffect(() => { const m = mapa.current, c = camadaRef.current; if (!m || !c) return; const ids = new Set(exibidas.split(",")); let b: L.LatLngBounds | null = null;
    c.eachLayer((ly) => { const f = (ly as L.Polygon & { feature?: GeoJSON.Feature }).feature; if (f && ids.has(f.properties?.unidade_id)) { const x = (ly as L.Polygon).getBounds(); b = b ? b.extend(x) : L.latLngBounds(x.getSouthWest(), x.getNorthEast()); } });
    const alvo = b ?? c.getBounds(); if (alvo.isValid()) m.fitBounds(alvo, { padding: [16, 16], animate: false, maxZoom: 12 }); }, [exibidas]);
  return (
    <div className="mapa-caixa">
      <div ref={div} className="mapa" />
      {vivo ? <div className="legenda">Escolhas que a região não atende: {["nenhuma (atende tudo)", "1", "2", "3", "4 ou mais"].map((t, k) => <span key={k}><i style={{ background: CORES_VIVO[k] }} />{t}</span>)}<span><i style={{ background: SEM, outline: "1px dashed #B9BBBE" }} />dados insuficientes (contorno tracejado)</span>{apagadas && apagadas.size > 0 && <span><i style={{ background: "#D9DBDE", opacity: 0.6 }} />abaixo do nível de exigência</span>}</div> :
      <div className="legenda">{camada === "nota" ? "Nota final" : `Nota em: ${nomeCamada}`}: {[10, 30, 50, 70, 90].map((n) => <span key={n}><i style={estiloNota(n)} />{n - 10}–{n + 10}</span>)}<span><i style={estiloNota(null)} />sem dado</span></div>}
    </div>
  );
}
