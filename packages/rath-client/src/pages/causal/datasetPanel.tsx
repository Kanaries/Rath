import {
    ComboBox,
    DefaultButton,
    Label,
    Slider,
    Spinner,
    Stack,
} from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useMemo } from 'react';
import produce from 'immer';
import { useGlobalStore } from '../../store';
import FilterCreationPill from '../../components/filterCreationPill';
import LaTiaoConsole from '../../components/latiaoConsole/index';
import { FilterCell } from './filters';
import type { useDataViews } from './hooks/dataViews';
import { InnerCard } from './components';

export interface DatasetPanelProps {
    context: ReturnType<typeof useDataViews>;
}

const DatasetPanel: React.FC<DatasetPanelProps> = ({ context }) => {
    const { dataSourceStore, causalStore } = useGlobalStore();
    const { fieldMetas, cleanedData } = dataSourceStore;
    const { focusFieldIds } = causalStore;

    const { dataSubset, sampleRate, setSampleRate, appliedSampleRate, filters, setFilters, sampleSize } = context;

    useEffect(() => {
        causalStore.setFocusFieldIds(
            fieldMetas
                .filter((f) => f.disable !== true)
                .slice(0, 10)
                .map((f) => f.fid)
        ); // 默认只使用前 10 个)
    }, [fieldMetas, causalStore]);

    const focusFieldsOption = useMemo(
        () =>
            fieldMetas.map((f) => ({
                key: f.fid,
                text: f.name ?? f.fid,
            })),
        [fieldMetas]
    );

    return (
        <InnerCard>
            <h1 className="card-header">数据集配置</h1>
            <hr className="card-line" />
            <Stack style={{ marginBlock: '0.6em -0.6em' }}>
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
            <Stack style={{ marginBlock: '1.6em', alignItems: 'flex-end' }} horizontal>
                <ComboBox
                    multiSelect
                    selectedKey={focusFieldIds}
                    label="需要分析的字段"
                    allowFreeform
                    options={focusFieldsOption}
                    onChange={(e, option) => {
                        if (option) {
                            const { key, selected } = option;
                            if (focusFieldIds.includes(key as string) && !selected) {
                                // setFocusFields((list) => list.filter((f) => f !== key));
                                causalStore.setFocusFieldIds(focusFieldIds.filter((f) => f !== key));
                            } else if (!focusFieldIds.includes(key as string) && selected) {
                                causalStore.setFocusFieldIds([...focusFieldIds, key as string]);
                            }
                        }
                    }}
                    styles={{
                        container: {
                            flexGrow: 1,
                            flexShrink: 1,
                        },
                    }}
                />
                <DefaultButton
                    style={{ fontSize: '0.8rem', margin: '0 0.5em' }}
                    onClick={() =>
                        causalStore.setFocusFieldIds(
                            fieldMetas.filter((f) => f.disable !== true).map((f) => f.fid)
                        )
                    }
                >
                    全部选择
                </DefaultButton>
                <DefaultButton
                    style={{ fontSize: '0.8rem', margin: '0' }}
                    onClick={() =>
                        causalStore.setFocusFieldIds(
                            fieldMetas
                                .filter((f) => f.disable !== true)
                                .slice(0, 10)
                                .map((f) => f.fid)
                        )
                    }
                >
                    选择前十条（默认）
                </DefaultButton>
                <DefaultButton style={{ fontSize: '0.8rem', margin: '0 0.5em' }} onClick={() => causalStore.setFocusFieldIds([])}>
                    清空选择
                </DefaultButton>
            </Stack>
        </InnerCard>
    );
};

export default observer(DatasetPanel);
