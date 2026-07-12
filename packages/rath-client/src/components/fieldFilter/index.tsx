import React, { useCallback, useEffect, useId, useState } from 'react';
import produce from 'immer';
import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import { IFilter } from '../../interfaces';
import { useGlobalStore } from '../../store';
import { RathIcon } from '../icons';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Switch } from '../ui/switch';
import RangeSelection from './rangeSelection';
import SetSelection from './setSelection';
import { getOriginalDateTimeRange, getOriginalRange } from './originalRange';

interface FieldFilterProps {
    fid: string;
}

const FieldFilter: React.FC<FieldFilterProps> = (props) => {
    const { fid } = props;
    const optionId = `filter-button-${useId().replace(/:/g, '')}`;
    const [showFilterConfig, setShowFilterConfig] = useState<boolean>(false);
    const { dataSourceStore } = useGlobalStore();

    const meta = dataSourceStore.fieldMetas.find((fm) => fm.fid === fid);
    const filterInUse = dataSourceStore.filters.find((f) => f.fid === fid);

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
    const [selectedSetValues, setSelectedSetValues] = useState<string[]>([]);

    useEffect(() => {
        setFilter(getInitFilter);
        setSelectedSetValues([]);
    }, [getInitFilter]);

    const [fieldRange, setFieldRange] = useState<[number, number]>([0, 0]);
    const filterType = filter.type;
    const resetRange = useCallback(() => {
        if (rawDataMetaInfo.versionCode === -1) {
            setFieldRange([0, 0]);
        } else if (filterType !== 'range') {
            setFieldRange([0, 0]);
        } else if (meta?.semanticType === 'temporal') {
            getOriginalDateTimeRange(rawDataStorage, fid).then((r) => {
                setFieldRange(r);
            });
        } else {
            getOriginalRange(rawDataStorage, fid).then((r) => {
                setFieldRange(r);
            });
        }
    }, [fid, meta?.semanticType, filterType, rawDataStorage, rawDataMetaInfo.versionCode]);
    useEffect(resetRange, [resetRange]);

    const submitFilter = useCallback(() => {
        if (filter.type === 'range') {
            dataSourceStore.setFilter(filter);
        } else {
            if (meta?.distribution) {
                const nextFilter: IFilter = {
                    ...filter,
                    values: selectedSetValues,
                };
                dataSourceStore.setFilter(nextFilter);
            }
        }
        setShowFilterConfig(false);
    }, [filter, meta?.distribution, dataSourceStore, selectedSetValues]);

    const resetFilter = useCallback(() => {
        resetRange();
        dataSourceStore.removeFilter(fid);
    }, [fid, dataSourceStore, resetRange]);

    const toggleShowFilter = useCallback(() => {
        setShowFilterConfig((v) => !v);
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

    useEffect(() => {
        if (filterType === 'range') {
            onRangeValueChange(fieldRange);
        }
    }, [fieldRange, onRangeValueChange, filterType]);

    return (
        <div>
            <Popover open={showFilterConfig} onOpenChange={setShowFilterConfig}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" className="px-2">
                        <RathIcon name="filter" className="mr-1" />
                        {intl.get('common.filter')}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <div style={{ padding: '1em', minWidth: '400px' }}>
                        <h2>{intl.get('dataSource.filter.title')}</h2>
                        <div className="mb-3 flex items-center gap-2">
                            <Switch
                                checked={!filter.disable}
                                onCheckedChange={(checked) => {
                                    setFilter((f) => ({
                                        ...f,
                                        disable: !checked,
                                    }));
                                }}
                            />
                            <Label>{intl.get('dataSource.filter.active')}</Label>
                            <span className="text-xs text-muted-foreground">
                                {filter.disable ? intl.get('dataSource.filter.disabled') : intl.get('dataSource.filter.enabled')}
                            </span>
                        </div>
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
                                                draft.range = [0, 0];
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
                        {filter.type === 'set' && meta && !filterInUse && (
                            <SetSelection dist={toJS(meta.distribution)} selectedKeys={selectedSetValues} onChange={setSelectedSetValues} />
                        )}
                        {filter.type === 'range' && meta && (
                            <RangeSelection
                                range={fieldRange}
                                left={filter.range[0]}
                                right={filter.range[1]}
                                onValueChange={onRangeValueChange}
                                type={meta.semanticType === 'temporal' ? 'time' : 'number'}
                            />
                        )}
                        <div className="flex flex-row gap-[1em]">
                            {filterInUse && (
                                <Button variant="outline" onClick={resetFilter}>
                                    {intl.get('dataSource.filter.reset') || 'Reset'}
                                </Button>
                            )}
                            <Button disabled={filter.type === 'set' && Boolean(filterInUse)} onClick={submitFilter}>
                                {intl.get('dataSource.filter.submit')}
                            </Button>
                            <Button variant="outline" onClick={toggleShowFilter}>
                                {intl.get('dataSource.filter.cancel')}
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default observer(FieldFilter);
