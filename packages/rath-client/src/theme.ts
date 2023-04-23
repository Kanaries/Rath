import { createTheme } from '@fluentui/react';
import { webLightTheme, Theme } from '@fluentui/react-components';

const HOVER_PINK = '#e43ba6';
export const customLightTheme: Theme = {
    ...webLightTheme,
    colorBrandBackground: '#0f0f0f',
    colorBrandBackgroundHover: HOVER_PINK,
    lineHeightBase200: '1em',
    colorCompoundBrandStroke: '#0f0f0f',
    colorCompoundBrandStrokeHover: HOVER_PINK,
};

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
export const RATH_DARK_THEME = createTheme({
    palette: RATH_DARK_PALETTE,
});

export const mainTheme = createTheme({
    palette: {
        themePrimary: '#0f0f0f',
        themeLighterAlt: '#e2e2e2',
        themeLighter: '#c8c8c8',
        themeLight: '#aeaeae',
        themeTertiary: '#939393',
        themeSecondary: '#797979',
        themeDarkAlt: '#5e5e5e',
        themeDark: '#444444',
        themeDarker: '#2a2a2a',
        neutralLighterAlt: '#faf9f8',
        neutralLighter: '#f3f2f1',
        neutralLight: '#edebe9',
        neutralQuaternaryAlt: '#e1dfdd',
        neutralQuaternary: '#d0d0d0',
        neutralTertiaryAlt: '#c8c6c4',
        neutralTertiary: '#a19f9d',
        neutralSecondary: '#605e5c',
        neutralSecondaryAlt: '#8a8886',
        neutralPrimaryAlt: '#3b3a39',
        neutralPrimary: '#323130',
        neutralDark: '#201f1e',
        black: '#000000',
        white: '#ffffff',
    },
    semanticColors: {
        buttonBorder: '#e6e6e6',
        buttonText: '#888',
        inputBorder: '#e6e6e6',
        inputIcon: '#e6e6e6',
        focusBorder: 'red',
        smallInputBorder: '#666',
    },
});

export const RATH_THEME_CONFIG = {
    // dimensionColor: '#9C67F1',
    // measureColor: '#0ACBF9',
    dimensionColor: '#1890ff',
    measureColor: '#13c2c2',
    disableColor: '#9e9e9e',
    previewColor: '#faad14',
};
// #3371D7
// export function applyThemeForSideEffects () {
//     document.getElementsByTagName("body")[0]!.
// }
