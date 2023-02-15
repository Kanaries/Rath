import intl from 'react-intl-universal';
import { Checkbox, DetailsList, Dropdown, IColumn, Label, SelectionMode } from "@fluentui/react";
import produce from "immer";
import { observer } from "mobx-react-lite";
import { FC, useMemo } from "react";
import styled from "styled-components";
import type { IFieldMeta } from "../../../../interfaces";
import { useGlobalStore } from "../../../../store";
import { PredictAlgorithm, PredictAlgorithms } from "../../predict";


const TableContainer = styled.div`
    flex-grow: 0;
    flex-shrink: 0;
    overflow: auto;
`;

const Row = styled.div<{ selected: 'attribution' | 'target' | false }>`
    > div {
        background-color: ${({ selected }) => (
            selected === 'attribution' ? 'rgba(194,132,2,0.2)' : selected === 'target' ? 'rgba(66,121,242,0.2)' : undefined
        )};
        filter: ${({ selected }) => selected ? 'unset' : 'opacity(0.8)'};
        cursor: pointer;
        :hover {
            filter: unset;
        }
    }
`;

const ConfigPanel: FC<{
    algo: PredictAlgorithm;
    setAlgo: (algo: PredictAlgorithm) => void;
    running: boolean;
    predictInput: {
        features: IFieldMeta[];
        targets: IFieldMeta[];
    };
    setPredictInput: (predictInput: {
        features: IFieldMeta[];
        targets: IFieldMeta[];
    }) => void;
}> = ({ algo, setAlgo, running, predictInput, setPredictInput }) => {
    const { causalStore } = useGlobalStore();
    const { fields } = causalStore;

    const fieldsTableCols = useMemo<IColumn[]>(() => {
        return [
            {
                key: 'selectedAsFeature',
                name: `${intl.get('causal.analyze.feature')} (${predictInput.features.length} / ${fields.length})`,
                onRender: (item) => {
                    const field = item as IFieldMeta;
                    const checked = predictInput.features.some(f => f.fid === field.fid);
                    return (
                        <Checkbox
                            checked={checked}
                            disabled={running}
                            onChange={(_, ok) => {
                                if (running) {
                                    return;
                                }
                                setPredictInput(produce(predictInput, draft => {
                                    draft.features = draft.features.filter(f => f.fid !== field.fid);
                                    draft.targets = draft.targets.filter(f => f.fid !== field.fid);
                                    if (ok) {
                                        draft.features.push(field);
                                    }
                                }));
                            }}
                        />
                    );
                },
                isResizable: false,
                minWidth: 90,
                maxWidth: 90,
            },
            {
                key: 'selectedAsTarget',
                name: `${intl.get('causal.analyze.target')} (${predictInput.targets.length} / ${fields.length})`,
                onRender: (item) => {
                    const field = item as IFieldMeta;
                    const checked = predictInput.targets.some(f => f.fid === field.fid);
                    return (
                        <Checkbox
                            checked={checked}
                            disabled={running}
                            onChange={(_, ok) => {
                                if (running) {
                                    return;
                                }
                                setPredictInput(produce(predictInput, draft => {
                                    draft.features = draft.features.filter(f => f.fid !== field.fid);
                                    draft.targets = draft.targets.filter(f => f.fid !== field.fid);
                                    if (ok) {
                                        draft.targets.push(field);
                                    }
                                }));
                            }}
                        />
                    );
                },
                isResizable: false,
                minWidth: 90,
                maxWidth: 90,
            },
            {
                key: 'name',
                name: intl.get('causal.analyze.name'),
                onRender: (item) => {
                    const field = item as IFieldMeta;
                    return (
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {field.name || field.fid}
                        </span>
                    );
                },
                minWidth: 120,
            },
        ];
    }, [fields, predictInput, running, setPredictInput]);

    return (
        <>
            <Dropdown
                label={intl.get('causal.analyze.model')}
                options={PredictAlgorithms.map(algo => ({ key: algo.key, text: algo.text }))}
                selectedKey={algo}
                onChange={(_, option) => {
                    const item = PredictAlgorithms.find(which => which.key === option?.key);
                    if (item) {
                        setAlgo(item.key);
                    }
                }}
                style={{ width: 'max-content' }}
            />
            <Label style={{ marginTop: '1em' }}>{intl.get('causal.analyze.analyze_space')}</Label>
            <TableContainer>
                <DetailsList
                    items={fields.slice(0)}
                    columns={fieldsTableCols}
                    selectionMode={SelectionMode.none}
                    onRenderRow={(props, defaultRender) => {
                        const field = props?.item as IFieldMeta;
                        const checkedAsAttr = predictInput.features.some(f => f.fid === field.fid);
                        const checkedAsTar = predictInput.targets.some(f => f.fid === field.fid);
                        return (
                            <Row selected={checkedAsAttr ? 'attribution' : checkedAsTar ? 'target' : false}>
                                {defaultRender?.(props)}
                            </Row>
                        );
                    }}
                />
            </TableContainer>
        </>
    );
};


export default observer(ConfigPanel);
