import React, { useCallback, useMemo, useState } from 'react';
import { useId } from '@fluentui/react-hooks';
import produce from 'immer';
import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Callout, ChoiceGroup, DefaultButton, PrimaryButton, Stack, Selection, SelectionMode, Toggle, ActionButton } from '@fluentui/react';
import intl from 'react-intl-universal';
import { IFilter } from '../../interfaces';
import { useGlobalStore } from '../../store';
import RangeSelection from './rangeSelection';
import SetSelection from './setSelection';



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

    const fieldValues = useMemo(() => rawData.map(r => r[fid]), [rawData, fid]);

    const [filter, setFilter] = useState<IFilter>((meta && meta.semanticType === 'quantitative') ? {
        fid,
        type: 'range',
        range: [0, 0],
    } : {
        fid,
        type: 'set',
        values: []
    })

    const selection = useMemo(() => {
        return new Selection({
            selectionMode: SelectionMode.multiple,
            onSelectionChanged: () => {},
            // items: meta.distribution,
            // getKey: () => ''
        })
    }, [])

    const submitFilter = useCallback(() => {
        if (filter.type === 'range') {
            dataSourceStore.setFilter(filter);
        } else {
            if (meta?.distribution) {
                const nextFilter: IFilter = {
                    ...filter,
                    values: selection.getSelectedIndices().map(i => meta.distribution[i].memberName)
                }
                dataSourceStore.setFilter(nextFilter);
            }
        }
        setShowFilterConfig(false);
    }, [filter, meta?.distribution, dataSourceStore, selection])

    const toggleShowFilter = useCallback(() => {
        setShowFilterConfig(v => !v);
    }, [])

    const onRangeValueChange = useCallback((v: number, r: [number, number]) => {
        setFilter(f => {
            const nextF = produce(f, draft => {
                if (draft.type === 'range' && r) {
                    draft.range = r
                }
            })
            return nextF
        })
    }, [])

    return <div>
        <ActionButton
            text={intl.get('common.filter')}
            iconProps={{ iconName: 'filter' }}
            onClick={toggleShowFilter}
        />
        {
            showFilterConfig && <Callout target={`#${buttonId}`}
                    onDismiss={toggleShowFilter}
                >
                <div style={{ padding: '1em', minWidth: '400px'}}>

                <h2>Filter Config</h2>
                <Toggle
                    onText='Apply'
                    offText='Disable'
                    label="Filter"
                    checked={!filter.disable}
                    onChange={(e, checked) => {
                        setFilter(f => ({
                            ...f,
                            disable: !checked
                        }))
                    }}
                />
                <div>
                    <ChoiceGroup
                        label="Filter by"
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
                    filter.type === 'set' && meta && <SetSelection
                        dist={toJS(meta.distribution)}
                        selection={selection}
                    />
                }
                {
                    filter.type === 'range' && meta && <RangeSelection
                        values={fieldValues}
                        left={filter.range[0]}
                        right={filter.range[1]}
                        onValueChange={onRangeValueChange}
                    />
                }
                <Stack horizontal>
                    <PrimaryButton
                        text="Submit"
                        onClick={submitFilter}
                    />
                    <DefaultButton
                        style={{ marginLeft: '1em' }}
                        text="Cancel"
                        onClick={toggleShowFilter}
                    />
                </Stack>
                </div>
                
            </Callout>
        }
    </div>
}

export default observer(FieldFilter);
