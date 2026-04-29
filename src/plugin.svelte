<div class="plugin__mobile-header">
    {title}
</div>
<section class="plugin__content">
    <div
        class="plugin__title plugin__title--chevron-back"
        on:click={() => bcast.emit('rqstOpen', 'menu')}
    >
        {title}
    </div>

    <!-- Header -->
    <div class="header">
        <span class="header__icon">☀️</span>
        <div>
            <div class="header__title">Central EU Solar Fleet</div>
            <div class="header__sub">{totalPlants.toLocaleString()} plants · {(totalMappedMW / 1000).toFixed(1)} GW mapped</div>
        </div>
    </div>

    <!-- Capacity gauge -->
    <div class="gauge">
        <div class="gauge__bar">
            <div class="gauge__fill" style="width:{coveragePct}%"></div>
        </div>
        <div class="gauge__labels">
            <span>{(totalMappedMW / 1000).toFixed(1)} GW mapped</span>
            <span>{(totalOfficialMW / 1000).toFixed(1)} GW official</span>
        </div>
        <div class="gauge__pct">{coveragePct}% of national installed capacities</div>
    </div>

    <!-- Country toggles -->
    <div class="section-label">🗺️ Country Toggles</div>
    <div class="country-grid">
        {#each countryList as c}
            <div
                class="country-chip"
                class:country-chip--off={!enabledCountries.has(c.cc)}
                on:click={() => toggleCountry(c.cc)}
            >
                <span class="country-chip__flag">{c.flag}</span>
                <span class="country-chip__label">{c.cc}</span>
                <span class="country-chip__cap">{formatGW(countryMappedMW[c.cc])} GW</span>
                <div class="country-chip__dot" style="background:{c.color};"></div>
            </div>
        {/each}
    </div>
    <div class="quick-toggle">
        <span class="quick-toggle__btn" on:click={selectAll}>All</span>
        <span class="quick-toggle__btn" on:click={selectNone}>None</span>
    </div>

    <!-- Hex overlay toggle -->
    <div class="toggle-row">
        <span class="toggle-row__label">⬡ Hex Density Overlay</span>
        <div class="toggle-btn" class:toggle-btn--active={showHex} on:click={toggleHex}>
            <div class="toggle-btn__knob"></div>
        </div>
    </div>

    <!-- Top plants -->
    <div class="section-label">🏆 Largest Plants</div>
    <div class="top-list">
        {#each filteredTopPlants as p, i}
            <div class="top-item" on:click={() => flyTo(p)}>
                <span class="top-item__rank">#{i + 1}</span>
                <span class="top-item__flag">{getFlagForCC(p.cc)}</span>
                <span class="top-item__name">{p.name}</span>
                <span class="top-item__cap">{p.cap} MW</span>
            </div>
        {/each}
    </div>

    <!-- Footer -->
    <div class="footer">
        <div>Plant data: PyPSA powerplantmatching v0.8.1 (GEM · GPD · ENTSO-E · BeyondCoal)</div>
        <div>Hex grid: H3 resolution 4/5 · Plants ≥1 MW · 6 countries</div>
        <div>Official totals: Energy-Charts / ENTSO-E (2025)</div>
    </div>
</section>

<script lang="ts">
    import bcast from '@windy/broadcast';
    import { map } from '@windy/map';
    import { onMount, onDestroy } from 'svelte';

    import config from './pluginConfig';
    import { hexRes4, hexRes5, countryStats } from './data/solarHexData';
    import { countries } from './data/countries';
    import { EU_BOUNDS } from './constants';
    import { createHexOverlay, renderHexes, removeHexOverlay } from './hexOverlay';

    import type { HexOverlayState } from './hexOverlay';
    import type { HexCell } from './data/solarHexData';

    const { title } = config;
    const countryList = countries;

    // ── Precomputed country stats ──
    const countryMappedMW: Record<string, number> = {};
    const countryOfficialMW: Record<string, number> = {};
    for (const cs of countryStats) {
        countryMappedMW[cs.cc] = cs.mappedMW;
        countryOfficialMW[cs.cc] = cs.officialMW;
    }

    const flagMap: Record<string, string> = {};
    for (const c of countries) flagMap[c.cc] = c.flag;
    const getFlagForCC = (cc: string) => flagMap[cc] || '🏳️';
    const formatGW = (mw: number) => (mw / 1000).toFixed(1);

    // Build a flat top-plants list from all hex data
    const allTopPlants = (() => {
        const seen = new Set<string>();
        const result: { name: string; cap: number; cc: string; lat: number; lon: number }[] = [];
        for (const cell of hexRes4) {
            for (const p of cell.topPlants) {
                const key = `${p.name}-${p.cap}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    // Use hex center as approximate location
                    const latSum = cell.bounds.reduce((s, b) => s + b[0], 0);
                    const lonSum = cell.bounds.reduce((s, b) => s + b[1], 0);
                    result.push({
                        ...p,
                        lat: latSum / cell.bounds.length,
                        lon: lonSum / cell.bounds.length,
                    });
                }
            }
        }
        return result.sort((a, b) => b.cap - a.cap).slice(0, 20);
    })();

    // ── Reactive state ──
    let enabledCountries: Set<string> = new Set(countries.map(c => c.cc));
    let showHex: boolean = true;
    let hexState: HexOverlayState | null = null;
    let currentRes: 4 | 5 = 4;

    // Derived
    $: totalPlants = countryStats
        .filter(cs => enabledCountries.has(cs.cc))
        .reduce((s, cs) => s + cs.plantCount, 0);
    $: totalMappedMW = countryStats
        .filter(cs => enabledCountries.has(cs.cc))
        .reduce((s, cs) => s + cs.mappedMW, 0);
    $: totalOfficialMW = countryStats
        .filter(cs => enabledCountries.has(cs.cc))
        .reduce((s, cs) => s + cs.officialMW, 0);
    $: coveragePct = totalOfficialMW > 0 ? ((totalMappedMW / totalOfficialMW) * 100).toFixed(0) : '0';
    $: filteredTopPlants = allTopPlants.filter(p => enabledCountries.has(p.cc));

    // ── Actions ──
    const flyTo = (p: { lat: number; lon: number }) => {
        map.flyTo([p.lat, p.lon], 10, { duration: 1.5 });
    };

    function toggleCountry(cc: string) {
        const next = new Set(enabledCountries);
        if (next.has(cc)) next.delete(cc);
        else next.add(cc);
        enabledCountries = next;
        refreshHex();
    }

    function selectAll() {
        enabledCountries = new Set(countries.map(c => c.cc));
        refreshHex();
    }

    function selectNone() {
        enabledCountries = new Set();
        refreshHex();
    }

    function toggleHex() {
        showHex = !showHex;
        if (showHex) {
            refreshHex();
        } else {
            removeHexOverlay(map, hexState);
            hexState = null;
        }
    }

    function getResForZoom(): 4 | 5 {
        return map.getZoom() >= 8 ? 5 : 4;
    }

    function getHexData(): HexCell[] {
        return currentRes === 5 ? hexRes5 : hexRes4;
    }

    function refreshHex() {
        if (!showHex) return;
        currentRes = getResForZoom();
        if (hexState) {
            renderHexes(hexState.layer, hexState.polygons, getHexData(), enabledCountries, map);
        } else {
            hexState = createHexOverlay(map, getHexData(), enabledCountries);
        }
    }

    function onZoomEnd() {
        const newRes = getResForZoom();
        if (newRes !== currentRes) {
            currentRes = newRes;
            if (showHex && hexState) {
                renderHexes(hexState.layer, hexState.polygons, getHexData(), enabledCountries, map);
            }
        }
    }

    export const onopen = () => {
        map.fitBounds(EU_BOUNDS);
    };

    onMount(() => {
        hexState = createHexOverlay(map, getHexData(), enabledCountries);
        map.on('zoomend', onZoomEnd);
    });

    onDestroy(() => {
        removeHexOverlay(map, hexState);
        hexState = null;
        map.off('zoomend', onZoomEnd);
    });
</script>

<style lang="less">
    .header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 12px;
        padding: 8px 0;

        &__icon { font-size: 24px; }
        &__title {
            font-size: 15px;
            font-weight: 800;
            background: linear-gradient(90deg, #FFD600, #FF8C00);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        &__sub {
            font-size: 10px;
            color: #8B949E;
        }
    }

    .gauge {
        margin-bottom: 12px;

        &__bar {
            height: 6px;
            background: #21262D;
            border-radius: 3px;
            overflow: hidden;
        }
        &__fill {
            height: 100%;
            background: linear-gradient(90deg, #FFD600, #FF6B00);
            border-radius: 3px;
            transition: width 0.6s ease;
        }
        &__labels {
            display: flex;
            justify-content: space-between;
            font-size: 9px;
            color: #484F58;
            margin-top: 3px;
        }
        &__pct {
            text-align: center;
            font-size: 10px;
            font-weight: 700;
            color: #FFD600;
            margin-top: 2px;
        }
    }

    .section-label {
        font-size: 10px;
        font-weight: 700;
        color: #58A6FF;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        margin-bottom: 6px;
    }

    .country-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px;
        margin-bottom: 6px;
    }
    .country-chip {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 5px 8px;
        background: #161B22;
        border: 1px solid #30363D;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.15s;
        font-size: 11px;

        &:hover { background: #21262D; border-color: #484F58; }
        &--off {
            opacity: 0.35;
            border-color: #21262D;
        }

        &__flag { font-size: 14px; }
        &__label { font-weight: 700; color: #C9D1D9; }
        &__cap { font-size: 9px; color: #8B949E; margin-left: auto; }
        &__dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    }

    .quick-toggle {
        display: flex;
        gap: 8px;
        margin-bottom: 10px;
        font-size: 10px;

        &__btn {
            color: #58A6FF;
            cursor: pointer;
            &:hover { text-decoration: underline; }
        }
    }

    .toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px 0;
        margin-bottom: 10px;

        &__label {
            font-size: 11px;
            font-weight: 600;
            color: #C9D1D9;
        }
    }
    .toggle-btn {
        width: 36px;
        height: 20px;
        background: #21262D;
        border-radius: 10px;
        position: relative;
        cursor: pointer;
        transition: background 0.2s;

        &--active { background: #FF8C00; }
        &__knob {
            width: 16px;
            height: 16px;
            background: #C9D1D9;
            border-radius: 50%;
            position: absolute;
            top: 2px;
            left: 2px;
            transition: transform 0.2s;
        }
        &--active &__knob {
            transform: translateX(16px);
        }
    }

    .top-list { max-height: 300px; overflow-y: auto; margin-bottom: 12px; }
    .top-item {
        display: flex;
        align-items: center;
        padding: 4px 6px;
        cursor: pointer;
        border-radius: 6px;
        font-size: 11px;
        transition: background 0.15s;

        &:hover { background: #21262D; }
        &__rank { width: 24px; color: #484F58; font-size: 9px; font-weight: 700; }
        &__flag { width: 18px; font-size: 12px; }
        &__name { flex: 1; color: #C9D1D9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        &__cap { color: #FFD600; font-weight: 700; white-space: nowrap; margin-left: 8px; }
    }

    .footer {
        font-size: 8px;
        color: #484F58;
        border-top: 1px solid #21262D;
        padding-top: 6px;
        line-height: 1.6;
    }
</style>
