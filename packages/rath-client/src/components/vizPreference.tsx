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
    const { megaAutoStore } = useGlobalStore()
    const { visualConfig, showPreferencePannel } = megaAutoStore;

    const { aggregator, defaultAggregated, defaultStack } = visualConfig;

    const closeVisualPannel = useCallback(() => {
        megaAutoStore.setShowPreferencePannel(false);
    }, [megaAutoStore])

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
                            megaAutoStore.setVisualConig(config => {
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
                        megaAutoStore.setVisualConig(config => {
                            visualConfig.defaultAggregated = isChecked || false;
                        })
                    }}
                />
                <Checkbox
                    styles={checkboxStyles}
                    label="measurement stack"
                    checked={defaultStack}
                    onChange={(e, isChecked) => {
                        megaAutoStore.setVisualConig(config => {
                            visualConfig.defaultStack = isChecked || false;
                        })
                    }}
                />
            </Stack>
            <Slider
                disabled={!megaAutoStore.visualConfig.nlg}
                value={megaAutoStore.nlgThreshold}
                label="NLG Threshold(beta)"
                min={0}
                max={1}
                step={0.01}
                valueFormat={(value: number) => `${Math.round(value * 100)}%`}
                showValue={true}
                onChange={(value: number) => {
                    megaAutoStore.setNlgThreshold(value);
                    
                }}
                />
        </Panel>
    );
};

export default observer(PreferencePanel);
