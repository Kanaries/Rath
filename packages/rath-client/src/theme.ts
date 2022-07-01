import { createTheme } from 'office-ui-fabric-react'

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
}
export const RATH_DARK_THEME = createTheme({
    palette: RATH_DARK_PALETTE
});

// export function applyThemeForSideEffects () {
//     document.getElementsByTagName("body")[0]!.
// }