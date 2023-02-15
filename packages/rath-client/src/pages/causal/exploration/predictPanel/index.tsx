import intl from 'react-intl-universal';
import { DefaultButton, Icon, Spinner } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import { nanoid } from "nanoid";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import type { IFieldMeta } from "../../../../interfaces";
import { useGlobalStore } from "../../../../store";
import { useCausalViewContext } from "../../../../store/causalStore/viewStore";
import { execPredict, IPredictProps, PredictAlgorithm, TrainTestSplitFlag } from "../../predict";
import TabList from "./tablist";


const Container = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    > .content {
        flex-grow: 1;
        flex-shrink: 1;
        display: flex;
        flex-direction: column;
        padding: 0.5em;
        overflow: auto;
        > * {
            flex-grow: 0;
            flex-shrink: 0;
        }
    }
`;

const ModeOptions = [
    { key: 'classification', text: 'Classification' },
    { key: 'regression', text: 'Regression' },
] as const;

const TRAIN_RATE = 0.2;

const PredictPanel = forwardRef<{
    updateInput?: (input: { features: IFieldMeta[]; targets: IFieldMeta[] }) => void;
}, {}>(function PredictPanel (_, ref) {
    const { causalStore, dataSourceStore } = useGlobalStore();
    const { fields } = causalStore;
    const { cleanedData, fieldMetas } = dataSourceStore;
    const viewContext = useCausalViewContext();

    const [predictInput, setPredictInput] = useState<{ features: IFieldMeta[]; targets: IFieldMeta[] }>({
        features: [],
        targets: [],
    });
    const [algo, setAlgo] = useState<PredictAlgorithm>('decisionTree');
    const [mode, setMode] = useState<IPredictProps['mode']>('classification');

    useImperativeHandle(ref, () => ({
        updateInput: input => setPredictInput(input),
    }));

    useEffect(() => {
        setPredictInput(before => {
            if (before.features.length || before.targets.length) {
                return {
                    features: fields.filter(f => before.features.some(feat => feat.fid === f.fid)),
                    targets: fields.filter(f => before.targets.some(tar => tar.fid === f.fid)),
                };
            }
            return {
                features: fields.slice(1).map(f => f),
                targets: fields.slice(0, 1),
            };
        });
    }, [fields]);

    const [running, setRunning] = useState(false);

    const canExecute = predictInput.features.length > 0 && predictInput.targets.length > 0;
    const pendingRef = useRef<Promise<unknown>>();

    useEffect(() => {
        pendingRef.current = undefined;
        setRunning(false);
    }, [predictInput]);

    const dataSourceRef = useRef(cleanedData);
    dataSourceRef.current = cleanedData;
    const allFieldsRef = useRef(fieldMetas);
    allFieldsRef.current = fieldMetas;

    const [tab, setTab] = useState<'config' | 'result'>('config');

    const trainTestSplitIndices = useMemo<TrainTestSplitFlag[]>(() => {
        const indices = cleanedData.map((_, i) => i);
        const trainSetIndices = new Map<number, 1>();
        const trainSetTargetSize = Math.floor(cleanedData.length * TRAIN_RATE);
        while (trainSetIndices.size < trainSetTargetSize && indices.length) {
            const [index] = indices.splice(Math.floor(indices.length * Math.random()), 1);
            trainSetIndices.set(index, 1);
        }
        return cleanedData.map((_, i) => trainSetIndices.has(i) ? TrainTestSplitFlag.train : TrainTestSplitFlag.test);
    }, [cleanedData]);

    const trainTestSplitIndicesRef = useRef(trainTestSplitIndices);
    trainTestSplitIndicesRef.current = trainTestSplitIndices;

    const handleClickExec = useCallback(() => {
        const startTime = Date.now();
        setRunning(true);
        const task = execPredict({
            dataSource: dataSourceRef.current,
            fields: allFieldsRef.current,
            model: {
                algorithm: algo,
                features: predictInput.features.map(f => f.fid),
                targets: predictInput.targets.map(f => f.fid),
            },
            trainTestSplitIndices: trainTestSplitIndicesRef.current,
            mode,
        });
        pendingRef.current = task;
        task.then(res => {
            if (task === pendingRef.current && res) {
                const completeTime = Date.now();
                viewContext?.pushPredictResult({
                    id: nanoid(8),
                    algo,
                    startTime,
                    completeTime,
                    data: res,
                });
                setTab('result');
            }
        }).finally(() => {
            pendingRef.current = undefined;
            setRunning(false);
        });
    }, [predictInput, algo, mode, viewContext]);

    useEffect(() => {
        viewContext?.clearPredictResults();
    }, [mode, viewContext]);

    return (
        <Container>
            <DefaultButton
                primary
                iconProps={{ iconName: 'Trending12' }}
                disabled={!canExecute || running}
                onClick={running ? undefined : handleClickExec}
                onRenderIcon={() => running ? <Spinner style={{ transform: 'scale(0.75)' }} /> : <Icon iconName="Play" />}
                style={{ width: 'max-content', flexGrow: 0, flexShrink: 0, marginLeft: '0.6em' }}
                split
                menuProps={{
                    items: ModeOptions.map(opt => opt),
                    onItemClick: (_e, item) => {
                        if (item) {
                            setMode(item.key as typeof mode);
                        }
                    },
                }}
            >
                {`${ModeOptions.find(m => m.key === mode)?.text}${intl.get('causal.analyze.prediction')}`}
            </DefaultButton>
            <TabList algo={algo} setAlgo={setAlgo} tab={tab} setTab={setTab} running={running} predictInput={predictInput} setPredictInput={setPredictInput} />
        </Container>
    );
});


export default observer(PredictPanel);
