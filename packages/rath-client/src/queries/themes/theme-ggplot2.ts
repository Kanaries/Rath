import { VegaGlobalConfig } from './config';

const markColor = '#000';

const ggplot2Theme: VegaGlobalConfig = {

    arc: { fill: markColor },
    area: { fill: markColor },
    path: { stroke: markColor },
    rect: { fill: markColor },
    shape: { stroke: markColor },
    circle: { fill: markColor },
    bar: { fill: markColor },
    point: { fill: markColor },
    tick: { fill: markColor },
    line: { fill: markColor },
    symbol: { fill: markColor, size: 40 },

    axis: {
        domain: false,
        grid: true,
        gridColor: '#FFFFFF',
        gridOpacity: 1,
        labelColor: '#7F7F7F',
        labelPadding: 4,
        tickColor: '#7F7F7F',
        tickSize: 5.67,
        titleFontSize: 16,
        titleFontWeight: 'normal',
    },

    legend: {
        labelBaseline: 'middle',
        labelFontSize: 11,
        symbolSize: 40,
    },

    range: {
        category: ['#000000', '#7F7F7F', '#1A1A1A', '#999999', '#333333', '#B0B0B0', '#4D4D4D', '#C9C9C9', '#666666', '#DCDCDC'],
    },
};

export default ggplot2Theme;
