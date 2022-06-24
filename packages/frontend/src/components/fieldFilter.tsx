import { useId } from '@uifabric/react-hooks';
import produce from 'immer';
import { observer } from 'mobx-react-lite';
import { Callout, ChoiceGroup, DefaultButton, DetailsList, SelectionMode, Slider } from 'office-ui-fabric-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { IFilter } from '../interfaces';
import { useGlobalStore } from '../store';


interface FieldFilterProps {
    fid: string;
}
const FieldFilter: React.FC<FieldFilterProps> = props => {
    const { fid } = props;
    const buttonId = useId('filter-button');
    const [showFilterConfig, setShowFilterConfig] = useState<boolean>(false);
    const { dataSourceStore } = useGlobalStore();

    const meta = dataSourceStore.fieldMetas.find(fm => fm.fid === fid);

    const { rawData } = dataSourceStore;

    const [filter, setFilter] = useState<IFilter>({
        fid: fid,
        type: 'set',
        values: [],
    })


    const fieldRange = useMemo<[number, number]>(() => {
        if (meta && meta.semanticType === 'quantitative') {
            const values = rawData.map(r => r[fid]).filter(v => typeof v === 'number')
            return [
                Math.min(...values),
                Math.max(...values)
            ]
        }
        return [0, 0]
    }, [meta, fid, rawData])
    // const 
    const submitFilter = useCallback(() => {
        dataSourceStore.setFilter(filter);
        setShowFilterConfig(false);
    }, [filter, dataSourceStore])
    return <div>
        <DefaultButton id={buttonId}
            text="Filter"
            onClick={() => {setShowFilterConfig(v => !v)}}
        />
        {
            showFilterConfig && <Callout target={`#${buttonId}`}
                    onDismiss={() => { setShowFilterConfig(v => !v) }}
                >
                <div style={{ padding: '1em', minWidth: '400px'}}>

                <h2>Filter Config</h2>
                <div>
                    <ChoiceGroup
                        options={[
                            { key: 'range', text: 'range' },
                            { key: 'set', text: 'set'}
                        ]}
                        selectedKey={filter.type}
                        onChange={(ev, op) => {
                            if (op) {
                                setFilter(f => {
                                    const nextF = produce(f, draft => {
                                        draft.type = op.key as any
                                        if (draft.type === 'set') {
                                            draft.values = []
                                        } else {
                                            draft.range = [0, 0]
                                        }
                                    })
                                    return nextF;
                                })
                            }
                        }}
                    />
                </div>
                {
                    filter.type === 'set' && meta && <DetailsList
                        selectionMode={SelectionMode.multiple}
                        onItemInvoked={(p) => {
                            console.log(p);
                        }}
                        columns={[
                            {
                                key: 'memberName',
                                name: 'Member Name',
                                fieldName: 'memberName',
                                minWidth: 80
                            },
                            {
                                key: 'count',
                                name: 'Member Count',
                                fieldName: 'count',
                                minWidth: 40
                            }
                        ]}
                        compact
                        items={meta.distribution}
                    />
                }
                {
                    filter.type === 'range' && meta && <div>
                        range
                        <Slider
                            min={fieldRange[0]}
                            max={fieldRange[1]}
                            value={filter.range[1]}
                            lowerValue={filter.range[0]}
                            ranged
                            onChange={(v, r) => {
                                setFilter(f => {
                                    const nextF = produce(f, draft => {
                                        if (draft.type === 'range' && r) {
                                            draft.range = r
                                        }
                                    })
                                    return nextF
                                })
                            }}
                        />
                    </div>
                }
                <DefaultButton
                    text="Submit"
                    onClick={submitFilter}
                />
                </div>
                
            </Callout>
        }
    </div>
}

export default observer(FieldFilter);
