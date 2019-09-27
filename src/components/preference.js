import React, { useState, useEffect } from 'react';
import { PrimaryButton, Stack, Checkbox, Panel, PanelType, ComboBox, Label } from 'office-ui-fabric-react';

const checkboxStyles = (props) => {
  return {
    root: {
      marginTop: '10px'
    }
  };
}

// todo: import aggregators list from cube-core
const aggregationList = [
  { key: 'sum', text: 'Sum' },
  { key: 'count', text: 'Count' },
  { key: 'mean', text: 'Mean' }
]

export default function PreferencePanel (props) {
  const {
    show = false,
    onUpdateConfig,
    onClose,
    config
  } = props;
  
  const [aggregator, setAggregator] = useState('sum');
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
        options={aggregationList}
        onChange={(e, option) => {setAggregator(option.key)}}
      />
      <Checkbox styles={checkboxStyles} label="measurement aggregation" checked={defaultAggregated} onChange={(e, isChecked) => {setDefaultAggregated(isChecked)}} />
      <Checkbox styles={checkboxStyles} label="measurement stack" checked={defaultStack} onChange={(e, isChecked) => {setDefaultStack(isChecked)}} />
    </Stack>
  </Panel>
}