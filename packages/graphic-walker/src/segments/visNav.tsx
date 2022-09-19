import React, { useCallback } from "react";
import { observer } from "mobx-react-lite";
import PureTabs, { ITabOption } from "../components/tabs/pureTab";
import { useGlobalStore } from "../store";


const ADD_KEY = '_add';

const VisNav: React.FC = (props) => {
    const { vizStore, commonStore } = useGlobalStore();
    const { visIndex, visList } = vizStore;
    const { currentDataset } = commonStore;

    const tabs: ITabOption[] = visList.map((v) => ({
        key: v.visId,
        label: v.name?.[0] || 'vis',
        options: v.name?.[1],
    }));

    tabs.push({
        key: ADD_KEY,
        label: 'main.tablist.new'
    });

    const visSelectionHandler = useCallback((tabKey: string, tabIndex: number) => {
        if (tabKey === ADD_KEY) {
            vizStore.addVisualization();
            vizStore.initMetaState(currentDataset)
        } else {
            vizStore.selectVisualization(tabIndex);
        }
    }, [currentDataset, vizStore])

    const editLabelHandler = useCallback((content: string, tabIndex: number) => {
        vizStore.setVisName(tabIndex, content)
    }, [])

    return (
        <PureTabs
            selectedKey={visList[visIndex].visId}
            tabs={tabs}
            onEditLabel={editLabelHandler}
            onSelected={visSelectionHandler}
        />
    );
};

export default observer(VisNav);
