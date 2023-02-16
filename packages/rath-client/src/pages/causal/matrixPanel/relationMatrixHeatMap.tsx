import intl from 'react-intl-universal';
import { ActionButton } from '@fluentui/react';
import type { DeepReadonly } from '@kanaries/graphic-walker/dist/interfaces';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import embed from 'vega-embed';
import { IFieldMeta, IRow } from '../../../interfaces';

interface Props {
    data: DeepReadonly<number[][]>;
    fields: DeepReadonly<IFieldMeta[]>;
    absolute?: boolean;
    mark?: string;
    onSelect?: (xFieldId: string, yFieldId: string) => void;
}

/** 调试用的，不需要的时候干掉 */
type GraphData = {
    nodes: { id: string }[];
    edges: { source: string; target: string }[];
};
/** 调试用的，不需要的时候干掉 */
const ExportGraphButton: React.FC<Props> = ({ data, fields }) => {
    const value = useMemo<File>(() => {
        const graph: GraphData = {
            nodes: fields.map(f => ({ id: f.name || f.fid, name: f.name || f.fid })),
            edges: [],
        };
        for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < data[i].length; j++) {
                if (i === j) {
                    continue;
                } else if (data[i][j]) {
                    graph.edges.push({
                        source: fields[i].name || fields[i].fid,
                        target: fields[j].name || fields[j].fid,
                    });
                }
            }
        }
        return new File([JSON.stringify(graph, undefined, 2)], `test - ${new Date().toLocaleString()}.json`);
    }, [data, fields]);
    const dataUrlRef = useRef('');
    useEffect(() => {
        dataUrlRef.current = URL.createObjectURL(value);
        return () => {
            URL.revokeObjectURL(dataUrlRef.current);
        };
    }, [value]);
    const handleExport = useCallback(() => {
        const a = document.createElement('a');
        a.href = dataUrlRef.current;
        a.download = value.name;
        a.click();
        a.remove();
    }, [value.name]);
    return (
        <ActionButton iconProps={{ iconName: 'Download' }} onClick={handleExport}>
            {intl.get('causal.actions.export_diagram')}
        </ActionButton>
    );
};

const RelationMatrixHeatMap: React.FC<Props> = (props) => {
    const { data, fields, absolute, onSelect, mark = 'circle' } = props;
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
                mark: { type: mark as any, tooltip: true },
                transform: !absolute ? [{ calculate: 'abs(datum.value)', as: 'abs_value' }] : [],
                encoding: {
                    y: { field: 'x', type: 'nominal' },
                    x: { field: 'y', type: 'nominal' },
                    color: { field: 'value', type: 'quantitative', scale: { scheme: absolute ? 'yellowgreenblue' : 'redblue' } },
                    size: { field: absolute ? 'value' : 'abs_value' , type: 'quantitative', scale: { domain: [0, 1]} },
                },
                config: {
                    axis: { grid: true, tickBand: 'extent' }
                },
            }, { actions: true }).then(res => {
                res.view.addEventListener('click', (event, item) => {
                    if (item && item.datum) {
                        onSelect && onSelect(item.datum.X_FID, item.datum.Y_FID);
                    }
                })
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [values, absolute, mark]);
    return (
        <>
            <div ref={container}></div>
            {/* 非 absolute 的情况即因果发现，由于各个算法规则不同，需要在下方的视图导出；这里只做关联矩阵的 */}
            {absolute && <ExportGraphButton {...props} />}
        </>
    );
};

export default RelationMatrixHeatMap;
