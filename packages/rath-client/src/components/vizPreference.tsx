import React, { useCallback } from "react";
import { observer } from 'mobx-react-lite';
import { PrimaryButton, Stack, Checkbox, Panel, PanelType, ComboBox, Label, Slider } from '@fluentui/react';
import { AGGREGATION_LIST, Aggregator } from "../global";
import { useGlobalStore } from "../store";
const checkboxStyles = () => {
    return {
        root: {
            marginTop: "10px",
        },
    };
};

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
                    options={AGGREGATION_LIST}
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
            <Slider
                disabled={!exploreStore.visualConfig.nlg}
                value={exploreStore.nlgThreshold}
                label="NLG Threshold(beta)"
                min={0}
                max={1}
                step={0.01}
                valueFormat={(value: number) => `${Math.round(value * 100)}%`}
                showValue={true}
                onChange={(value: number) => {
                    exploreStore.setNlgThreshold(value);
                    
                }}
                />
        </Panel>
    );
};

export default observer(PreferencePanel);
