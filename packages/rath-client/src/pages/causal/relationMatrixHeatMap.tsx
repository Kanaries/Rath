import React, { useEffect, useMemo, useRef } from 'react';
import embed from 'vega-embed';
import { IFieldMeta, IRow } from '../../interfaces';

interface Props {
    data: number[][];
    fields: IFieldMeta[];
    absolute?: boolean;
    onSelect?: (xFieldId: string, yFieldId: string) => void;
}
const RelationMatrixHeatMap: React.FC<Props> = (props) => {
    const { data, fields, absolute, onSelect } = props;
    const container = useRef<HTMLDivElement>(null);
    const values = useMemo<IRow[]>(() => {
        const ans: IRow[] = [];
        for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < data[i].length; j++) {
                ans.push({
                    x: fields[i].name || fields[i].fid,
                    y: fields[j].name || fields[j].fid,
                    X_FID: fields[i].fid,
                    Y_FID: fields[j].fid,
                    value: i===j ? 0 : data[i][j],
                });
            }
        }
        return ans;
    }, [data, fields]);
    useEffect(() => {
        if (container.current) {
            embed(container.current, {
                data: { values },
                mark: 'circle',
                transform: !absolute ? [{ calculate: 'abs(datum.value)', as: 'abs_value' }] : [],
                encoding: {
                    y: { field: 'x', type: 'nominal' },
                    x: { field: 'y', type: 'nominal' },
                    color: { field: 'value', type: 'quantitative', scale: { scheme: absolute ? 'yellowgreenblue' : 'spectral' } },
                    size: { field: absolute ? 'value' : 'abs_value' , type: 'quantitative' },
                },
                config: {
                    axis: { grid: true, tickBand: 'extent' },
                },
            }).then(res => {
                res.view.addEventListener('click', (event, item) => {
                    if (item && item.datum) {
                        console.log(item.datum);
                        onSelect && onSelect(item.datum.X_FID, item.datum.Y_FID);
                    }
                })
            });
        }
    }, [values, absolute]);
    return <div ref={container}></div>;
};

export default RelationMatrixHeatMap;
