import {
    Checkbox,
    DetailsList,
    IColumn,
    Label,
    SelectionMode,
    Slider,
    Stack,
} from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import { FC, useCallback, useMemo, useRef } from 'react';
import produce from 'immer';
import intl from 'react-intl-universal'
import { useGlobalStore } from '../../store';
import FilterCreationPill from '../../components/fieldPill/filterCreationPill';
import type { IFieldMeta } from '../../interfaces';
import { FilterCell } from './filters';


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

const Row = styled.div<{ selected: boolean }>`
    > div {
        background-color: ${({ selected }) => selected ? '#88888816' : undefined};
        filter: ${({ selected }) => selected ? 'unset' : 'opacity(0.8)'};
        cursor: pointer;
        :hover {
            filter: unset;
        }
    }
`;

const SelectedKey = 'selected';

const DatasetPanel: FC = () => {
    const { dataSourceStore, causalStore } = useGlobalStore();
    const { cleanedData } = dataSourceStore;
    const {
        fields, allFields, filteredDataSize, sampleRate, sampleSize, filters
    } = causalStore.dataset;

    const totalFieldsRef = useRef(allFields);
    totalFieldsRef.current = allFields;

    const fieldsRef = useRef(fields);
    fieldsRef.current = fields;

    const toggleFocus = useCallback((fid: string) => {
        const prevIndices = fieldsRef.current.map(
            f => totalFieldsRef.current.findIndex(which => f.fid === which.fid)
        ).filter(idx => idx !== -1);
        causalStore.dataset.selectFields(produce(prevIndices, draft => {
            const idx = totalFieldsRef.current.findIndex(f => f.fid === fid);
            if (idx !== -1) {
                const i = draft.findIndex(which => which === idx);
                if (i !== -1) {
                    draft.splice(i, 1);
                } else {
                    draft.push(idx);
                }
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
                            causalStore.selectFields(totalFieldsRef.current.map((_, i) => i));
                        } else {
                            causalStore.selectFields([]);
                        }
                    };
                    return (
                        <Checkbox
                            checked={fields.length === totalFieldsRef.current.length}
                            indeterminate={fields.length > 0 && fields.length < totalFieldsRef.current.length}
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
                    const checked = fields.some(f => f.fid === field.fid);
                    return (
                        <Checkbox checked={checked} styles={{ root: { pointerEvents: 'none' } }} />
                    );
                },
                isResizable: false,
                minWidth: 20,
                maxWidth: 20,
            },
            {
                key: 'name',
                name: `${intl.get('causal.dataset.field')} (${fields.length} / ${totalFieldsRef.current.length})`,
                onRender: (item) => {
                    const field = item as IFieldMeta;
                    return (
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {field.name || field.fid}
                        </span>
                    );
                },
                minWidth: 160,
                maxWidth: 160,
            },
            {
                key: 'extInfo',
                name: intl.get('causal.dataset.extInfo'),
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
                minWidth: 100,
                maxWidth: 240,
            },
            {
                key: 'unique',
                name: intl.get('causal.dataset.distinct_count'),
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
                key: 'semanticType',
                name: intl.get('dataSource.meta.semanticType'),
                onRender: (item) => {
                    const field = item as IFieldMeta;
                    return (
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {/* {field.features.entropy} */}
                            {intl.get(`common.semanticType.${field.semanticType}`)}
                        </span>
                    );
                },
                minWidth: 100,
                maxWidth: 100,
            },
            {
                key: 'mean',
                name: intl.get('common.stat.mean'),
                onRender: (item) => {
                    const field = item as IFieldMeta;
                    return (
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {field.features.mean}
                        </span>
                    );
                },
                minWidth: 100,
                maxWidth: 100,
            },
            {
                key: 'std',
                name: intl.get('common.stat.stdev'),
                onRender: (item) => {
                    const field = item as IFieldMeta;
                    return (
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {field.features.stdev}
                        </span>
                    );
                },
                minWidth: 100,
                maxWidth: 100,
            },
            {
                key: 'median',
                name: intl.get('common.stat.qt_50'),
                onRender: (item) => {
                    const field = item as IFieldMeta;
                    return (
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {field.features.qt_25}
                        </span>
                    );
                },
                minWidth: 100,
                maxWidth: 100,
            },
        ];
    }, [fields, causalStore]);

    return (
        <>
            <Stack style={{ marginTop: '0.6em' }}>
                <Label style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center' }}>
                    <span>{intl.get('common.filter')}</span>
                    <div
                        style={{
                            display: 'flex',
                            padding: '0 2em',
                        }}
                    >
                        <FilterCreationPill
                            fields={allFields}
                            onFilterSubmit={(_, filter) => causalStore.dataset.appendFilter(filter)}
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
                            const field = allFields.find((f) => f.fid === filter.fid);

                            return field ? (
                                <FilterCell
                                    key={i}
                                    field={field}
                                    data={filter}
                                    remove={() => causalStore.dataset.removeFilter(i)}
                                />
                            ) : null;
                        })}
                    </div>
                )}
                <small style={{ color: '#666', display: 'flex', alignItems: 'center' }}>
                    {intl.get('causal.dataset.origin_size', { size: cleanedData.length })}
                    {filters.length ? intl.get('causal.dataset.filtered_size', { size: filteredDataSize }) : intl.get('causal.dataset.no_filter')}
                </small>
            </Stack>
            <Stack style={{ marginBlock: '0.8em' }}>
                <Slider
                    label={intl.get('causal.dataset.sample_rate')}
                    min={0.01}
                    max={1}
                    step={0.01}
                    value={sampleRate}
                    showValue
                    onChange={(val) => causalStore.dataset.sampleRate = val}
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
                    {intl.get('causal.dataset.sample_size', { size: sampleSize })}
                </small>
            </Stack>
            <Label>{intl.get('causal.dataset.choose_fields')}</Label>
            <TableContainer>
                <DetailsList
                    items={allFields.slice(0)}
                    columns={fieldsTableCols}
                    selectionMode={SelectionMode.none}
                    onRenderRow={(props, defaultRender) => {
                        const field = props?.item as IFieldMeta;
                        const checked = fields.some(f => f.fid === field.fid);
                        return (
                            <Row selected={checked} onClick={() => toggleFocus(field.fid)}>
                                {defaultRender?.(props)}
                            </Row>
                        );
                    }}
                />
            </TableContainer>
        </>
    );
};

export default observer(DatasetPanel);
