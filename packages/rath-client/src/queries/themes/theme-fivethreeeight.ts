import { VegaGlobalConfig } from './config';

const markColor = '#30a2da';
const axisColor = '#cbcbcb';
const guideLabelColor = '#999';
const guideTitleColor = '#333';
const blackTitle = '#333';

const fiveThirtyEightTheme: VegaGlobalConfig = {
    arc: { fill: markColor },
    area: { fill: markColor },

    axis: {
        domainColor: axisColor,
        grid: true,
        gridColor: axisColor,
        gridWidth: 1,
        labelColor: guideLabelColor,
        labelFontSize: 10,
        titleColor: guideTitleColor,
        tickColor: axisColor,
        tickSize: 10,
        titleFontSize: 14,
        titlePadding: 10,
        labelPadding: 4,
    },
    circle: { fill: markColor },
    tick: { fill: markColor },

    axisBand: {
        grid: false,
    },

    legend: {
        labelColor: blackTitle,
        labelFontSize: 11,
        padding: 1,
        symbolSize: 30,
        symbolType: 'square',
        titleColor: blackTitle,
        titleFontSize: 14,
        titlePadding: 10,
    },

    line: {
        stroke: markColor,
        strokeWidth: 2,
    },

    path: { stroke: markColor, strokeWidth: 0.5 },
    rect: { fill: markColor },

    range: {
        category: [
            '#30a2da',
            '#fc4f30',
            '#e5ae38',
            '#6d904f',
            '#8b8b8b',
            '#b96db8',
            '#ff9e27',
            '#56cc60',
            '#52d2ca',
            '#52689e',
            '#545454',
            '#9fe4f8',
        ],

        diverging: ['#cc0020', '#e77866', '#f6e7e1', '#d6e8ed', '#91bfd9', '#1d78b5'],
        heatmap: ['#d6e8ed', '#cee0e5', '#91bfd9', '#549cc6', '#1d78b5'],
    },

    point: {
        filled: true,
        shape: 'circle',
    },

    shape: { stroke: markColor },
    
    bar: {
        binSpacing: 2,
        fill: markColor,
        stroke: null,
    },

    title: {
        anchor: 'start',
        fontSize: 24,
        fontWeight: 600,
        offset: 20,
    },
};

export default fiveThirtyEightTheme;
