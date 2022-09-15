import React, { useRef } from "react";
import intl from 'react-intl-universal';
import styled from 'styled-components';
import {
  ActionButton,
  IDropdownOption,
  IconButton
} from '@fluentui/react'
import { observer } from 'mobx-react-lite'
import { SUPPORT_LANG } from "../locales";
import { useGlobalStore } from "../store";
import DropdownSelect from "./dropDownSelect";

const langOptions: IDropdownOption[] = SUPPORT_LANG.map(lang => ({
  key: lang.value,
  text: lang.name
}))

const Container = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
`
const UserSettings: React.FC = () => {
  const target = useRef<HTMLDivElement>(null);
  const { langStore, commonStore } = useGlobalStore();
  const { navMode } = commonStore
  return (
    <Container>
      {
        navMode === 'text' && <DropdownSelect
        border
        value={langStore.lang}
        onChange={(e) => {
          langStore.changeLocalesAndReload(e.target.value);
        }}
      >
        {
          langOptions.map(lang => <option key={lang.key} value={lang.key}>{lang.text}</option>)
        }
      </DropdownSelect>
      }
      <div ref={target}>
        <ActionButton
          text={commonStore.navMode === 'text' ? intl.get('preference.title') : ''}
          iconProps={{ iconName: 'PlayerSettings' }}
          onClick={() => {
            commonStore.setShowAnalysisConfig(true);
          }}
        ></ActionButton>
      </div>
      <div>
        <IconButton iconProps={{ iconName: 'CollapseMenu' }} onClick={() => {
          commonStore.setNavMode(navMode === 'icon' ? 'text' : 'icon')
        }} />
      </div>
    </Container>
  )
};

export default observer(UserSettings);
