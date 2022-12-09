import { Dropdown, Label } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { FC, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import FilterCreationPill from '../../../../components/filterCreationPill';
import type { IFilter } from '../../../../interfaces';
import { getGlobalStore, useGlobalStore } from '../../../../store';
import { useCausalViewContext } from '../../../../store/causalStore/viewStore';
// import { PAG_NODE } from '../../config';
import { FilterCell } from '../../filters';
import { useWhatIfContext } from './context';


const Container = styled.div`
    display: flex;
    flex-direction: column;
    padding-bottom: 1.6em;
    > * {
        flex-grow: 0;
        flex-shrink: 0;
        margin-bottom: 1em;
    }
`;

const DefinitionPanel: FC = () => {
    const { causalStore } = useGlobalStore();
    const { allFields } = causalStore.dataset;
    const context = useWhatIfContext();
    const viewContext = useCausalViewContext();
    const { selectedFieldGroup } = viewContext ?? {};

    useEffect(() => {
        if (context) {
            const [outcome, treatment] = selectedFieldGroup ?? [undefined, undefined];
            if (outcome) {
                context.updateDefinition('outcome', outcome.fid);
                const { causalStore: { model: { causality } } } = getGlobalStore();
                const links = (causality ?? []).filter(link => {
                    const matched = [link.src, link.tar].filter(fid => [outcome.fid, treatment?.fid].includes(fid));
                    if (matched.length === 1) {
                        return true;
                        // const typeInLink = link.src === matched[0] ? link.tar_type : link.src_type;
                        // if (typeInLink !== PAG_NODE.ARROW) {
                        //     return true;
                        // }
                    }
                    return false;
                });
                if (treatment) {
                    const confounders: string[] = [];
                    const effectModifiers: string[] = [];
                    for (const link of links) {
                        if ([link.src, link.tar].includes(treatment.fid)) {
                            confounders.push(link.src === treatment.fid ? link.tar : link.src);
                            continue;
                        }
                        effectModifiers.push(link.src === outcome.fid ? link.tar : link.src);
                    }
                    context.updateDefinition('confounders', confounders);
                    context.updateDefinition('effectModifiers', effectModifiers.filter(fid => !confounders.includes(fid)));
                    context.updateDefinition('predicates', [{
                        fid: treatment.fid,
                        type: 'set',
                        values: [],
                    }]);
                } else {
                    context.updateDefinition('confounders', []);
                    context.updateDefinition('effectModifiers', links.map(link => {
                        return link.src === outcome.fid ? link.tar : link.src;
                    }));
                    context.updateDefinition('predicates', []);
                }
            }
        }
    }, [selectedFieldGroup, context]);

    const appendPopulationPicker = useCallback((filter: IFilter) => {
        if (context) {
            context?.updateDefinition('populationPicker', context.definitions.populationPicker.concat([filter]));
        }
    }, [context]);

    const removePopulationPicker = useCallback((index: number) => {
        if (context) {
            context?.updateDefinition('populationPicker', context.definitions.populationPicker.filter((_, i) => i !== index));
        }
    }, [context]);

    const appendPredicate = useCallback((filter: IFilter) => {
        if (context) {
            context?.updateDefinition('predicates', context.definitions.predicates.concat([filter]));
        }
    }, [context]);

    const removePredicate = useCallback((index: number) => {
        if (context) {
            context?.updateDefinition('predicates', context.definitions.predicates.filter((_, i) => i !== index));
        }
    }, [context]);

    const selectedFields = context ? context.definitions.confounders.concat(
        context.definitions.effectModifiers
    ).concat(
        [context.definitions.outcome]
    ) : [];

    const unselectedFields = allFields.filter(f => !selectedFields.includes(f.fid));

    const appendConfounder = useCallback((fid: string) => {
        if (context) {
            context?.updateDefinition('confounders', context.definitions.confounders.concat([fid]));
        }
    }, [context]);

    const removeConfounder = useCallback((index: number) => {
        if (context) {
            context?.updateDefinition('confounders', context.definitions.confounders.filter((_, i) => i !== index));
        }
    }, [context]);

    const appendEM = useCallback((fid: string) => {
        if (context) {
            context?.updateDefinition('effectModifiers', context.definitions.effectModifiers.concat([fid]));
        }
    }, [context]);

    const removeEM = useCallback((index: number) => {
        if (context) {
            context?.updateDefinition('effectModifiers', context.definitions.effectModifiers.filter((_, i) => i !== index));
        }
    }, [context]);

    return context ? (
        <Container>
            <div>
                <Label style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center' }}>
                    <span>{'样本空间 (Population)' || 'Population'}</span>
                    <div
                        style={{
                            display: 'flex',
                            padding: '0 2em',
                        }}
                    >
                        <FilterCreationPill
                            fields={allFields}
                            onFilterSubmit={(_, filter) => appendPopulationPicker(filter)}
                        />
                    </div>
                </Label>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        overflow: 'auto hidden',
                        margin: '0.7em 0 0',
                    }}
                >
                    {context.definitions.populationPicker.map((filter, i) => {
                        const field = allFields.find((f) => f.fid === filter.fid);

                        return field ? (
                            <FilterCell
                                key={i}
                                field={field}
                                data={filter}
                                remove={() => removePopulationPicker(i)}
                            />
                        ) : null;
                    })}
                </div>
            </div>
            <Dropdown
                label={'衡量指标 (Outcome)' || 'Outcome'}
                required
                selectedKey={context.definitions.outcome}
                options={allFields.filter(f => f.fid === context.definitions.outcome).map(f => ({
                    key: f.fid,
                    text: f.name || f.fid,
                })).concat(unselectedFields.map(f => ({
                    key: f.fid,
                    text: f.name || f.fid,
                })))}
                onChange={(_, option) => {
                    const f = option?.key ? unselectedFields.find(which => which.fid === option.key) : null;
                    context.updateDefinition('outcome', f?.fid ?? '');
                }}
                style={{ width: '12em' }}
            />
            <div>
                <Label>{'联合影响因素 (Confounders)' || 'Confounders'}</Label>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        overflow: 'auto hidden',
                        margin: '0.7em 0 0',
                    }}
                >
                    {context.definitions.confounders.map((fid, i) => (
                        <Dropdown
                            key={i}
                            selectedKey={fid}
                            options={[
                                { key: fid, text: allFields.find(f => f.fid === fid)?.name || fid, disabled: true },
                                { key: '', text: '删除' },
                            ]}
                            onChange={(_, option) => {
                                if (option?.key !== fid) {
                                    removeConfounder(i);
                                }
                            }}
                        />
                    ))}
                    <Dropdown
                        placeholder="新增"
                        selectedKey={-1}
                        options={unselectedFields.map(f => ({
                            key: f.fid,
                            text: f.name ?? f.fid,
                        }))}
                        onChange={(_, option) => {
                            const f = option?.key ? unselectedFields.find(which => which.fid === option.key) : null;
                            if (f) {
                                appendConfounder(f.fid);
                            }
                        }}
                        style={{ width: '12em' }}
                    />
                </div>
            </div>
            <div>
                <Label>{'外部影响因素（Effect Modifiers）' || 'Effect Modifiers'}</Label>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        overflow: 'auto hidden',
                        margin: '0.7em 0 0',
                    }}
                >
                    {context.definitions.effectModifiers.map((fid, i) => (
                        <Dropdown
                            key={i}
                            selectedKey={fid}
                            options={[
                                { key: fid, text: allFields.find(f => f.fid === fid)?.name || fid, disabled: true },
                                { key: '', text: '删除' },
                            ]}
                            onChange={(_, option) => {
                                if (option?.key !== fid) {
                                    removeEM(i);
                                }
                            }}
                        />
                    ))}
                    <Dropdown
                        placeholder="新增"
                        selectedKey={-1}
                        options={unselectedFields.map(f => ({
                            key: f.fid,
                            text: f.name ?? f.fid,
                        }))}
                        onChange={(_, option) => {
                            const f = option?.key ? unselectedFields.find(which => which.fid === option.key) : null;
                            if (f) {
                                appendEM(f.fid);
                            }
                        }}
                        style={{ width: '12em' }}
                    />
                </div>
            </div>
            <div>
                <Label style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center' }} required>
                    <span>{'目标群体 (Predicates)' || 'Predicates'}</span>
                    <div
                        style={{
                            display: 'flex',
                            padding: '0 2em',
                        }}
                    >
                        <FilterCreationPill
                            fields={allFields}
                            onFilterSubmit={(_, filter) => appendPredicate(filter)}
                        />
                    </div>
                </Label>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        overflow: 'auto hidden',
                        margin: '0.7em 0 0',
                    }}
                >
                    {context.definitions.predicates.map((filter, i) => {
                        const field = allFields.find((f) => f.fid === filter.fid);

                        return field ? (
                            <FilterCell
                                key={i}
                                field={field}
                                data={filter}
                                remove={() => removePredicate(i)}
                            />
                        ) : null;
                    })}
                </div>
            </div>
        </Container>
    ) : null;
};


export default observer(DefinitionPanel);
