import React, { useCallback } from "react";
import { observer } from 'mobx-react-lite';
import { PrimaryButton, Stack, Checkbox, Panel, PanelType, ComboBox, Label } from "office-ui-fabric-react";
import { Aggregator } from "../global";
import { useGlobalStore } from "../store";
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

const PreferencePanel: React.FC = () => {
    const { exploreStore } = useGlobalStore()
    const { visualConfig, showPreferencePannel } = exploreStore;

    const { aggregator, defaultAggregated, defaultStack } = visualConfig;

    const closeVisualPannel = useCallback(() => {
        exploreStore.setShowPreferencePannel(false);
    }, [exploreStore])

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
            isOpen={showPreferencePannel}
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
                    label="aggregator"
                    allowFreeform={true}
                    autoComplete="on"
                    options={aggregationList}
                    onChange={(e, option) => {
                        if (option) {
                            exploreStore.setVisualConig(config => {
                                config.aggregator = option.key as Aggregator;
                            })
                        }
                    }}
                />
                <Checkbox
                    styles={checkboxStyles}
                    label="measurement aggregation"
                    checked={defaultAggregated}
                    onChange={(e, isChecked) => {
                        exploreStore.setVisualConig(config => {
                            visualConfig.defaultAggregated = isChecked || false;
                        })
                    }}
                />
                <Checkbox
                    styles={checkboxStyles}
                    label="measurement stack"
                    checked={defaultStack}
                    onChange={(e, isChecked) => {
                        exploreStore.setVisualConig(config => {
                            visualConfig.defaultStack = isChecked || false;
                        })
                    }}
                />
            </Stack>
        </Panel>
    );
};

export default observer(PreferencePanel);
