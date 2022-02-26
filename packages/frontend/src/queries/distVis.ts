import { DataSource } from "../global";
import { IFieldMeta } from "../interfaces";
export const geomTypeMap: { [key: string]: any } = {
    interval: "boxplot",
    line: "line",
    point: "point",
    // density: 'rect'
    density: "point"
};
const channels = [
    'x', 'y',
    'color',
    'rows',
    'columns'
];
interface BaseVisProps {
    // dataSource: DataSource;
    measures: IFieldMeta[];
}

function fastEncoding(fields: IFieldMeta[]) {
    let encoding: any = {}
    if (fields.length === 1) {
        encoding.x = {
            field: fields[0].fid,
            type: 'ordinal',
            bin: true
        }
        encoding.y = {
            aggregate: 'count'
        }
    } else {
        let usedFieldSize = Math.min(fields.length, channels.length);
        for (let i = 0; i < usedFieldSize; i++) {
            encoding[channels[i]] = {
                field: fields[i].fid,
                type: fields[i].semanticType
            }
        }
    }
    return encoding
}

export function distVis(props: BaseVisProps) {
    const {
        // dataSource,
        // dimensions,
        measures,
    } = props;
    let markType = measures.length === 1 ? 'bar' : 'point';

    let basicSpec: any = {
        // width: chartWidth,\
        data: {
            name: 'dataSource'
            // values: dataSource
        },
        mark: {
            type: markType
        },
        encoding: fastEncoding(measures)
    };


    return basicSpec;
}
