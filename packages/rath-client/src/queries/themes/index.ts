import { VegaThemeConfig } from './config';

import { default as VIS_GOOGLE_THEME } from './theme-googlecharts';
import { default as VIS_GGPLOT2_THEME } from './theme-ggplot2';
import { default as VIS_VOX_THEME } from './theme-vox';
import { default as VIS_POWERBI_THEME } from './theme-powerbi';
import { default as VIS_538_THEME } from './theme-fivethreeeight'
import { default as VIS_EXCEL_THEME } from './theme-excel';
import { default as VIS_LATIMES_THEME } from './theme-latimes'

export enum THEME_KEYS {
    googlecharts = 'googlecharts',
    ggplot2 = 'ggplot',
    default = 'default',
    vox = 'vox',
    powerbi = 'powerbi',
    fivethreeeight = '538',
    excel = 'excel',
    latimes = 'latimes'
}

export function visThemeParser (themeKey?: string): VegaThemeConfig | undefined {
    if (typeof themeKey === 'undefined') return;
    switch (themeKey) {
        case THEME_KEYS.googlecharts:
            return VIS_GOOGLE_THEME;
        case THEME_KEYS.powerbi:
            return VIS_POWERBI_THEME;
        case THEME_KEYS.ggplot2:
            return VIS_GGPLOT2_THEME;
        case THEME_KEYS.vox:
            return VIS_VOX_THEME;
        case THEME_KEYS.excel:
            return VIS_EXCEL_THEME;
        case THEME_KEYS.fivethreeeight:
            return VIS_538_THEME;
        case THEME_KEYS.latimes:
            return VIS_LATIMES_THEME;
        case THEME_KEYS.default:
        default:
            return;
    }
}