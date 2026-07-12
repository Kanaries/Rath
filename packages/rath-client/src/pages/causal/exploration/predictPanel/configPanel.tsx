import intl from 'react-intl-universal';
import produce from 'immer';
import { observer } from 'mobx-react-lite';
import { FC, useMemo } from 'react';
import styled from 'styled-components';
import { RathColumn, RathDataTable } from '../../../../components/rath-ui/rath-data-table';
import { RathSelect } from '../../../../components/rath-ui/rath-select';
import { Checkbox } from '../../../../components/ui/checkbox';
import { Label } from '../../../../components/ui/label';
import type { IFieldMeta } from '../../../../interfaces';
import { useGlobalStore } from '../../../../store';
import { PredictAlgorithm, PredictAlgorithms } from '../../predict';

const TableContainer = styled.div`
    flex-grow: 0;
    flex-shrink: 0;
    min-width: 0;
    overflow: hidden;
`;

const ConfigPanel: FC<{
    algo: PredictAlgorithm;
    setAlgo: (algo: PredictAlgorithm) => void;
    running: boolean;
    predictInput: {
        features: IFieldMeta[];
        targets: IFieldMeta[];
    };
    setPredictInput: (predictInput: { features: IFieldMeta[]; targets: IFieldMeta[] }) => void;
}> = ({ algo, setAlgo, running, predictInput, setPredictInput }) => {
    const { causalStore } = useGlobalStore();
    const { fields } = causalStore;

    const fieldsTableCols = useMemo<RathColumn<IFieldMeta>[]>(() => {
        return [
            {
                key: 'selectedAsFeature',
                name: `${intl.get('causal.analyze.feature')} (${predictInput.features.length} / ${fields.length})`,
                onRender: (item) => {
                    const field = item as IFieldMeta;
                    const checked = predictInput.features.some((f) => f.fid === field.fid);
                    return (
                        <Checkbox
                            aria-label={`Use ${field.name || field.fid} as a feature`}
                            checked={checked}
                            disabled={running}
                            onCheckedChange={(ok) => {
                                if (running) {
                                    return;
                                }
                                setPredictInput(
                                    produce(predictInput, (draft) => {
                                        draft.features = draft.features.filter((f) => f.fid !== field.fid);
                                        draft.targets = draft.targets.filter((f) => f.fid !== field.fid);
                                        if (ok === true) {
                                            draft.features.push(field);
                                        }
                                    })
                                );
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
                    const checked = predictInput.targets.some((f) => f.fid === field.fid);
                    return (
                        <Checkbox
                            aria-label={`Use ${field.name || field.fid} as a target`}
                            checked={checked}
                            disabled={running}
                            onCheckedChange={(ok) => {
                                if (running) {
                                    return;
                                }
                                setPredictInput(
                                    produce(predictInput, (draft) => {
                                        draft.features = draft.features.filter((f) => f.fid !== field.fid);
                                        draft.targets = draft.targets.filter((f) => f.fid !== field.fid);
                                        if (ok === true) {
                                            draft.targets.push(field);
                                        }
                                    })
                                );
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
                    return <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{field.name || field.fid}</span>;
                },
                minWidth: 120,
            },
        ];
    }, [fields, predictInput, running, setPredictInput]);

    return (
        <>
            <RathSelect
                label={intl.get('causal.analyze.model')}
                options={PredictAlgorithms.map((algo) => ({ key: algo.key, text: algo.text }))}
                selectedKey={algo}
                onChange={(key) => {
                    const item = PredictAlgorithms.find((which) => which.key === key);
                    if (item) {
                        setAlgo(item.key);
                    }
                }}
                className="w-max"
            />
            <Label style={{ marginTop: '1em' }}>{intl.get('causal.analyze.analyze_space')}</Label>
            <TableContainer>
                <RathDataTable
                    items={fields.slice(0)}
                    columns={fieldsTableCols}
                    getRowKey={(field) => field.fid}
                    maxHeight="min(45vh, 420px)"
                    virtualizationThreshold={40}
                    rowClassName={(field) => {
                        const checkedAsAttr = predictInput.features.some((f) => f.fid === field.fid);
                        const checkedAsTar = predictInput.targets.some((f) => f.fid === field.fid);
                        if (checkedAsAttr) {
                            return 'bg-[#c2840233] opacity-100';
                        }
                        if (checkedAsTar) {
                            return 'bg-[#4279f233] opacity-100';
                        }
                        return 'opacity-80 hover:opacity-100';
                    }}
                />
            </TableContainer>
        </>
    );
};

export default observer(ConfigPanel);
