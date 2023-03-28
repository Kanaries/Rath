const DEFAULT_COLOR = "#5B8FF9";
const g2Theme: any = {
    area: { fill: DEFAULT_COLOR },
    bar: { fill: DEFAULT_COLOR },
    circle: { fill: DEFAULT_COLOR },
    line: { stroke: DEFAULT_COLOR },
    point: { stroke: DEFAULT_COLOR },
    rect: { fill: DEFAULT_COLOR },
    tick: { stroke: DEFAULT_COLOR },
    boxplot: { fill: DEFAULT_COLOR },
    errorbar: { stroke: DEFAULT_COLOR },
    errorband: { fill: DEFAULT_COLOR },
    arc: { fill: DEFAULT_COLOR },
    background: "transparent",
    range: {
        category: [
            "#5B8FF9",
            "#61DDAA",
            "#65789B",
            "#F6BD16",
            "#7262FD",
            "#78D3F8",
            "#9661BC",
            "#F6903D",
            "#008685",
            "#F08BB4",
        ],
        diverging: ["#7b3294", "#c2a5cf", "#f7f7f7", "#a6dba0", "#008837"],
        heatmap: ["#000000", "#7b3294", "#c2a5cf", "#f7f7f7", "#a6dba0", "#008837"],
        // ordinal: [
        //     '#B8E1FF',
        //     // '#9AC5FF',
        //     // '#7DAAFF',
        //     // '#5B8FF9',
        //     // '#3D76DD',
        //     // '#085EC0',
        //     // '#0047A5',
        //     // '#00318A',
        //     '#001D70'
        // ],
        ramp: [
            "#EBCCFF",
            "#CCB0FF",
            "#AE95FF",
            "#907BFF",
            "#7262FD",
            "#5349E0",
            "#2F32C3",
            "#001BA7",
            "#00068C"
        ],
    },
    scale: {
        continuous: { range: ["#f7fbff", "#08306b"] },
    },
}

export default g2Theme;
