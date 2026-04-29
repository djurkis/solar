import type { ExternalPluginConfig } from '@windy/interfaces';

const config: ExternalPluginConfig = {
    name: 'windy-plugin-eu-solar',
    version: '2.1.0',
    icon: '☀️',
    title: 'Central EU Solar Capacity',
    description: 'Visualize 10,000+ solar PV plants (49 GW) across CZ, DE, PL, AT, SK, HU with H3 hexagonal density overlay and plant-level details.',
    author: 'jurkis',
    repository: 'https://github.com/jurkis/windy-plugin-eu-solar',
    desktopUI: 'rhpane',
    mobileUI: 'small',
    routerPath: '/eu-solar',
    private: false,
};

export default config;
