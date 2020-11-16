import React, { useState, useEffect } from 'react';
import { PrimaryButton, Panel, PanelType, Toggle } from 'office-ui-fabric-react';
import intl from 'react-intl-universal';
import { BIField, BIFieldType } from '../global';

interface FieldPanelProps {
  show: boolean;
  onClose: () => void;
  onUpdateConfig: (fields: BIField[]) => void;
  fields: BIField[];
}
const FieldPanel: React.FC<FieldPanelProps> = (props) => {
  const {
    show = false,
    // fields = [],
    onUpdateConfig,
    onClose
  } = props;
  const [fields, setFields] = useState<BIField[]>([])
  useEffect(() => {
    setFields(props.fields)
  }, [props.fields])
  
  function updateFieldType(field: BIField, type: BIFieldType) {
    setFields(fields => {
      return fields.map(f => {
        if (field.name === f.name) {
          return {
            name: field.name,
            type
          }
        } else {
          return f
        }
      })
    })
  }

  const onRenderFooterContent = () => <div>
    <PrimaryButton onClick={() => { onUpdateConfig(fields); onClose(); }}>
      {intl.get('meta.save')}
    </PrimaryButton>
  </div>
  
  return (
    <Panel
      isOpen={show}
      type={PanelType.smallFixedFar}
      onDismiss={onClose}
      headerText={intl.get('meta.title')}
      closeButtonAriaLabel="Close"
      onRenderFooterContent={onRenderFooterContent}
    >
      <div>
        {fields.map((field) => (
          <Toggle
            key={field.name}
            checked={field.type === 'dimension'}
            label={field.name}
            onText={intl.get('meta.dimension')}
            offText={intl.get('meta.measure')}
            onChange={(e, checked) => {
              updateFieldType(field, checked ? 'dimension' : 'measure')
            }}
          />
        ))}
      </div>
    </Panel>
  )
}

export default FieldPanel;
