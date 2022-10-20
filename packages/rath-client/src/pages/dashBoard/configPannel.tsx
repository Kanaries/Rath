import React, { useCallback } from "react";
import { observer } from 'mobx-react-lite';
import { PrimaryButton, Stack, Panel, PanelType, ComboBox, Label } from '@fluentui/react';
import { AGGREGATION_LIST, Aggregator } from "../../global";
import { useGlobalStore } from "../../store";

export interface PreferencePanelConfig {
    aggregator: Aggregator;
    defaultAggregated: boolean;
    defaultStack: boolean;
}

const PreferencePanel: React.FC = () => {
    const { dashBoardStore } = useGlobalStore()
    const { config, showConfigPanel } = dashBoardStore;
    const { aggregator } = config;
    
    const closeConfigPanel = useCallback(() => {
        dashBoardStore.setShowConfig(false);
    }, [dashBoardStore])

    const onRenderFooterContent = () => (
        <div>
            <PrimaryButton
                onClick={closeConfigPanel}
            >
                Save
            </PrimaryButton>
        </div>
    );

    return (
        <Panel
            isOpen={showConfigPanel}
            type={PanelType.smallFixedFar}
            onDismiss={() => { dashBoardStore.setShowConfig(false); }}
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
                    options={AGGREGATION_LIST}
                    onChange={(ev, option) => {
                        if (option) {
                            dashBoardStore.setAggregator(option.key as Aggregator);
                        }
                    }}
                />
            </Stack>
        </Panel>
    );
};

export default observer(PreferencePanel);
