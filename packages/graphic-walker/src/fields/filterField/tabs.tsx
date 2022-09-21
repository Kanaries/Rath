import { observer } from 'mobx-react-lite';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import type { IFilterField, IFilterRule } from '../../interfaces';
import { useGlobalStore } from '../../store';
import Slider from './slider';


export type RuleFormProps = {
    field: IFilterField;
    onChange: (rule: IFilterRule) => void;
};

const Container = styled.div({
    marginBlock: '1em',
    marginInline: '2em',

    '> .btn-grp': {
        display: 'flex',
        flexDirection: 'row',
        marginBlock: '0.4em 0.6em',

        '> *': {
            marginInlineStart: '0.6em',

            '&:first-child': {
                marginInlineStart: 0,
            },
        },
    },
});

export const Button = styled.button({
    '&:hover': {
        backgroundColor: 'rgba(243, 244, 246, 0.5)',
    },
    color: 'rgb(55, 65, 81)',
    boxShadow: '1px 1px 2px #0002, inset 2px 2px 4px #0001',
    paddingBlock: '0.2em',
    paddingInline: '0.5em',
    userSelect: 'none',
    cursor: 'pointer',
});

const Table = styled.div({
    display: 'grid',
    gridTemplateColumns: '4em auto max-content',
    maxHeight: '30vh',
    overflowY: 'scroll',
    '& > *': {
        marginBlock: '2px',
        paddingInline: '4px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        userSelect: 'none',
    },
    '& > input, & > *[for]': {
        cursor: 'pointer',
    },
});

const TabsContainer = styled.div({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'stretch',
});

const TabList = styled.div({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    overflow: 'hidden',
});

const TabHeader = styled.label({
    outline: 'none',
    userSelect: 'none',
    paddingBlock: '0.4em',
    paddingInline: '1em 2em',
    borderWidth: '1px',
    borderRadius: '4px 4px 0 0',
    position: 'relative',

    '&[aria-selected]': {
        borderBottomColor: '#0000',
        zIndex: 15,
    },
    '&[aria-selected=false]': {
        backgroundColor: '#f8f8f8',
        borderBottomColor: '#e2e2e2',
        cursor: 'pointer',
        zIndex: 14,
    },
});

const TabPanel = styled.div({});

const TabItem = styled.div({});

export const FilterOneOfRule: React.FC<RuleFormProps & { active: boolean }> = observer(({
    active,
    field,
    onChange,
}) => {
    const { commonStore } = useGlobalStore();
    const { currentDataset: { dataSource } } = commonStore;

    const count = React.useMemo(() => {
        return dataSource.reduce<Map<string | number, number>>((tmp, d) => {
            const val = d[field.fid];

            tmp.set(val, (tmp.get(val) ?? 0) + 1);
            
            return tmp;
        }, new Map<string | number, number>());
    }, [dataSource, field]);

    const { t } = useTranslation('translation', { keyPrefix: 'filters' });

    React.useEffect(() => {
        if (active && field.rule?.type !== 'one of') {
            onChange({
                type: 'one of',
                value: new Set<string | number>(count.keys()),
            });
        }
    }, [active, onChange, field, count]);

    return field.rule?.type === 'one of' ? (
        <Container>
            <Table>
                <label className="header">
                    {t('header.visibility')}
                </label>
                <label className="header">
                    {t('header.value')}
                </label>
                <label className="header">
                    {t('header.count')}
                </label>
            </Table>
            <Table>
                {
                    [...count.entries()].map(([value, count], idx) => {
                        const id = `rule_checkbox_${idx}`;

                        return (
                            <React.Fragment key={idx}>
                                <input
                                    type="checkbox"
                                    checked={field.rule?.type === 'one of' && field.rule.value.has(value)}
                                    id={id}
                                    aria-describedby={`${id}_label`}
                                    title={String(value)}
                                    onChange={({ target: { checked } }) => {
                                        if (field.rule?.type !== 'one of') {
                                            return;
                                        }
                                        
                                        const rule: IFilterRule = {
                                            type: 'one of',
                                            value: new Set(field.rule.value)
                                        };

                                        if (checked) {
                                            rule.value.add(value);
                                        } else {
                                            rule.value.delete(value);
                                        }

                                        onChange(rule);
                                    }}
                                />
                                <label
                                    id={`${id}_label`}
                                    htmlFor={id}
                                    title={String(value)}
                                >
                                    {value}
                                </label>
                                <label
                                    htmlFor={id}
                                >
                                    {count}
                                </label>
                            </React.Fragment>
                        );
                    })
                }
            </Table>
            <Table className="text-gray-600">
                <label></label>
                <label>
                    {t('selected_keys', { count: field.rule.value.size })}
                </label>
                <label>
                    {[...field.rule.value].reduce<number>((sum, key) => {
                        const s = dataSource.filter(which => which[field.fid] === key).length;

                        return sum + s;
                    }, 0)}
                </label>
            </Table>
            <div className="btn-grp">
                <Button
                    onClick={() => {
                        if (field.rule?.type === 'one of') {
                            const curSet = field.rule.value;

                            onChange({
                                type: 'one of',
                                value: new Set<number | string>(
                                    curSet.size === count.size
                                        ? []
                                        : count.keys()
                                ),
                            });
                        }
                    }}
                >
                    {
                        field.rule.value.size === count.size
                            ? t('btn.unselect_all')
                            : t('btn.select_all')
                    }
                </Button>
                <Button
                    onClick={() => {
                        if (field.rule?.type === 'one of') {
                            const curSet = field.rule.value;

                            onChange({
                                type: 'one of',
                                value: new Set<number | string>(
                                    [...count.keys()].filter(key => !curSet.has(key))
                                ),
                            });
                        }
                    }}
                >
                    {t('btn.reverse')}
                </Button>
            </div>
        </Container>
    ) : null;
});

export const FilterTemporalRangeRule: React.FC<RuleFormProps & { active: boolean }> = observer(({
    active,
    field,
    onChange,
}) => {
    const { commonStore } = useGlobalStore();
    const { currentDataset: { dataSource } } = commonStore;

    const sorted = React.useMemo(() => {
        return dataSource.reduce<number[]>((list, d) => {
            try {
                const time = new Date(d[field.fid]).getTime();

                list.push(time);
            } catch (error) {
                
            }
            return list;
        }, []).sort((a, b) => a - b);
    }, [dataSource, field]);

    const [min, max] = React.useMemo(() => {
        return [sorted[0] ?? 0, Math.max(sorted[sorted.length - 1] ?? 0, sorted[0] ?? 0)];
    }, [sorted]);

    React.useEffect(() => {
        if (active && field.rule?.type !== 'temporal range') {
            onChange({
                type: 'temporal range',
                value: [sorted[0] ?? 0, Math.max(sorted[sorted.length - 1] ?? 0, sorted[0] ?? 0)],
            });
        }
    }, [onChange, field, sorted, active]);

    const handleChange = React.useCallback((value: readonly [number, number]) => {
        onChange({
            type: 'temporal range',
            value,
        });
    }, []);

    return field.rule?.type === 'temporal range' ? (
        <Container>
            <Slider
                min={min}
                max={max}
                value={field.rule.value}
                onChange={handleChange}
                isDateTime
            />
        </Container>
    ) : null;
});

export const FilterRangeRule: React.FC<RuleFormProps & { active: boolean }> = observer(({
    active,
    field,
    onChange,
}) => {
    const { commonStore } = useGlobalStore();
    const { currentDataset: { dataSource } } = commonStore;

    const sorted = React.useMemo(() => {
        return dataSource.map(d => d[field.fid]).sort((a, b) => a - b);
    }, [dataSource, field]);

    const [min, max] = React.useMemo(() => {
        return [sorted[0] ?? 0, Math.max(sorted[sorted.length - 1] ?? 0, sorted[0] ?? 0)];
    }, [sorted]);

    React.useEffect(() => {
        if (active && field.rule?.type !== 'range') {
            onChange({
                type: 'range',
                value: [min, max],
            });
        }
    }, [onChange, field, min, max, active]);

    const handleChange = React.useCallback((value: readonly [number, number]) => {
        onChange({
            type: 'range',
            value,
        });
    }, []);

    return field.rule?.type === 'range' ? (
        <Container>
            <Slider
                min={min}
                max={max}
                value={field.rule.value}
                onChange={handleChange}
            />
        </Container>
    ) : null;
});

const filterTabs: Record<IFilterRule['type'], React.FC<RuleFormProps & { active: boolean }>> = {
    'one of': FilterOneOfRule,
    'range': FilterRangeRule,
    'temporal range': FilterTemporalRangeRule,
};

export interface TabsProps extends RuleFormProps {
    tabs: IFilterRule['type'][];
}

const Tabs: React.FC<TabsProps> = observer(({ field, onChange, tabs }) => {
    const { vizStore } = useGlobalStore();
    const { draggableFieldState } = vizStore;

    const { t } = useTranslation('translation', { keyPrefix: 'constant.filter_type' });

    const [which, setWhich] = React.useState(field.rule?.type ?? tabs[0]!);

    return (
        <TabsContainer>
            <TabList role="tablist">
                {
                    tabs.map((tab, i) => (
                        <TabHeader
                            key={i}
                            role="tab"
                            aria-selected={which === tab}
                            id={`filter-tab-${tab.replaceAll(/ /g, '_')}`}
                            aria-controls={`filter-panel-${tab.replaceAll(/ /g, '_')}`}
                            tabIndex={-1}
                            onClick={() => {
                                if (which !== tab) {
                                    setWhich(tab);
                                }
                            }}
                        >
                            {t(tab.replaceAll(/ /g, '_'))}
                        </TabHeader>
                    ))
                }
            </TabList>
            <TabPanel>
                {
                    tabs.map((tab, i) => {
                        const Component = filterTabs[tab];

                        return draggableFieldState === null ? null : (
                            <TabItem
                                key={i}
                                id={`filter-panel-${tab.replaceAll(/ /g, '_')}`}
                                aria-labelledby={`filter-tab-${tab.replaceAll(/ /g, '_')}`}
                                role="tabpanel"
                                hidden={which !== tab}
                                tabIndex={0}
                            >
                                <Component
                                    field={field}
                                    onChange={onChange}
                                    active={which === tab}
                                />
                            </TabItem>
                        );
                    })
                }
            </TabPanel>
        </TabsContainer>
    );
});


export default Tabs;
