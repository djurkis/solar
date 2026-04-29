// Leaflet layer management for solar plants
// Animated DivIcon markers with capacity-proportional glow

import { MARKER_COLOR, MARKER_GLOW } from './constants';
import type { SolarPlant } from './data/czechSolar';

const SOLAR_COLOR = MARKER_COLOR;
const SOLAR_FILL = '#B8860B';

/** Confidence label from source count */
function confidenceLabel(nSrc: number): { label: string; color: string } {
    if (nSrc >= 3) return { label: 'HIGH', color: '#3FB950' };
    if (nSrc >= 2) return { label: 'MEDIUM', color: '#D29922' };
    return { label: 'SINGLE', color: '#8B949E' };
}

/** Marker size from capacity using sqrt scaling */
function size(capMW: number): number {
    return Math.max(6, Math.min(28, 4 + Math.sqrt(capMW) * 2.5));
}

/** Hue shift: small plants → warm amber, large → hot orange-red */
function hue(capMW: number): string {
    const t = Math.min(1, capMW / 50); // normalize to 0–1 (50 MW = max saturation)
    const h = Math.round(45 - t * 30);  // 45° (amber) → 15° (hot orange)
    const l = Math.round(55 - t * 10);  // brighter for small, deeper for large
    return `hsl(${h}, 100%, ${l}%)`;
}

/** Build popup HTML for a single plant */
function popupHtml(p: SolarPlant): string {
    const { label, color } = confidenceLabel(p.nSrc);
    const year = p.year ?? 'N/A';
    return `
    <div style="font-family:'Inter',system-ui,sans-serif;min-width:240px;color:#C9D1D9;
                background:linear-gradient(145deg,#0D1117,#161B22);padding:14px 16px;
                border-radius:10px;border:1px solid ${SOLAR_COLOR}40;
                box-shadow:0 4px 24px rgba(0,0,0,0.5);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <b style="color:${SOLAR_COLOR};font-size:14px;letter-spacing:0.3px;">${p.name}</b>
            <span style="background:${color}20;border:1px solid ${color}60;
                         border-radius:4px;padding:2px 6px;font-size:8px;
                         color:${color};font-weight:700;letter-spacing:0.5px;">${label}</span>
        </div>
        <table style="font-size:11px;border-collapse:collapse;width:100%;">
            <tr><td style="color:#8B949E;padding:2px 8px 2px 0;">Capacity</td>
                <td style="font-weight:700;color:#FFD600;">${p.cap} MW</td></tr>
            <tr><td style="color:#8B949E;padding:2px 8px 2px 0;">Commissioned</td>
                <td>${year}</td></tr>
            <tr><td style="color:#8B949E;padding:2px 8px 2px 0;">Coordinates</td>
                <td style="font-family:monospace;font-size:10px;">${p.lat.toFixed(4)}°N, ${p.lon.toFixed(4)}°E</td></tr>
            <tr><td style="color:#8B949E;padding:2px 8px 2px 0;">Data Sources</td>
                <td>${p.nSrc} registr${p.nSrc === 1 ? 'y' : 'ies'}</td></tr>
        </table>
    </div>`;
}

/** Create a glowing DivIcon for a solar plant */
function createIcon(p: SolarPlant): L.DivIcon {
    const s = size(p.cap);
    const col = hue(p.cap);
    const glow = Math.min(12, 3 + p.cap / 5);
    const pulse = p.cap > 20 ? 'animation:solar-pulse 3s ease-in-out infinite;' : '';

    return new L.DivIcon({
        className: '',
        iconSize: [s, s],
        iconAnchor: [s / 2, s / 2],
        html: `<div style="
            width:${s}px;height:${s}px;
            border-radius:50%;
            background:radial-gradient(circle at 35% 35%, ${col}, ${SOLAR_FILL});
            box-shadow:0 0 ${glow}px ${col}, 0 0 ${glow * 2}px ${col}40;
            border:1px solid ${SOLAR_COLOR}90;
            ${pulse}
            cursor:pointer;
            transition:transform 0.2s,box-shadow 0.2s;
        " onmouseover="this.style.transform='scale(1.4)';this.style.boxShadow='0 0 ${glow * 2}px ${col}, 0 0 ${glow * 3}px ${col}80';"
           onmouseout="this.style.transform='scale(1)';this.style.boxShadow='0 0 ${glow}px ${col}, 0 0 ${glow * 2}px ${col}40';"
        ></div>`,
    });
}

export interface PlantLayers {
    markers: L.Marker[];
    popup: L.Popup | null;
    cleanup: () => void;
}

/** Inject CSS keyframes for pulsing animation */
function injectStyles(): void {
    if (document.getElementById('solar-pulse-css')) return;
    const style = document.createElement('style');
    style.id = 'solar-pulse-css';
    style.textContent = `
        @keyframes solar-pulse {
            0%, 100% { opacity: 0.85; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.15); }
        }
    `;
    document.head.appendChild(style);
}

/** Add all solar plants to the map */
export function addPlants(map: L.Map, plants: SolarPlant[]): PlantLayers {
    injectStyles();

    const markers: L.Marker[] = [];
    let popup: L.Popup | null = null;

    for (const p of plants) {
        const marker = new L.Marker([p.lat, p.lon], {
            icon: createIcon(p),
        }).addTo(map);

        marker.on('click', () => {
            popup?.remove();
            popup = new L.Popup({ autoClose: true, closeOnClick: true, maxWidth: 360 })
                .setLatLng([p.lat, p.lon])
                .setContent(popupHtml(p))
                .openOn(map);
        });

        markers.push(marker);
    }

    const cleanup = () => {
        popup?.remove();
    };

    return { markers, popup, cleanup };
}

/** Remove all layers cleanly */
export function removePlants(map: L.Map, layers: PlantLayers | null): void {
    if (!layers) return;
    layers.cleanup();
    for (const m of layers.markers) {
        map.removeLayer(m);
    }
}
