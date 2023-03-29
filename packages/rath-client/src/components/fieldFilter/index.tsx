import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { getOriginalRange } from './originalRange';

interface FieldFilterProps {
    fid: string;
}

const FieldFilter: React.FC<FieldFilterProps> = props => {
    const { fid } = props;
    const buttonId = useId('filter-button');
    const [showFilterConfig, setShowFilterConfig] = useState<boolean>(false);
    const { dataSourceStore } = useGlobalStore();

    const meta = dataSourceStore.fieldMetas.find(fm => fm.fid === fid);

    const { rawDataStorage, rawDataMetaInfo } = dataSourceStore;

    const getInitFilter = useCallback((): IFilter => {
        if (meta?.semanticType === 'quantitative') {
            return {
                fid,
                type: 'range',
                range: [0, 0],
            };
        }
        return {
            fid,
            type: 'set',
            values: [],
        };
    }, [fid, meta?.semanticType]);

    const [filter, setFilter] = useState<IFilter>(getInitFilter);

    useEffect(() => {
        setFilter(getInitFilter);
    }, [getInitFilter]);

    const [fieldRange, setFieldRange] = useState<[number, number]>([0, 0])
    const filterType = filter.type;
    useEffect(() => {
        if (rawDataMetaInfo.versionCode === -1) {
            setFieldRange([0, 0]);
        } else if (filterType !== 'range') {
            setFieldRange([0, 0]);
        } else {
            getOriginalRange(rawDataStorage, fid).then(r => {
                setFieldRange(r)
            })
        }
    }, [fid, filterType, rawDataStorage, rawDataMetaInfo.versionCode])


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

    const onRangeValueChange = useCallback((r: [number, number]) => {
        setFilter(f => {
            const nextF = produce(f, draft => {
                if (draft.type === 'range' && r) {
                    draft.range = r
                }
            })
            return nextF
        })
    }, [])

    useEffect(() => {
        if (filterType === 'range') {
            onRangeValueChange(fieldRange);
        }
    }, [fieldRange, onRangeValueChange, filterType])

    return <div>
        <ActionButton
            text={intl.get('common.filter')}
            iconProps={{ iconName: 'filter' }}
            onClick={toggleShowFilter}
            id={buttonId}
        />
        {
            showFilterConfig && <Callout target={`#${buttonId}`}
                    onDismiss={toggleShowFilter}
                >
                <div style={{ padding: '1em', minWidth: '400px'}}>

                <h2>{intl.get('dataSource.filter.title')}</h2>
                <Toggle
                    onText={intl.get('dataSource.filter.enabled')}
                    offText={intl.get('dataSource.filter.disabled')}
                    label={intl.get('dataSource.filter.active')}
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
                        label={intl.get('dataSource.filter.key')}
                        options={[
                            { key: 'range', text: intl.get('dataSource.filter.range') },
                            { key: 'set', text: intl.get('dataSource.filter.set')}
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
                        range={fieldRange}
                        left={filter.range[0]}
                        right={filter.range[1]}
                        onValueChange={onRangeValueChange}
                    />
                }
                <Stack horizontal>
                    <PrimaryButton
                        text={intl.get('dataSource.filter.submit')}
                        onClick={submitFilter}
                    />
                    <DefaultButton
                        style={{ marginLeft: '1em' }}
                        text={intl.get('dataSource.filter.cancel')}
                        onClick={toggleShowFilter}
                    />
                </Stack>
                </div>
                
            </Callout>
        }
    </div>
}

export default observer(FieldFilter);
