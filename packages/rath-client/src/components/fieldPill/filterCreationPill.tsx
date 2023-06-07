import {
    Callout,
    ChoiceGroup,
    Dropdown,
    IDropdownOption,
    Stack,
    Selection,
    SelectionMode,
    PrimaryButton,
    DefaultButton,
} from '@fluentui/react';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import produce from 'immer';
import { IFilter } from '@kanaries/loa';
import { IFieldMeta } from '../../interfaces';
import SetSelection from '../fieldFilter/setSelection';
import RangeSelection from '../fieldFilter/rangeSelection';
import BasePillPlaceholder from './basePillPlaceholder';

function getFieldRange(field: IFieldMeta): [number, number] {
    let _min = field.features.min || 0;
    let _max = field.features.max || 0;
    return [_min, _max];
}
const Cont = styled.div`
    padding: 1em;
    min-width: 16em;
`;
interface FilterCreationPillProps {
    fields: readonly IFieldMeta[];
    onFilterSubmit: (field: IFieldMeta, filter: IFilter) => void;
    onRenderPill?: (text: string, handleClick: () => void) => void;
}
const DefaultPill: FilterCreationPillProps['onRenderPill'] = (text, handleClick) => <BasePillPlaceholder text={text} onClick={handleClick} />;
const FilterCreationPill: React.FC<FilterCreationPillProps> = (props) => {
    const { fields, onFilterSubmit, onRenderPill = DefaultPill } = props;
    const container = useRef<HTMLDivElement>(null);
    const [show, setShow] = useState(false);
    const [filter, setFilter] = useState<IFilter>({
        fid: '',
        type: 'set',
        values: [],
    });

    const curField = useMemo<IFieldMeta | undefined>(() => {
        return fields.find((f) => f.fid === filter.fid);
    }, [fields, filter.fid]);

    const toggleShow = useCallback(() => {
        setShow((v) => !v);
    }, []);
    const fieldOptions = useMemo<IDropdownOption[]>(() => {
        return fields.map((f) => ({
            key: f.fid,
            text: f.name || f.fid,
        }));
    }, [fields]);
    const selection = useMemo(() => {
        return new Selection({
            selectionMode: SelectionMode.multiple,
            onSelectionChanged: () => {},
            // items: meta.distribution,
            // getKey: () => ''
        });
    }, []);
    const onRangeValueChange = useCallback((r: [number, number]) => {
        setFilter((f) => {
            const nextF = produce(f, (draft) => {
                if (draft.type === 'range' && r) {
                    draft.range = r;
                }
            });
            return nextF;
        });
    }, []);

    const fieldRange = useMemo<[number, number]>(() => {
        if (!curField) return [0, 0];
        return getFieldRange(curField);
    }, [curField]);

    const submitResult = () => {
        if (curField) {
            const ansFilter = produce(filter, draft => {
                if (draft.type === 'set') {
                    draft.values = selection.getSelectedIndices().map(i => curField.distribution[i].memberName)
                }
            })
            onFilterSubmit(curField, ansFilter);
            toggleShow();
        }
    };
    return (
        <div ref={container}>
            {onRenderPill(intl.get('common.addFilter'), toggleShow)}
            {show && (
                <Callout
                    target={container}
                    role="dialog"
                    gapSpace={0}
                    onDismiss={() => {
                        setShow(false);
                    }}
                    setInitialFocus
                >
                    <Cont>
                        <Stack tokens={{ childrenGap: 10 }}>
                            <Stack.Item>
                                <Dropdown
                                    label={intl.get('common.field')}
                                    options={fieldOptions}
                                    selectedKey={filter.fid}
                                    onChange={(e, op) => {
                                        if (op) {
                                            const targetField = fields.find((f) => f.fid === op.key);
                                            if (targetField) {
                                                setFilter((f) => {
                                                    const nextF = produce(f, (draft) => {
                                                        draft.fid = op.key as string;
                                                        draft.type =
                                                            targetField.semanticType === 'quantitative'
                                                                ? 'range'
                                                                : 'set';
                                                        if (draft.type === 'set') {
                                                            draft.values = [];
                                                        } else {
                                                            draft.range = getFieldRange(targetField);
                                                        }
                                                    });
                                                    return nextF;
                                                });
                                            }
                                        }
                                    }}
                                />
                            </Stack.Item>
                            {curField && (
                                <Stack.Item>
                                    <ChoiceGroup
                                        label={intl.get('dataSource.filter.key')}
                                        options={[
                                            { key: 'range', text: intl.get('dataSource.filter.range') },
                                            { key: 'set', text: intl.get('dataSource.filter.set') },
                                        ]}
                                        selectedKey={filter.type}
                                        onChange={(ev, op) => {
                                            if (op) {
                                                const targetField = fields.find((f) => f.fid === op.key);
                                                if (targetField) {
                                                    setFilter((f) => {
                                                        const nextF = produce(f, (draft) => {
                                                            draft.type = op.key as any;
                                                            if (draft.type === 'set') {
                                                                draft.values = [];
                                                            } else {
                                                                draft.range = getFieldRange(targetField);
                                                            }
                                                        });
                                                        return nextF;
                                                    });
                                                }
                                            }
                                        }}
                                    />
                                </Stack.Item>
                            )}
                            {filter.type === 'set' && curField && (
                                <SetSelection dist={curField.distribution} selection={selection} />
                            )}
                            {filter.type === 'range' && curField && (
                                <RangeSelection
                                    range={fieldRange}
                                    left={filter.range[0]}
                                    right={filter.range[1]}
                                    onValueChange={onRangeValueChange}
                                    type={curField.semanticType === 'temporal' ? 'time' : 'number'}
                                />
                            )}
                            <Stack.Item>
                                <Stack horizontal>
                                    <PrimaryButton text={intl.get('dataSource.filter.submit')} onClick={submitResult} />
                                    <DefaultButton
                                        style={{ marginLeft: '1em' }}
                                        text={intl.get('dataSource.filter.cancel')}
                                        onClick={toggleShow}
                                    />
                                </Stack>
                            </Stack.Item>
                        </Stack>
                        
                    </Cont>
                </Callout>
            )}
        </div>
    );
};

export default FilterCreationPill;
