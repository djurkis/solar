// Visual constants for the Central EU solar plugin

// Central EU bounds (DE + PL + CZ + AT + SK + HU)
export const EU_BOUNDS: L.LatLngBoundsExpression = [
    [45.7, 5.8],   // SW corner (southern Austria / Bavaria)
    [55.1, 24.2],  // NE corner (northern Poland)
];

// Legacy CZ-only bounds (used by mapLayers)
export const CZ_BOUNDS: L.LatLngBoundsExpression = [
    [48.55, 12.09],
    [51.06, 18.86],
];

// Plant marker sizing
export const MIN_MARKER_RADIUS = 3;
export const MAX_MARKER_RADIUS = 14;
export const MARKER_COLOR = '#FFD600';
export const MARKER_GLOW = 'rgba(255,214,0,0.35)';

// Zoom threshold for showing individual plant markers
export const PLANT_MARKER_ZOOM = 9;
