import { Dropdown, DropdownMenuItemType, IDropdownOption, TextField, Toggle } from '@fluentui/react';
import produce from 'immer';
import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import { FC, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import type { IFieldMeta, IVegaChannel, IVegaSubset } from '../../interfaces';
import { useGlobalStore } from '../../store';
import { DashboardPanelProps } from './dashboard-panel';

const Container = styled.div`
    flex-grow: 0;
    flex-shrink: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
`;

const EncodingFieldContainer = styled.div`
    user-select: none;
    font-size: 0.8rem;
    margin: 0.5em 0.8em;
    border: 1px solid transparent;
    padding: 0.6em 1.2em;
    box-shadow: 0 3.2px 7.2px 0 rgb(0 0 0 / 5%), 0 0.6px 1.8px 0 rgb(0 0 0 / 3%), inset 0 3.2px 7.2px 0 rgb(0 0 0 / 2%),
        0 0.6px 1.8px 0 rgb(0 0 0 / 1%);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    > label {
        font-size: 0.9rem;
        line-height: 1.6em;
    }
    > div {
        margin-block: 0.8em 0.4em;
    }
`;

const EncodingKeys = ['x', 'y', 'color', 'opacity', 'size', 'shape'] as const;

const Disabled = '__disabled' as const;

const AggregationTypes = [Disabled, 'count', 'mean', 'sum'] as const;

const Count = '__count' as const;

const EncodingField: FC<{
    id: typeof EncodingKeys[number];
    data: IVegaSubset['encoding'];
    fieldsMeta: IFieldMeta[];
    onChange: (value: IVegaChannel | null) => void;
}> = ({ id, data, fieldsMeta, onChange }) => {
    const value = data[id];
    const { field, title, bin, aggregate } = value ?? {};
    const target = value && !field && aggregate === 'count' ? Count : field;

    const fieldOptions = useMemo(() => {
        return [
            { key: Disabled, text: 'None' },
            { key: 'divider_1', text: '-', itemType: DropdownMenuItemType.Divider },
            { key: 'Stat', text: 'Statistics', itemType: DropdownMenuItemType.Header },
            { key: Count, text: 'Count' },
            { key: 'divider_2', text: '-', itemType: DropdownMenuItemType.Divider },
            { key: 'Field', text: 'Field', itemType: DropdownMenuItemType.Header },
            ...fieldsMeta.map((f) => ({
                key: f.fid,
                text: f.name || f.fid,
            })),
        ];
    }, [fieldsMeta]);

    const handleSelectField = useCallback(
        (_: unknown, item?: IDropdownOption) => {
            const { key } = item ?? {};
            if (!key) {
                return;
            }
            switch (key) {
                case Disabled: {
                    onChange(null);
                    break;
                }
                case Count: {
                    // @ts-expect-error 数据确实长这样
                    onChange({
                        aggregate: 'count',
                    });
                    break;
                }
                default: {
                    const f = fieldsMeta.find((which) => which.fid === key);
                    if (f) {
                        onChange({
                            field: f.fid,
                            type: f.semanticType,
                        });
                    }
                    break;
                }
            }
        },
        [fieldsMeta, onChange]
    );

    return (
        <EncodingFieldContainer>
            <label>{id}</label>
            <div>
                {target && (
                    <TextField
                        label="Title"
                        value={title}
                        onChange={(_, val) =>
                            value &&
                            onChange({
                                ...value,
                                title: val,
                            })
                        }
                    />
                )}
                <Dropdown label="Target" selectedKey={target} onChange={handleSelectField} options={fieldOptions} />
                {field && (
                    <Dropdown
                        label="Aggregation"
                        selectedKey={aggregate}
                        onChange={(_, item) =>
                            value &&
                            item &&
                            (AggregationTypes as readonly string[]).includes(item.key as string) &&
                            onChange({
                                ...value,
                                aggregate: item.key === Disabled ? undefined : (item.key as string),
                            })
                        }
                        options={AggregationTypes.map((key) => ({
                            key,
                            text: key === Disabled ? 'None' : key,
                        }))}
                    />
                )}
                {field && (
                    <Toggle
                        label="Bin"
                        inlineLabel
                        checked={bin === true}
                        onChange={(_, checked) =>
                            value &&
                            onChange({
                                ...value,
                                bin: checked,
                            })
                        }
                    />
                )}
            </div>
        </EncodingFieldContainer>
    );
};

const MarkTypes = ['bar', 'boxplot', 'point', 'circle', 'rect', 'trail'] as const;

const EditPanel: FC<DashboardPanelProps> = ({ card }) => {
    const { dataSourceStore, dashboardStore } = useGlobalStore();
    const { fieldMetas } = dataSourceStore;
    const {
        chart = {
            subset: {
                mark: { type: 'point' },
                encoding: {},
            },
            filters: [],
            selectors: [],
            highlighter: [],
            size: { w: 0, h: 0 },
        } as NonNullable<NonNullable<DashboardPanelProps['card']>['content']['chart']>,
    } = card?.content ?? {};
    const { subset } = chart ?? {};
    const { encoding, mark } = subset ?? {};

    return (
        <Container>
            <EncodingFieldContainer>
                <Dropdown
                    label="Mark"
                    selectedKey={(mark as undefined | { type: typeof mark & string })?.type}
                    onChange={(_, item) =>
                        card &&
                        item &&
                        dashboardStore.runInAction(() => {
                            const key = item.key as typeof MarkTypes[number];
                            card.content.chart = produce(toJS(chart), (draft) => {
                                draft.subset.mark = {
                                    type: key,
                                    tooltip: true,
                                };
                            });
                        })
                    }
                    options={MarkTypes.map((key) => ({
                        key,
                        text: key,
                    }))}
                />
            </EncodingFieldContainer>
            {EncodingKeys.map((key) => (
                <EncodingField
                    key={key}
                    id={key}
                    data={encoding ?? {}}
                    fieldsMeta={fieldMetas}
                    onChange={(val) =>
                        card &&
                        dashboardStore.runInAction(() => {
                            card.content.chart = produce(toJS(chart), (draft) => {
                                if (val) {
                                    draft.subset.encoding[key] = val;
                                } else {
                                    delete draft.subset.encoding[key];
                                }
                            });
                        })
                    }
                />
            ))}
        </Container>
    );
};

export default observer(EditPanel);
