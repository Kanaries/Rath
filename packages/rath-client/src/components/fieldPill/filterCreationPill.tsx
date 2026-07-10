import React, { useCallback, useId, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import produce from 'immer';
import { IFilter } from '@kanaries/loa';
import { IFieldMeta } from '../../interfaces';
import SetSelection from '../fieldFilter/setSelection';
import RangeSelection from '../fieldFilter/rangeSelection';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Popover, PopoverAnchor, PopoverContent } from '../ui/popover';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { RathSelect, RathSelectOption } from '../rath-ui/rath-select';
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
    onRenderPill?: (text: string, handleClick: () => void) => React.ReactNode;
}
const DefaultPill: FilterCreationPillProps['onRenderPill'] = (text, handleClick) => <BasePillPlaceholder text={text} onClick={handleClick} />;
const FilterCreationPill: React.FC<FilterCreationPillProps> = (props) => {
    const { fields, onFilterSubmit, onRenderPill = DefaultPill } = props;
    const container = useRef<HTMLDivElement>(null);
    const optionId = `filter-creation-${useId().replace(/:/g, '')}`;
    const [show, setShow] = useState(false);
    const [filter, setFilter] = useState<IFilter>({
        fid: '',
        type: 'set',
        values: [],
    });
    const [selectedSetValues, setSelectedSetValues] = useState<string[]>([]);

    const curField = useMemo<IFieldMeta | undefined>(() => {
        return fields.find((f) => f.fid === filter.fid);
    }, [fields, filter.fid]);

    const toggleShow = useCallback(() => {
        setShow((v) => !v);
    }, []);
    const fieldOptions = useMemo<RathSelectOption[]>(() => {
        return fields.map((f) => ({
            key: f.fid,
            text: f.name || f.fid,
        }));
    }, [fields]);
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
            const ansFilter = produce(filter, (draft) => {
                if (draft.type === 'set') {
                    draft.values = selectedSetValues;
                }
            });
            onFilterSubmit(curField, ansFilter);
            toggleShow();
        }
    };
    return (
        <div ref={container}>
            <Popover open={show} onOpenChange={setShow}>
                <PopoverAnchor asChild>
                    <div>{onRenderPill(intl.get('common.addFilter'), toggleShow)}</div>
                </PopoverAnchor>
                <PopoverContent className="w-auto p-0">
                    <Cont>
                        <div className="flex flex-col gap-[10px]">
                            <div>
                                <RathSelect
                                    label={intl.get('common.field')}
                                    options={fieldOptions}
                                    selectedKey={filter.fid}
                                    onChange={(key) => {
                                        const targetField = fields.find((f) => f.fid === key);
                                        if (targetField) {
                                            setFilter((f) => {
                                                const nextF = produce(f, (draft) => {
                                                    draft.fid = key as string;
                                                    draft.type = targetField.semanticType === 'quantitative' ? 'range' : 'set';
                                                    if (draft.type === 'set') {
                                                        draft.values = [];
                                                        setSelectedSetValues([]);
                                                    } else {
                                                        draft.range = getFieldRange(targetField);
                                                    }
                                                });
                                                return nextF;
                                            });
                                        }
                                    }}
                                />
                            </div>
                            {curField && (
                                <div>
                                    <Label>{intl.get('dataSource.filter.key')}</Label>
                                    <RadioGroup
                                        className="mt-2 flex gap-4"
                                        value={filter.type}
                                        onValueChange={(value) => {
                                            setFilter((f) => {
                                                const nextF = produce(f, (draft) => {
                                                    draft.type = value as any;
                                                    if (draft.type === 'set') {
                                                        draft.values = [];
                                                        setSelectedSetValues([]);
                                                    } else {
                                                        draft.range = getFieldRange(curField);
                                                    }
                                                });
                                                return nextF;
                                            });
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <RadioGroupItem id={`${optionId}-range`} value="range" />
                                            <Label htmlFor={`${optionId}-range`}>{intl.get('dataSource.filter.range')}</Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <RadioGroupItem id={`${optionId}-set`} value="set" />
                                            <Label htmlFor={`${optionId}-set`}>{intl.get('dataSource.filter.set')}</Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                            )}
                            {filter.type === 'set' && curField && (
                                <SetSelection dist={curField.distribution} selectedKeys={selectedSetValues} onChange={setSelectedSetValues} />
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
                            <div className="flex flex-row gap-[1em]">
                                <Button onClick={submitResult}>{intl.get('dataSource.filter.submit')}</Button>
                                <Button variant="outline" onClick={toggleShow}>
                                    {intl.get('dataSource.filter.cancel')}
                                </Button>
                            </div>
                        </div>
                    </Cont>
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default FilterCreationPill;
