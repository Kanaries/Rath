import { VegaGlobalConfig } from './config';

const markColor = '#4572a7';

const excelTheme: VegaGlobalConfig = {

    arc: { fill: markColor },
    area: { fill: markColor },
    line: { stroke: markColor, strokeWidth: 2 },
    path: { stroke: markColor },
    rect: { fill: markColor },
    shape: { stroke: markColor },
    circle: { fill: markColor },
    bar: { fill: markColor },
    point: { fill: markColor },
    tick: { fill: markColor },
    symbol: { fill: markColor, strokeWidth: 1.5, size: 50 },

    axis: {
        bandPosition: 0.5,
        grid: true,
        gridColor: '#000000',
        gridOpacity: 1,
        gridWidth: 0.5,
        labelPadding: 10,
        tickSize: 5,
        tickWidth: 0.5,
    },

    axisBand: {
        grid: false,
        tickExtra: true,
    },

    legend: {
        labelBaseline: 'middle',
        labelFontSize: 11,
        symbolSize: 50,
        symbolType: 'square',
    },

    range: {
        category: ['#4572a7', '#aa4643', '#8aa453', '#71598e', '#4598ae', '#d98445', '#94aace', '#d09393', '#b9cc98', '#a99cbc'],
    },
};

export default excelTheme;
