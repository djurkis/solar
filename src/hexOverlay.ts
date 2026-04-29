// H3 hexagonal capacity density overlay
// Renders pre-computed hex cells as L.Polygon layers with capacity-based color gradient

import type { HexCell } from './data/solarHexData';

export interface HexOverlayState {
    layer: L.LayerGroup;
    polygons: Map<string, L.Polygon>;
}


/**
 * Plasma-style colormap — designed for visibility against cloud/weather overlays.
 * Low capacity:  deep indigo (#0D0887)
 * Mid-low:       electric purple (#7E03A8)
 * Mid:           magenta-pink (#CC4778)
 * Mid-high:      hot orange (#F89441)
 * High capacity: bright yellow (#F0F921)
 *
 * No white — stays readable over clouds and dark basemaps.
 */
function hexColor(capMW: number, maxCap: number): { fill: string; border: string; opacity: number } {
    if (maxCap < 1) return { fill: '#000', border: '#000', opacity: 0 };
    const t = Math.min(1, capMW / maxCap);
    if (t < 0.01) return { fill: '#000', border: '#000', opacity: 0 };

    let r: number, g: number, b: number;
    if (t < 0.25) {
        // Deep indigo → electric purple
        const s = t / 0.25;
        r = Math.round(13 + s * 113);   // 13 → 126
        g = Math.round(8 - s * 5);      // 8 → 3
        b = Math.round(135 + s * 33);   // 135 → 168
    } else if (t < 0.5) {
        // Purple → magenta-pink
        const s = (t - 0.25) / 0.25;
        r = Math.round(126 + s * 78);   // 126 → 204
        g = Math.round(3 + s * 68);     // 3 → 71
        b = Math.round(168 - s * 48);   // 168 → 120
    } else if (t < 0.75) {
        // Magenta → hot orange
        const s = (t - 0.5) / 0.25;
        r = Math.round(204 + s * 44);   // 204 → 248
        g = Math.round(71 + s * 77);    // 71 → 148
        b = Math.round(120 - s * 55);   // 120 → 65
    } else {
        // Hot orange → bright yellow
        const s = (t - 0.75) / 0.25;
        r = Math.round(248 - s * 8);    // 248 → 240
        g = Math.round(148 + s * 101);  // 148 → 249
        b = Math.round(65 - s * 32);    // 65 → 33
    }
    const opacity = 0.35 + t * 0.45; // higher base opacity for visibility
    return { fill: `rgb(${r},${g},${b})`, border: `rgba(${r},${g},${b},0.9)`, opacity };
}

function formatPopup(cell: HexCell): string {
    const countryLines = Object.entries(cell.countries)
        .sort((a, b) => b[1] - a[1])
        .map(([cc, mw]) => `<div style="display:flex;justify-content:space-between;font-size:11px;"><span>${cc}</span><span style="font-weight:700">${mw.toFixed(1)} MW</span></div>`)
        .join('');

    const plantLines = cell.topPlants
        .map(p => `<div style="font-size:10px;color:#8B949E;">${p.name} <span style="color:#FFD600">${p.cap} MW</span></div>`)
        .join('');

    return `
        <div style="min-width:180px;font-family:system-ui;color:#C9D1D9;">
            <div style="font-size:13px;font-weight:800;color:#FFD600;margin-bottom:4px;">${cell.capMW.toFixed(0)} MW</div>
            <div style="font-size:10px;color:#8B949E;margin-bottom:6px;">${cell.plantCount} plants in hex</div>
            <div style="margin-bottom:6px;">${countryLines}</div>
            ${plantLines ? `<div style="border-top:1px solid #21262D;padding-top:4px;margin-top:4px;font-size:10px;color:#58A6FF;">Top plants</div>${plantLines}` : ''}
        </div>
    `;
}

export function createHexOverlay(
    map: any,
    hexCells: HexCell[],
    enabledCountries: Set<string>,
): HexOverlayState {
    const layer = new L.LayerGroup().addTo(map);
    const polygons = new Map<string, L.Polygon>();

    renderHexes(layer, polygons, hexCells, enabledCountries, map);

    return { layer, polygons };
}

export function renderHexes(
    layer: L.LayerGroup,
    polygons: Map<string, L.Polygon>,
    hexCells: HexCell[],
    enabledCountries: Set<string>,
    map: any,
): void {
    // Clear existing
    layer.clearLayers();
    polygons.clear();

    // Filter hex cells that have capacity from enabled countries
    const filtered: { cell: HexCell; filteredCap: number }[] = [];
    for (const cell of hexCells) {
        let filteredCap = 0;
        for (const [cc, mw] of Object.entries(cell.countries)) {
            if (enabledCountries.has(cc)) filteredCap += mw;
        }
        if (filteredCap > 0) {
            filtered.push({ cell, filteredCap });
        }
    }

    if (filtered.length === 0) return;

    const maxCap = Math.max(...filtered.map(f => f.filteredCap));

    for (const { cell, filteredCap } of filtered) {
        const { fill, border, opacity } = hexColor(filteredCap, maxCap);

        const poly = L.polygon(cell.bounds as any, {
            fillColor: fill,
            fillOpacity: opacity,
            color: border,
            weight: 1.5,
            opacity: 0.7,
        });

        poly.bindPopup(formatPopup(cell), {
            className: 'hex-popup',
            maxWidth: 260,
        });

        poly.addTo(layer);
        polygons.set(cell.h3, poly);
    }
}

export function removeHexOverlay(map: any, state: HexOverlayState | null): void {
    if (!state) return;
    map.removeLayer(state.layer);
    state.polygons.clear();
}
