import { VegaGlobalConfig } from './config';

const markColor = '#3e5c69';

const voxTheme: VegaGlobalConfig = {
    arc: { fill: markColor },
    area: { fill: markColor },
    path: { stroke: markColor },
    rect: { fill: markColor },
    shape: { stroke: markColor },
    symbol: { stroke: markColor },
    circle: { fill: markColor },
    bar: { fill: markColor },
    point: { fill: markColor },
    tick: { fill: markColor },
    line: { fill: markColor },

    axis: {
        domainWidth: 0.5,
        grid: true,
        labelPadding: 2,
        tickSize: 5,
        tickWidth: 0.5,
        titleFontWeight: 'normal',
    },

    axisBand: {
        grid: false,
    },

    axisX: {
        gridWidth: 0.2,
    },

    axisY: {
        gridDash: [3],
        gridWidth: 0.4,
    },

    legend: {
        labelFontSize: 11,
        padding: 1,
        symbolType: 'square',
    },

    range: {
        category: ['#3e5c69', '#6793a6', '#182429', '#0570b0', '#3690c0', '#74a9cf', '#a6bddb', '#e2ddf2'],
    },
};

export default voxTheme;
