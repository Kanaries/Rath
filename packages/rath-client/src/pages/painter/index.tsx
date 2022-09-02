import { entropy,  IFieldMeta, IRow, liteGroupBy, rangeNormilize } from '@kanaries/loa';
import { observer } from 'mobx-react-lite';
import { PrimaryButton } from 'office-ui-fabric-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import embed, { vega, Result } from 'vega-embed';
import ReactVega from '../../components/react-vega';
import { IVegaSubset } from '../../interfaces';
import { useGlobalStore } from '../../store';
import { deepcopy } from '../../utils';

const LABEL_FIELD_KEY = '_lab_field';
const LABEL_INDEX = '_label_index';
const BIN_SIZE = 16

function vecAdd (mutVec: number[], inc: number[]) {
    const size = Math.min(mutVec.length, inc.length);
    for (let i = 0; i < size; i++) {
        mutVec[i] += inc[i];
    }
}

function getFreqMap (values: any[]): Map<any, number> {
    const counter: Map<any, number> = new Map();
    for (let val of values) {
        if (!counter.has(val)) {
            counter.set(val, 0)
        }
        counter.set(val, counter.get(val)! + 1)
    }
    return counter
}

export function getFreqRange (values: any[]): [any, number][] {
    const FM = getFreqMap(values);
    const sortedFM = [...FM.entries()].sort((a, b) => b[1] - a[1])
    return sortedFM.slice(0, BIN_SIZE);
}

export function binGroupByShareFreqRange (Y: any[], range: any[]): number[] {
    const fl: number[] = new Array(range.length).fill(0);
    const rangeIndices: Map<any, number> = new Map();
    // for (let val of range) {
    for (let i = 0; i < range.length; i++) {
        rangeIndices.set(range[i], i);
    }
    for (let val of Y) {
        if (rangeIndices.has(val)) {
            fl[rangeIndices.get(val)!]++;
        } else {
            fl[fl.length - 1]++;
        }
    }
    return fl;
}

function nnMic (X: any[], Y: any[]) {
    // const FM = getFreqMap(Y);
    // const globalRange = [...FM.keys()];
    const globalRange = getFreqRange(Y)

    const groups = liteGroupBy(Y, X)

    const sortedGroup = [...groups.entries()].sort((a, b) => b[1].length - a[1].length)
    // for (let group of sortedGroup)
    let usedGroupNum = sortedGroup.length
    // debugger
    let i = 0;
    let condH = 0;
    let globalFl = new Array(globalRange.length).fill(0);
    for (i = 0; i < usedGroupNum; i++) {
        const p = sortedGroup[i][1].length / Y.length;
        const subFl = binGroupByShareFreqRange(sortedGroup[i][1], globalRange.map(g => g[0]))
        const subEnt = entropy(rangeNormilize(subFl.filter(v => v > 0)))
        condH += subEnt * p;
        vecAdd(globalFl, subFl);
    }

    const H = entropy(rangeNormilize(globalFl.filter(v => v > 0)))
    return (H - condH) / Math.log2(globalRange.length)

}

const Painter: React.FC = props => {
    const container = useRef<HTMLDivElement>(null);
    const { dataSourceStore, commonStore, exploreStore } = useGlobalStore();
    const { cleanedData, fieldMetas } = dataSourceStore;
    const { mainViewPattern, mainViewSpec } = exploreStore;
    const [mutData, setMutData] = useState<IRow[]>([]);
    const [nearFields, setNearFields] = useState<IFieldMeta[]>([])

    useEffect(() => {
        setMutData(cleanedData.map((r, i) => {
            return { ...r, [LABEL_FIELD_KEY]: 'label1', [LABEL_INDEX]: i }
        }))
    }, [cleanedData, fieldMetas])

    const getNearFields = useCallback((data: IRow[]) => {
        const X = data.map(r => r[LABEL_FIELD_KEY])
        const ans: { field: IFieldMeta, score: number}[] = [];
        for (let field of fieldMetas) {
            if (field.semanticType !== 'quantitative') {
                const Y = data.map(r => r[field.fid])
                const score = nnMic(X, Y)
                ans.push({
                    field,
                    score
                })
            }
        }
        ans.sort((a, b) => b.score - a.score)
        setNearFields(ans.map(a => a.field));
        console.log(ans);
    }, [fieldMetas])

    const noViz = mutData.length === 0 || fieldMetas.length === 0 || mainViewPattern === null || mainViewSpec === null;
    useEffect(() => {
        if (!noViz && container.current) {
            const mvd: any = {
                ...deepcopy(mainViewSpec),
                data: {
                    name: 'dataSource'
                    // values: mutData
                }
            }
            mvd.encoding.color = {
                field: LABEL_FIELD_KEY,
                type: 'nominal',
                title: 'custom feature',
                scale: {
                    domain: ['label1', 'label2']
                }
            }
            
            // @ts-ignore
            embed(container.current, mvd, {
                actions: true
            }).then(res => {
                res.view.change('dataSource', vega.changeset().remove(() => true).insert(mutData))
                res.view.addEventListener('mouseover', (e, item) => {
                    if (item && item.datum) {
                        // @ts-ignore
                        const index = item.datum[LABEL_INDEX];
                        mutData[index][LABEL_FIELD_KEY] = 'label2'
                        res.view.change('dataSource', vega.changeset().remove(() => true).insert(mutData))
                    }
                })
            })
        }
    }, [noViz, mainViewSpec, mutData])

    const nearSpec = useMemo<IVegaSubset | null>(() => {
        if (nearFields.length > 0) {
            const mvd: any = {
                ...deepcopy(mainViewSpec),
                data: {
                    name: 'dataSource'
                    // values: mutData
                }
            }
            mvd.encoding.color = {
                field: nearFields[0].fid,
                type: nearFields[0].semanticType,
                title: nearFields[0].name || nearFields[0].fid
            }
            return mvd
        }
        return null;
    }, [mainViewSpec, nearFields])
    if (noViz) {
        return <div>404</div>
    }
    return <div>
        <div ref={container}></div>
        <PrimaryButton
            text='check'
            onClick={() => {
                getNearFields(mutData)
            }}
        />
        <div>
            {
                nearSpec && <ReactVega
                    spec={nearSpec}
                    dataSource={cleanedData}
                />
            }
        </div>
    </div>
}

export default observer(Painter);