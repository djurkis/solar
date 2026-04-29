# ☀️ Central EU Solar Capacity — Windy Plugin

Interactive hexagonal overlay of **10,136 utility-scale solar PV plants** (49 GW) across six Central European countries, built for the [Windy.com](https://www.windy.com) weather platform.

![Plugin Demo](demo.gif)

## Install

Paste this URL into [Windy Developer Mode](https://www.windy.com/developer-mode):

```
https://windy-plugins.com/16844715/windy-plugin-eu-solar/2.1.0/plugin.min.js
```

## Features

- **H3 Hexagonal Grid** — 3,630 hex cells (res-4 + res-5) with plasma colormap showing capacity density
- **6 Country Toggles** — CZ · DE · PL · AT · SK · HU
- **Zoom-Adaptive Resolution** — switches from res-4 (country view) to res-5 (regional detail) at zoom level 8
- **Capacity Labels** — MW values displayed on each hex cell
- **Click for Details** — popup with per-country breakdown and top plants per hex
- **Coverage Gauge** — mapped vs official installed capacity


## Coverage

| Country | Plants | Mapped | Official | Coverage |
|---------|--------|--------|----------|----------|
| 🇨🇿 CZ | 598 | 2.9 GW | 5.3 GW | 55% |
| 🇩🇪 DE | 6,245 | 31.3 GW | 87.0 GW | 36% |
| 🇵🇱 PL | 2,386 | 9.3 GW | 17.8 GW | 52% |
| 🇦🇹 AT | 168 | 0.9 GW | 8.3 GW | 11% |
| 🇸🇰 SK | 176 | 0.9 GW | 1.7 GW | 53% |
| 🇭🇺 HU | 563 | 4.1 GW | 6.5 GW | 62% |

> Coverage gaps are primarily distributed rooftop & small C&I solar (<1 MW) not tracked in utility-scale plant databases.

## Data Sources

| Source | License | What |
|--------|---------|------|
| [PyPSA powerplantmatching](https://github.com/PyPSA/powerplantmatching) | CC-BY-4.0 | Plant-level data (GEM · GPD · ENTSO-E · BeyondCoal) |
| [Energy-Charts (Fraunhofer ISE)](https://energy-charts.info) | Open | Official installed capacity |
| [H3 (Uber)](https://h3geo.org) | Apache 2.0 | Hexagonal grid system |

## Tech Stack

- **Svelte** + **TypeScript** — plugin UI
- **Leaflet** — map rendering (via Windy)
- **H3** — hexagonal spatial indexing (pre-computed in Python, no runtime dependency)
- **Rollup** — bundling

## Build

```bash
npm install
npm run build        # production build → dist/
npm start            # dev server with watch → https://localhost:9999
```

### Regenerate Hex Data

The hex aggregation script lives one level up in the parent workspace:

```bash
# Requires Python with h3 + pandas
pip install h3 pandas
./.venv/bin/python scripts/build_hex_data.py
```

This reads `powerplants.csv`, filters solar ≥1 MW for the 6 target countries, assigns each plant to H3 cells at res-4 and res-5, and outputs `src/data/solarHexData.ts`.

## Architecture

```
src/
├── plugin.svelte          # Main UI — country toggles, gauge, top plants
├── pluginConfig.ts        # Plugin metadata (name, version, description)
├── hexOverlay.ts          # H3 hex polygon rendering + plasma colormap
├── constants.ts           # Geographic bounds, zoom thresholds
└── data/
    ├── solarHexData.ts    # Pre-computed H3 hex cells (auto-generated)
    ├── countries.ts       # Country metadata (flags, colors)
    └── czechSolar.ts      # CZ plant-level data (598 plants)
```

## License

Data: [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/) (PyPSA powerplantmatching)
Code: MIT
