import React from "react";
import { observer } from "mobx-react-lite";
import PureTabs from "../components/tabs/pureTab";
import { useGlobalStore } from "../store";
const VisNav: React.FC = (props) => {
    const { vizStore, commonStore } = useGlobalStore();
    const { visIndex, visList } = vizStore;
    const { currentDataset } = commonStore;
    const tabs = visList.map((v) => ({
        key: v.visId,
        label: v.name || "vis",
    }))
    tabs.push({
        key: '_add',
        label: 'Add'
    })
    return (
        <PureTabs
            selectedKey={visList[visIndex].visId}
            tabs={tabs}
            onSelected={(sk, index) => {
                console.log(sk, index)
                if (sk === '_add') {
                    vizStore.saveVisChange();
                    vizStore.addVisualization();
                    vizStore.initMetaState(currentDataset)
                } else {
                    vizStore.saveVisChange();
                    vizStore.selectVisualization(index);
                }
            }}
        />
    );
};

export default observer(VisNav);
