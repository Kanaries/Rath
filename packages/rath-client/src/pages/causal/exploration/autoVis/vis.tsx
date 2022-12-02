import { FC, useMemo } from "react";
import { IPattern } from "@kanaries/loa";
import { observer } from "mobx-react-lite";
import { toJS } from "mobx";
import { NodeSelectionMode, useCausalViewContext } from "../../../../store/causalStore/viewStore";
import { distVis } from "../../../../queries/distVis";
import ErrorBoundary from "../../../../components/visErrorBoundary";
import ReactVega from "../../../../components/react-vega";
import { useGlobalStore } from "../../../../store";


const Vis: FC = () => {
    const { causalStore } = useGlobalStore();
    const { visSample } = causalStore.dataset;
    const viewContext = useCausalViewContext();

    const {
        graphNodeSelectionMode = NodeSelectionMode.NONE, selectedField = null, selectedFieldGroup = []
    } = viewContext ?? {};

    const selectedFields = useMemo(() => {
        if (graphNodeSelectionMode === NodeSelectionMode.NONE) {
            return [];
        } else if (graphNodeSelectionMode === NodeSelectionMode.SINGLE) {
            return selectedField ? [selectedField] : [];
        } else {
            return selectedFieldGroup;
        }
    }, [graphNodeSelectionMode, selectedField, selectedFieldGroup]);

    const viewPattern = useMemo<IPattern | null>(() => {
        if (selectedFields.length === 0) {
            return null;
        }
        return {
            fields: selectedFields,
            imp: selectedFields[0].features.entropy,
        };
    }, [selectedFields]);

    const viewSpec = useMemo(() => {
        if (viewPattern === null) {
            return null;
        }
        return distVis({
            pattern: toJS(viewPattern),
            interactive: true,
            specifiedEncodes: viewPattern.encodes,
        });
    }, [viewPattern]);

    return viewContext && viewSpec && (
        <div>
            <header>
                可视化分析
            </header>
            <ErrorBoundary>
                <ReactVega actions={false} spec={viewSpec} dataSource={visSample} />
            </ErrorBoundary>
        </div>
    );
};


export default observer(Vis);
