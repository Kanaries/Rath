import { createTheme } from '@fluentui/react';

export const RATH_DARK_PALETTE = {
    themePrimary: '#38fcff',
    themeLighterAlt: '#020a0a',
    themeLighter: '#092829',
    themeLight: '#114c4d',
    themeTertiary: '#229799',
    themeSecondary: '#31dde0',
    themeDarkAlt: '#4cfcff',
    themeDark: '#68fcff',
    themeDarker: '#90fdff',
    neutralLighterAlt: '#1a1a1a',
    neutralLighter: '#232323',
    neutralLight: '#323232',
    neutralQuaternaryAlt: '#3b3b3b',
    neutralQuaternary: '#434343',
    neutralTertiaryAlt: '#636363',
    neutralTertiary: '#eaeaea',
    neutralSecondary: '#eeeeee',
    neutralPrimaryAlt: '#f1f1f1',
    neutralPrimary: '#e0e0e0',
    neutralDark: '#f8f8f8',
    black: '#fbfbfb',
    white: '#0f0f0f',
};
export const RATH_INDIGO_PALETTE = {
    themePrimary: '#4f46e5',
    themeLighterAlt: '#f7f7fe',
    themeLighter: '#e1dffb',
    themeLight: '#c7c4f7',
    themeTertiary: '#918cf0',
    themeSecondary: '#625be9',
    themeDarkAlt: '#4740cf',
    themeDark: '#3c36ae',
    themeDarker: '#2c2881',
    neutralLighterAlt: '#faf9f8',
    neutralLighter: '#f3f2f1',
    neutralLight: '#edebe9',
    neutralQuaternaryAlt: '#e1dfdd',
    neutralQuaternary: '#d0d0d0',
    neutralTertiaryAlt: '#c8c6c4',
    neutralTertiary: '#bab8b7',
    neutralSecondary: '#a3a2a0',
    neutralSecondaryAlt: '#a3a2a0',
    neutralPrimaryAlt: '#8d8b8a',
    neutralPrimary: '#323130',
    neutralDark: '#605e5d',
    black: '#494847',
    white: '#ffffff',
};
export const RATH_DARK_THEME = createTheme({
    palette: RATH_DARK_PALETTE,
});

export const mainTheme = createTheme({
    palette: RATH_INDIGO_PALETTE,
    semanticColors: {
        buttonBorder: '#d1d5db', //'#e6e6e6',
        buttonText: '#888',
        inputBorder: '#d1d5db',
        inputIcon: '#d1d5db',
        smallInputBorder: '#666',
    },
});

export const RATH_THEME_CONFIG = {
    // dimensionColor: '#9C67F1',
    // measureColor: '#0ACBF9',
    dimensionColor: '#1890ff',
    measureColor: '#13c2c2',
    disableColor: '#9e9e9e',
    previewColor: '#faad14'
}
// #3371D7
// export function applyThemeForSideEffects () {
//     document.getElementsByTagName("body")[0]!.
// }
