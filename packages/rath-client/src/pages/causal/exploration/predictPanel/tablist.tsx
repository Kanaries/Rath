import intl from 'react-intl-universal';
import { Pivot, PivotItem } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import type { IFieldMeta } from "../../../../interfaces";
import { useGlobalStore } from "../../../../store";
import { useCausalViewContext } from "../../../../store/causalStore/viewStore";
import { PredictAlgorithm } from "../../predict";
import ConfigPanel from "./configPanel";
import ResultPanel from "./resultPanel";


const TabList: FC<{
    algo: PredictAlgorithm;
    setAlgo: (algo: PredictAlgorithm) => void;
    tab: 'config' | 'result';
    setTab: (tab: 'config' | 'result') => void;
    running: boolean;
    predictInput: {
        features: IFieldMeta[];
        targets: IFieldMeta[];
    };
    setPredictInput: (predictInput: {
        features: IFieldMeta[];
        targets: IFieldMeta[];
    }) => void;
}> = ({ algo, setAlgo, tab, setTab, running, predictInput, setPredictInput }) => {
    const { dataSourceStore } = useGlobalStore();
    const { cleanedData, fieldMetas } = dataSourceStore;
    const viewContext = useCausalViewContext();
    const { predictCache = [] } = viewContext ?? {};

    const dataSourceRef = useRef(cleanedData);
    dataSourceRef.current = cleanedData;
    const allFieldsRef = useRef(fieldMetas);
    allFieldsRef.current = fieldMetas;

    const sortedResults = useMemo(() => {
        return predictCache.slice(0).sort((a, b) => b.completeTime - a.completeTime);
    }, [predictCache]);

    const [comparison, setComparison] = useState<null | [string] | [string, string]>(null);

    useEffect(() => {
        setComparison(group => {
            if (!group) {
                return null;
            }
            const next = group.filter(id => predictCache.some(rec => rec.id === id));
            if (next.length === 0) {
                return null;
            }
            return next as [string] | [string, string];
        });
    }, [predictCache]);

    const diff = useMemo(() => {
        if (comparison?.length === 2) {
            const before = sortedResults.find(res => res.id === comparison[0]);
            const after = sortedResults.find(res => res.id === comparison[1]);
            if (before && after) {
                const temp: unknown[] = [];
                for (let i = 0; i < before.data.result.length; i += 1) {
                    const row = dataSourceRef.current[before.data.result[i][0]];
                    const prev = before.data.result[i][1];
                    const next = after.data.result[i][1];
                    if (next === 1 && prev === 0) {
                        temp.push(Object.fromEntries(Object.entries(row).map(([k, v]) => [
                            allFieldsRef.current.find(f => f.fid === k)?.name ?? k,
                            v,
                        ])));
                    }
                }
                return temp;
            }
        }
    }, [sortedResults, comparison]);

    useEffect(() => {
        if (diff) {
            // TODO: 在界面上实现一个 diff view，代替这个 console
            // eslint-disable-next-line no-console
            console.table(diff);
        }
    }, [diff]);

    return (
        <>
            <Pivot
                selectedKey={tab}
                onLinkClick={(item) => {
                    item && setTab(item.props.itemKey as typeof tab);
                }}
                style={{ marginTop: '0.5em' }}
            >
                <PivotItem itemKey="config" headerText={intl.get('causal.analyze.model_config')} />
                <PivotItem itemKey="result" headerText={intl.get('causal.analyze.predict_result')} />
            </Pivot>
            <div className="content">
                {{
                    config: <ConfigPanel algo={algo} setAlgo={setAlgo} running={running} predictInput={predictInput} setPredictInput={setPredictInput} />,
                    result: <ResultPanel />
                }[tab]}
            </div>
        </>
    );
};


export default observer(TabList);
