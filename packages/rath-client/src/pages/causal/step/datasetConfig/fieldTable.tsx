import {
    Checkbox,
    DetailsList,
    IColumn,
    Label,
    SelectionMode,
} from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import { FC, useCallback, useMemo, useRef } from 'react';
import produce from 'immer';
import intl from 'react-intl-universal'
import { useGlobalStore } from '../../../../store';
import type { IFieldMeta } from '../../../../interfaces';
import { getI18n } from '../../locales';


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

const FieldPanel: FC = () => {
    const { causalStore } = useGlobalStore();
    const { fields, allFields } = causalStore.dataset;

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
                name: getI18n('dataset_config.field_info.field', { total: totalFieldsRef.current.length, selected: fields.length }),
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
                name: getI18n('dataset_config.field_info.extInfo'),
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
                name: getI18n('dataset_config.field_info.unique'),
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
                name: getI18n('dataset_config.field_info.sType'),
                onRender: (item) => {
                    const field = item as IFieldMeta;
                    return (
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {intl.get(`common.semanticType.${field.semanticType}`)}
                        </span>
                    );
                },
                minWidth: 100,
                maxWidth: 100,
            },
            {
                key: 'mean',
                name: getI18n('dataset_config.field_info.mean'),
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
                name: getI18n('dataset_config.field_info.std'),
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
                name: getI18n('dataset_config.field_info.median'),
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
            <Label>{getI18n('dataset_config.fields')}</Label>
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

export default observer(FieldPanel);
