import React, { useState, useEffect } from 'react';
import { PrimaryButton, Stack, Checkbox, Panel, PanelType, ComboBox, Label } from '@fluentui/react';
import { AGGREGATION_LIST, Aggregator } from '../global';
const checkboxStyles = () => {
  return {
    root: {
      marginTop: '10px'
    }
  };
}

export interface PreferencePanelConfig {
  aggregator: Aggregator;
  defaultAggregated: boolean;
  defaultStack: boolean
}
export interface PreferencePanelProps {
  show: boolean;
  onUpdateConfig: (props: PreferencePanelConfig) => void;
  onClose: () => void;
  config: PreferencePanelConfig
}

const PreferencePanel: React.FC<PreferencePanelProps> = (props) => {
  const {
    show = false,
    onUpdateConfig,
    onClose,
    config
  } = props;
  
  const [aggregator, setAggregator] = useState<Aggregator>('sum');
  const [defaultAggregated, setDefaultAggregated] = useState(true);
  const [defaultStack, setDefaultStack] = useState(true);
  
  useEffect(() => {
    const { aggregator, defaultAggregated, defaultStack } = config;
    setAggregator(aggregator);
    setDefaultAggregated(defaultAggregated);
    setDefaultStack(defaultStack);
  }, [config, show])
  
  const onRenderFooterContent = () => <div>
    <PrimaryButton onClick={() => { onUpdateConfig({ aggregator, defaultAggregated, defaultStack }) }}>
      Save
    </PrimaryButton>
  </div>
  
  return <Panel
    isOpen={show}
    type={PanelType.smallFixedFar}
    onDismiss={onClose}
    headerText="Preference"
    closeButtonAriaLabel="Close"
    onRenderFooterContent={onRenderFooterContent}
  >
    <Label>Preference</Label>
    <Stack verticalFill tokens={{ childrenGap: 50, padding: 6}}>
      <ComboBox
        selectedKey={aggregator}
        label="Aggregator"
        allowFreeform={true}
        autoComplete="on"
        options={AGGREGATION_LIST}
        onChange={(e, option) => {option && setAggregator(option.key as Aggregator)}}
      />
      <Checkbox styles={checkboxStyles} label="measurement aggregation" checked={defaultAggregated} onChange={(e, isChecked) => {setDefaultAggregated(isChecked || false)}} />
      <Checkbox styles={checkboxStyles} label="measurement stack" checked={defaultStack} onChange={(e, isChecked) => {setDefaultStack(isChecked || false)}} />
    </Stack>
  </Panel>
}

export default PreferencePanel;