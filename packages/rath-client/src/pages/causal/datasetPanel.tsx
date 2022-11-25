import {
    Checkbox,
    DetailsList,
    IColumn,
    IconButton,
    Label,
    SelectionMode,
    Slider,
    Spinner,
    Stack,
} from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import React, { useCallback, useMemo, useRef } from 'react';
import produce from 'immer';
import { useGlobalStore } from '../../store';
import FilterCreationPill from '../../components/filterCreationPill';
import LaTiaoConsole from '../../components/latiaoConsole/index';
import type { IFieldMeta } from '../../interfaces';
import { FilterCell } from './filters';
import type { useDataViews } from './hooks/dataViews';


const TableContainer = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    overflow: hidden;
    > * {
        height: 100%;
        > * {
            height: 100%;
        }
    }
    & [role=grid] {
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: auto hidden;
        > *:first-child {
            flex-grow: 0;
            flex-shrink: 0;
        overflow: auto hidden;
        }
        > *:last-child {
            flex-grow: 1;
            flex-shrink: 1;
            overflow: auto auto;
        }
    }
`;

const SelectedKey = 'selected';

export interface DatasetPanelProps {
    context: ReturnType<typeof useDataViews>;
}

const DatasetPanel: React.FC<DatasetPanelProps> = ({ context }) => {
    const { dataSourceStore, causalStore } = useGlobalStore();
    const { fieldMetas, cleanedData } = dataSourceStore;
    const { focusFieldIds } = causalStore;
    const totalFieldsRef = useRef(fieldMetas);
    totalFieldsRef.current = fieldMetas;

    const { dataSubset, sampleRate, setSampleRate, appliedSampleRate, filters, setFilters, sampleSize } = context;

    const focusFieldIdsRef = useRef(focusFieldIds);
    focusFieldIdsRef.current = focusFieldIds;

    const toggleFocus = useCallback((fid: string) => {
        causalStore.setFocusFieldIds(produce(focusFieldIdsRef.current, draft => {
            const idx = draft.findIndex(key => fid === key);
            if (idx !== -1) {
                draft.splice(idx, 1);
            } else {
                draft.push(fid);
            }
        }));
    }, [causalStore]);

    const fieldsTableCols = useMemo<IColumn[]>(() => {
        return [
            {
                key: SelectedKey,
                name: '',
                onRenderHeader: () => {
                    const handleClick = (_: unknown, checked?: boolean | undefined) => {
                        if (checked) {
                            causalStore.setFocusFieldIds(totalFieldsRef.current.map(f => f.fid));
                        } else {
                            causalStore.setFocusFieldIds([]);
                        }
                    };
                    return (
                        <Checkbox
                            checked={focusFieldIds.length === totalFieldsRef.current.length}
                            indeterminate={focusFieldIds.length > 0 && focusFieldIds.length < totalFieldsRef.current.length}
                            onChange={handleClick}
                            styles={{
                                root: {
                                    padding: '11px 0 0',
                                },
                            }}
                        />
                    );
                },
                onRender: (item) => {
                    const field = item as IFieldMeta;
                    const checked = focusFieldIds.includes(field.fid);
                    return (
                        <IconButton
                            iconProps={{ iconName: checked ? 'Remove' : 'Add' }}
                            onClick={() => toggleFocus(field.fid)}
                            style={{ height: 'unset' }}
                        />
                    );
                },
                isResizable: false,
                minWidth: 20,
                maxWidth: 20,
            },
            {
                key: 'name',
                name: `因素 (${focusFieldIds.length} / ${totalFieldsRef.current.length})`,
                onRender: (item) => {
                    const field = item as IFieldMeta;
                    const checked = focusFieldIdsRef.current.includes(field.fid);
                    return (
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: checked ? 'bold' : 'normal' }}>
                            {field.name || field.fid}
                        </span>
                    );
                },
                minWidth: 160,
                maxWidth: 160,
            },
            {
                key: 'extInfo',
                name: '扩展来源',
                onRender: (item) => {
                    const field = item as IFieldMeta;
                    const { extInfo } = field;
                    const sources = extInfo?.extFrom.map(
                        fid => totalFieldsRef.current.find(f => f.fid === fid) ?? fid
                    ).map(f => typeof f === 'string' ? f : (f.name || f.fid)) ?? [];

                    return (
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {extInfo ? `[${extInfo.extOpt}] from ${sources.join(', ')} (${extInfo.extInfo})` : ''}
                        </span>
                    );
                },
                minWidth: 240,
                maxWidth: 240,
            },
            {
                key: 'unique',
                name: '唯一值数量',
                onRender: (item) => {
                    const field = item as IFieldMeta;
                    return (
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {field.features.unique}
                        </span>
                    );
                },
                minWidth: 100,
                maxWidth: 100,
            },
            {
                key: 'entropy',
                name: '熵',
                onRender: (item) => {
                    const field = item as IFieldMeta;
                    return (
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {field.features.entropy}
                        </span>
                    );
                },
                minWidth: 100,
                maxWidth: 100,
            },
        ];
    }, [toggleFocus, focusFieldIds, causalStore]);

    return (
        <>
            <Stack style={{ marginBlock: '0.6em -0.6em', alignItems: 'center' }} horizontal>
                <Label style={{ marginRight: '1em' }}>数据增强</Label>
                <LaTiaoConsole />
            </Stack>
            <Stack style={{ marginBlock: '0.8em' }}>
                <Slider
                    label="采样率"
                    min={0.01}
                    max={1}
                    step={0.01}
                    value={sampleRate}
                    showValue
                    onChange={(val) => setSampleRate(val)}
                    valueFormat={(val) => `${(val * 100).toFixed(0)}%`}
                    styles={{
                        root: {
                            flexGrow: 0,
                            flexShrink: 0,
                            display: 'flex',
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                        },
                        container: {
                            minWidth: '160px',
                            maxWidth: '300px',
                            flexGrow: 1,
                            flexShrink: 0,
                            marginInline: '1vmax',
                        },
                    }}
                />
                <small style={{ padding: '0.2em 0', color: '#666', display: 'flex', alignItems: 'center' }}>
                    {`原始大小: ${cleanedData.length} 行，样本量: `}
                    {sampleRate !== appliedSampleRate ? (
                        <Spinner
                            style={{ display: 'inline-block', transform: 'scale(0.9)', margin: '-50% 0.6em' }}
                        />
                    ) : (
                        `${sampleSize} 行`
                    )}
                </small>
            </Stack>
            <Stack style={{ marginTop: '0.3em' }}>
                <Label style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center' }}>
                    <span>筛选器</span>
                    <div
                        style={{
                            display: 'flex',
                            padding: '0 2em',
                        }}
                    >
                        <FilterCreationPill
                            fields={fieldMetas}
                            onFilterSubmit={(_, filter) => setFilters((list) => [...list, filter])}
                        />
                    </div>
                </Label>
                {filters.length > 0 && (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            overflow: 'auto hidden',
                            margin: '1em 0',
                        }}
                    >
                        {filters.map((filter, i) => {
                            const field = fieldMetas.find((f) => f.fid === filter.fid);

                            return field ? (
                                <FilterCell
                                    key={i}
                                    field={field}
                                    data={filter}
                                    remove={() =>
                                        setFilters((list) => {
                                            return produce(list, (draft) => {
                                                draft.splice(i, 1);
                                            });
                                        })
                                    }
                                />
                            ) : null;
                        })}
                    </div>
                )}
                <small style={{ color: '#666', display: 'flex', alignItems: 'center' }}>
                    {`${filters.length ? `筛选后子集大小: ${dataSubset.length} 行` : '(无筛选项)'}`}
                </small>
            </Stack>
            <Label>需要分析的字段</Label>
            <TableContainer>
                <DetailsList
                    items={fieldMetas}
                    columns={fieldsTableCols}
                    selectionMode={SelectionMode.none}
                />
            </TableContainer>
        </>
    );
};

export default observer(DatasetPanel);
