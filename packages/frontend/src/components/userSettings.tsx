import React, { useRef, useState } from "react";
import intl from 'react-intl-universal';
import styled from 'styled-components';
import {
  Callout,
  ActionButton,
  Toggle,
  DirectionalHint,
  IDropdownOption,
  Dropdown
} from 'office-ui-fabric-react'
import DropdownSelect from "./dropDownSelect";
import { observer } from 'mobx-react-lite'
import { SUPPORT_LANG } from "../locales";

import { useGlobalStore } from "../store";
import { IComputeMode, ITaskTestMode } from "../interfaces";
const langOptions: IDropdownOption[] = SUPPORT_LANG.map(lang => ({
  key: lang.value,
  text: lang.name
}))
const TASK_MODE_LIST: IDropdownOption[] = [
  { text: 'local', key: ITaskTestMode.local },
  { text: 'server', key: ITaskTestMode.server }
]

const Container = styled.div`
  display: flex;
  align-items: center;
`
const UserSettings: React.FC = () => {
  const target = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState<boolean>(false);
  const { langStore, pipeLineStore, commonStore } = useGlobalStore();

  return (
    <Container>
      <DropdownSelect
        border
        value={langStore.lang}
        onChange={(e) => {
          langStore.useLocales(e.target.value)
        }}
      >
        {
          langOptions.map(lang => <option key={lang.key} value={lang.key}>{lang.text}</option>)
        }
      </DropdownSelect>
      <div ref={target}>
        <ActionButton
          text={intl.get('preference.title')}
          iconProps={{ iconName: 'PlayerSettings' }}
          onClick={() => {
            setShow(true)
          }}
        ></ActionButton>
      </div>

      {show && (
        <Callout
          target={target.current}
          directionalHint={DirectionalHint.bottomLeftEdge}
          onDismiss={() => {
            setShow(false)
          }}
        >
          <div style={{ padding: '1rem' }}>
            <Toggle
              label="Compute Mode"
              disabled={true}
              checked={pipeLineStore.computateMode === IComputeMode.server}
              onText="Server"
              offText="Worker"
              onChange={(ev: React.MouseEvent<HTMLElement>, checked?: boolean) => {
                pipeLineStore.setComputeMode(checked ? IComputeMode.server : IComputeMode.worker)
              }}
            />
            <Dropdown
                label="task test mode"
                options={TASK_MODE_LIST}
                selectedKey={commonStore.taskMode}
                onChange={(e, option) => {
                    option && commonStore.setTaskTestMode(option.key as any)
                }}
            />
          </div>
        </Callout>
      )}
    </Container>
  )
};

export default observer(UserSettings);
