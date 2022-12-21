import {
    Checkbox,
    DetailsList,
    IColumn,
    Label,
    SelectionMode,
} from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import { FC, useMemo } from 'react';
import intl from 'react-intl-universal'
import { useGlobalStore } from '../../../../store';
import type { IFieldMeta } from '../../../../interfaces';
import { getI18n } from '../../locales';


const TableContainer = styled.div`
    margin: 0.6em 0;
    flex-grow: 1;
    flex-shrink: 1;
    overflow: hidden auto;
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
    const { fields, allFields, allSelectableFields } = causalStore.dataset;

    const selectedFields = useMemo(() => {
        const roots = allSelectableFields.map(({ field }) => allFields[field]);
        return fields.filter(f => {
            return roots.some(which => which.fid === f.fid);
        });
    }, [fields, allFields, allSelectableFields]);

    const fieldsTableCols = useMemo<IColumn[]>(() => {
        return [
            {
                key: SelectedKey,
                name: '',
                onRenderHeader: () => {
                    const handleClick = (_: unknown, checked?: boolean | undefined) => {
                        if (checked) {
                            causalStore.selectFields(allSelectableFields.map((_, i) => i));
                        } else {
                            causalStore.selectFields([]);
                        }
                    };
                    return (
                        <Checkbox
                            checked={selectedFields.length === allSelectableFields.length}
                            indeterminate={selectedFields.length > 0 && selectedFields.length < allSelectableFields.length}
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
                    const checked = selectedFields.some(f => f.fid === field.fid);
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
                name: getI18n('dataset_config.field_info.field', { total: allSelectableFields.length, selected: selectedFields.length }),
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
    }, [allSelectableFields, selectedFields, causalStore]);

    const allRoots = allSelectableFields.map(d => allFields[d.field]);

    return (
        <>
            <Label>{getI18n('dataset_config.fields')}</Label>
            <TableContainer>
                <DetailsList
                    items={allRoots}
                    columns={fieldsTableCols}
                    selectionMode={SelectionMode.none}
                    onRenderRow={(props, defaultRender) => {
                        const i = props?.itemIndex;
                        if (i === undefined) {
                            return null;
                        }
                        const field = props?.item as IFieldMeta;
                        const checked = selectedFields.some(f => f.fid === field.fid);
                        return (
                            <Row selected={checked} onClick={() => causalStore.dataset.toggleFieldSelected(field.fid)}>
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
