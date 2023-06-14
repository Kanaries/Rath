import { VegaGlobalConfig } from './config';

const ptToPx = (value: number) => value * (1 / 3 + 1);

const fontSmallPx = ptToPx(9);
const legendFontPx = ptToPx(10);
const fontLargePx = ptToPx(12);
const fontStandard = 'Segoe UI';
const fontTitle = 'wf_standard-font, helvetica, arial, sans-serif';
const firstLevelElementColor = '#252423';
const secondLevelElementColor = '#605E5C';
const backgroundSecondaryColor = '#C8C6C4';
const paletteColor1 = '#118DFF';
const paletteColor2 = '#12239E';
const paletteColor3 = '#E66C37';
const paletteColor4 = '#6B007B';
const paletteColor5 = '#E044A7';
const paletteColor6 = '#744EC2';
const paletteColor7 = '#D9B300';
const paletteColor8 = '#D64550';
const divergentColorMax = paletteColor1;
const divergentColorMin = '#DEEFFF';
const divergentPalette = [divergentColorMin, divergentColorMax];
const ordinalPalette = [divergentColorMin, '#c7e4ff', '#b0d9ff', '#9aceff', '#83c3ff', '#6cb9ff', '#55aeff', '#3fa3ff', '#2898ff', divergentColorMax];

const powerbiTheme: VegaGlobalConfig = {
    font: fontStandard,
    header: {
        titleFont: fontTitle,
        titleFontSize: fontLargePx,
        titleColor: firstLevelElementColor,
        labelFont: fontStandard,
        labelFontSize: legendFontPx,
        labelColor: secondLevelElementColor,
    },
    axis: {
        ticks: false,
        grid: false,
        domain: false,
        labelColor: secondLevelElementColor,
        labelFontSize: fontSmallPx,
        titleFont: fontTitle,
        titleColor: firstLevelElementColor,
        titleFontSize: fontLargePx,
        titleFontWeight: 'normal',
    },
    axisQuantitative: {
        tickCount: 3,
        grid: true,
        gridColor: backgroundSecondaryColor,
        gridDash: [1, 5],
        labelFlush: false,
    },
    axisBand: { tickExtra: true },
    axisX: { labelPadding: 5 },
    axisY: { labelPadding: 10 },
    bar: { fill: paletteColor1 },
    line: {
        stroke: paletteColor1,
        strokeWidth: 3,
        strokeCap: 'round',
        strokeJoin: 'round',
    },
    text: { font: fontStandard, fontSize: fontSmallPx, fill: secondLevelElementColor },
    arc: { fill: paletteColor1 },
    area: { fill: paletteColor1, line: true, opacity: 0.6 },
    path: { stroke: paletteColor1 },
    rect: { fill: paletteColor1 },
    point: { fill: paletteColor1, filled: true, size: 75 },
    shape: { stroke: paletteColor1 },
    symbol: { fill: paletteColor1, strokeWidth: 1.5, size: 50 },
    legend: {
        titleFont: fontStandard,
        titleFontWeight: 'bold',
        titleColor: secondLevelElementColor,
        labelFont: fontStandard,
        labelFontSize: legendFontPx,
        labelColor: secondLevelElementColor,
        symbolType: 'circle',
        symbolSize: 75,
    },
    range: {
        category: [paletteColor1, paletteColor2, paletteColor3, paletteColor4, paletteColor5, paletteColor6, paletteColor7, paletteColor8],
        diverging: divergentPalette,
        heatmap: divergentPalette,
        ordinal: ordinalPalette,
    },
};

export default powerbiTheme;
