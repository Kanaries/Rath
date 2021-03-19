import React from "react";
import { observer } from 'mobx-react-lite';
import { PrimaryButton, Stack, Checkbox, Panel, PanelType, ComboBox, Label } from "office-ui-fabric-react";
import { Aggregator } from "../../global";
import { useGalleryStore } from "./store";
import { action } from "mobx";
const checkboxStyles = () => {
    return {
        root: {
            marginTop: "10px",
        },
    };
};

// todo: import aggregators list from cube-core
const aggregationList: Array<{ key: Aggregator; text: string }> = [
    { key: "sum", text: "Sum" },
    { key: "count", text: "Count" },
    { key: "mean", text: "Mean" },
];
export interface PreferencePanelConfig {
    aggregator: Aggregator;
    defaultAggregated: boolean;
    defaultStack: boolean;
}

const PreferencePanel: React.FC = () => {
    const store = useGalleryStore();
    const { visualConfig, showConfigPanel } = store;

    const { aggregator, defaultAggregated, defaultStack } = visualConfig;

    const closeVisualPannel = action(() => {
        store.showConfigPanel = false;
    })

    const onRenderFooterContent = () => (
        <div>
            <PrimaryButton
                onClick={closeVisualPannel}
            >
                Save
            </PrimaryButton>
        </div>
    );

    return (
        <Panel
            isOpen={showConfigPanel}
            type={PanelType.smallFixedFar}
            onDismiss={closeVisualPannel}
            headerText="Preference"
            closeButtonAriaLabel="Close"
            onRenderFooterContent={onRenderFooterContent}
        >
            <Label>Preference</Label>
            <Stack verticalFill tokens={{ childrenGap: 50, padding: 6 }}>
                <ComboBox
                    selectedKey={aggregator}
                    label="Aggregator"
                    allowFreeform={true}
                    autoComplete="on"
                    options={aggregationList}
                    onChange={action((e, option) => {
                        if (option) {
                            store.visualConfig.aggregator = option.key as Aggregator;
                        }
                    })}
                />
                <Checkbox
                    styles={checkboxStyles}
                    label="measurement aggregation"
                    checked={defaultAggregated}
                    onChange={action((e, isChecked) => {
                        store.visualConfig.defaultAggregated = isChecked || false;
                    })}
                />
                <Checkbox
                    styles={checkboxStyles}
                    label="measurement stack"
                    checked={defaultStack}
                    onChange={action((e, isChecked) => {
                        store.visualConfig.defaultStack = isChecked || false;
                    })}
                />
            </Stack>
        </Panel>
    );
};

export default observer(PreferencePanel);
