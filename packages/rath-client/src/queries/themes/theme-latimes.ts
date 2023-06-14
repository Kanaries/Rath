import { VegaGlobalConfig } from './config';

const headlineFontSize = 22;
const headlineFontWeight = 'normal';
const labelFont = 'Benton Gothic, sans-serif';
const labelFontSize = 11.5;
const labelFontWeight = 'normal';
const markColor = '#82c6df';
// const markHighlight = '#006d8f';
// const markDemocrat = '#5789b8';
// const markRepublican = '#d94f54';
const titleFont = 'Benton Gothic Bold, sans-serif';
const titleFontWeight = 'normal';
const titleFontSize = 13;

const colorSchemes = {
    'category-6': ['#ec8431', '#829eb1', '#c89d29', '#3580b1', '#adc839', '#ab7fb4'],
    'fire-7': ['#fbf2c7', '#f9e39c', '#f8d36e', '#f4bb6a', '#e68a4f', '#d15a40', '#ab4232'],
    'fireandice-6': ['#e68a4f', '#f4bb6a', '#f9e39c', '#dadfe2', '#a6b7c6', '#849eae'],
    'ice-7': ['#edefee', '#dadfe2', '#c4ccd2', '#a6b7c6', '#849eae', '#607785', '#47525d'],
};

const latimesTheme: VegaGlobalConfig = {

    title: {
        anchor: 'start',
        color: '#000000',
        font: titleFont,
        fontSize: headlineFontSize,
        fontWeight: headlineFontWeight,
    },

    arc: { fill: markColor },
    area: { fill: markColor },
    line: { stroke: markColor, strokeWidth: 2 },
    path: { stroke: markColor },
    rect: { fill: markColor },
    shape: { stroke: markColor },
    symbol: { fill: markColor, size: 30 },

    axis: {
        labelFont,
        labelFontSize,
        labelFontWeight,
        titleFont,
        titleFontSize,
        titleFontWeight,
    },

    axisX: {
        labelAngle: 0,
        labelPadding: 4,
        tickSize: 3,
    },

    axisY: {
        labelBaseline: 'middle',
        maxExtent: 45,
        minExtent: 45,
        tickSize: 2,
        titleAlign: 'left',
        titleAngle: 0,
        titleX: -45,
        titleY: -11,
    },

    legend: {
        labelFont,
        labelFontSize,
        symbolType: 'square',
        titleFont,
        titleFontSize,
        titleFontWeight,
    },

    range: {
        category: colorSchemes['category-6'],
        diverging: colorSchemes['fireandice-6'],
        heatmap: colorSchemes['fire-7'],
        ordinal: colorSchemes['fire-7'],
        ramp: colorSchemes['fire-7'],
    },
};

export default latimesTheme;
