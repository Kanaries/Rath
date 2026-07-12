import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import { FC, useCallback, useMemo, useRef } from 'react';
import produce from 'immer';
import intl from 'react-intl-universal';
import { RathColumn, RathDataTable } from '../../components/rath-ui/rath-data-table';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';
import { Slider } from '../../components/ui/slider';
import { useGlobalStore } from '../../store';
import FilterCreationPill from '../../components/fieldPill/filterCreationPill';
import type { IFieldMeta } from '../../interfaces';
import { FilterCell } from './filters';

const TableContainer = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    min-height: 0;
    overflow: hidden;
`;

const SelectedKey = 'selected';

const formatMetric = (value: number | undefined): string => {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return '—';
    }
    return value.toLocaleString(undefined, { maximumFractionDigits: 3 });
};

const DatasetPanel: FC = () => {
    const { dataSourceStore, causalStore } = useGlobalStore();
    const { cleanedData } = dataSourceStore;
    const { fields, allFields, filteredDataSize, sampleRate, sampleSize, filters } = causalStore.dataset;

    const totalFieldsRef = useRef(allFields);
    totalFieldsRef.current = allFields;

    const fieldsRef = useRef(fields);
    fieldsRef.current = fields;

    const toggleFocus = useCallback(
        (fid: string) => {
            const prevIndices = fieldsRef.current
                .map((f) => totalFieldsRef.current.findIndex((which) => f.fid === which.fid))
                .filter((idx) => idx !== -1);
            causalStore.dataset.selectFields(
                produce(prevIndices, (draft) => {
                    const idx = totalFieldsRef.current.findIndex((f) => f.fid === fid);
                    if (idx !== -1) {
                        const i = draft.findIndex((which) => which === idx);
                        if (i !== -1) {
                            draft.splice(i, 1);
                        } else {
                            draft.push(idx);
                        }
                    }
                })
            );
        },
        [causalStore]
    );

    const fieldsTableCols = useMemo<RathColumn<IFieldMeta>[]>(() => {
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
                            aria-label="Select all fields"
                            checked={
                                fields.length > 0 && fields.length < totalFieldsRef.current.length
                                    ? 'indeterminate'
                                    : fields.length === totalFieldsRef.current.length
                            }
                            onCheckedChange={(checked) => handleClick(undefined, checked === true)}
                        />
                    );
                },
                onRender: (item) => {
                    const field = item as IFieldMeta;
                    const checked = fields.some((f) => f.fid === field.fid);
                    return <Checkbox aria-label={`Select ${field.name || field.fid}`} checked={checked} style={{ pointerEvents: 'none' }} />;
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
                    return <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{field.name || field.fid}</span>;
                },
                minWidth: 180,
                maxWidth: 180,
            },
            {
                key: 'extInfo',
                name: intl.get('causal.dataset.extInfo'),
                onRender: (item) => {
                    const field = item as IFieldMeta;
                    const { extInfo } = field;
                    const sources =
                        extInfo?.extFrom
                            .map((fid) => totalFieldsRef.current.find((f) => f.fid === fid) ?? fid)
                            .map((f) => (typeof f === 'string' ? f : f.name || f.fid)) ?? [];

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
                    return <span className="block truncate tabular-nums">{formatMetric(field.features.unique)}</span>;
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
                        <span className="block truncate">
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
                        <span className="block truncate tabular-nums" title={String(field.features.mean)}>
                            {formatMetric(field.features.mean)}
                        </span>
                    );
                },
                minWidth: 120,
                maxWidth: 120,
            },
            {
                key: 'std',
                name: intl.get('common.stat.stdev'),
                onRender: (item) => {
                    const field = item as IFieldMeta;
                    return (
                        <span className="block truncate tabular-nums" title={String(field.features.stdev)}>
                            {formatMetric(field.features.stdev)}
                        </span>
                    );
                },
                minWidth: 140,
                maxWidth: 140,
            },
            {
                key: 'median',
                name: intl.get('common.stat.qt_50'),
                onRender: (item) => {
                    const field = item as IFieldMeta;
                    return (
                        <span className="block truncate tabular-nums" title={String(field.features.qt_50)}>
                            {formatMetric(field.features.qt_50)}
                        </span>
                    );
                },
                minWidth: 120,
                maxWidth: 120,
            },
        ];
    }, [fields, causalStore]);

    return (
        <>
            <div style={{ marginTop: '0.6em' }}>
                <Label style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center' }}>
                    <span>{intl.get('common.filter')}</span>
                    <div
                        style={{
                            display: 'flex',
                            padding: '0 2em',
                        }}
                    >
                        <FilterCreationPill fields={allFields} onFilterSubmit={(_, filter) => causalStore.dataset.appendFilter(filter)} />
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
                                <FilterCell key={i} field={field} data={filter} remove={() => causalStore.dataset.removeFilter(i)} />
                            ) : null;
                        })}
                    </div>
                )}
                <small style={{ color: '#666', display: 'flex', alignItems: 'center' }}>
                    {intl.get('causal.dataset.origin_size', { size: cleanedData.length })}
                    {filters.length ? intl.get('causal.dataset.filtered_size', { size: filteredDataSize }) : intl.get('causal.dataset.no_filter')}
                </small>
            </div>
            <div style={{ marginBlock: '0.8em' }}>
                <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                    <Label>{intl.get('causal.dataset.sample_rate')}</Label>
                    <Slider
                        min={0.01}
                        max={1}
                        step={0.01}
                        value={[sampleRate]}
                        onValueChange={(val) => {
                            causalStore.dataset.sampleRate = val[0];
                        }}
                        style={{ minWidth: '160px', maxWidth: '300px', flexGrow: 1, flexShrink: 0, marginInline: '1vmax' }}
                    />
                    <span>{`${(sampleRate * 100).toFixed(0)}%`}</span>
                </div>
                <small style={{ padding: '0.2em 0', color: '#666', display: 'flex', alignItems: 'center' }}>
                    {intl.get('causal.dataset.sample_size', { size: sampleSize })}
                </small>
            </div>
            <Label>{intl.get('causal.dataset.choose_fields')}</Label>
            <TableContainer>
                <RathDataTable
                    items={allFields.slice(0)}
                    columns={fieldsTableCols}
                    getRowKey={(field) => field.fid}
                    maxHeight="min(45vh, 420px)"
                    virtualizationThreshold={40}
                    onRowClick={(field) => toggleFocus(field.fid)}
                    rowClassName={(field) => {
                        const checked = fields.some((f) => f.fid === field.fid);
                        return checked ? 'bg-muted opacity-100' : 'opacity-80 hover:opacity-100';
                    }}
                />
            </TableContainer>
        </>
    );
};

export default observer(DatasetPanel);
