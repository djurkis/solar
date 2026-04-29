// Country metadata for the Central EU solar plugin

export interface Country {
    cc: string;
    name: string;
    flag: string;
    color: string;
}

export const countries: Country[] = [
    { cc: 'CZ', name: 'Czechia',  flag: '🇨🇿', color: '#FF6B6B' },
    { cc: 'DE', name: 'Germany',  flag: '🇩🇪', color: '#FFD600' },
    { cc: 'PL', name: 'Poland',   flag: '🇵🇱', color: '#4ECDC4' },
    { cc: 'AT', name: 'Austria',  flag: '🇦🇹', color: '#45B7D1' },
    { cc: 'SK', name: 'Slovakia', flag: '🇸🇰', color: '#96CEB4' },
    { cc: 'HU', name: 'Hungary',  flag: '🇭🇺', color: '#DDA0DD' },
];
