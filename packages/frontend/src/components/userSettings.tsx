import React, { useEffect, useRef, useState } from "react";
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
import { DropdownSelect } from '@tableau/tableau-ui';
import { useGlobalState } from "../state";
import { SUPPORT_LANG } from "../locales";
import { useLocales } from "../utils/useLocales";
const langOptions: IDropdownOption[] = SUPPORT_LANG.map(lang => ({
  key: lang.value,
  text: lang.name
}))

const Container = styled.div`
  display: flex;
  align-items: center;
`
const UserSettings: React.FC = props => {
  const target = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState<boolean>(false);
  const [state, updateState] = useGlobalState();
  const loadLocales = useLocales((lang) => {
    updateState(s => {
      s.lang = lang;
    })
  });
  useEffect(() => {
    let currentLocale = intl.determineLocale({
      urlLocaleKey: 'lang',
      cookieLocaleKey: 'lang',
    })
    if (!SUPPORT_LANG.find(f => f.value === currentLocale)) {
      currentLocale = langOptions[0].key as string
    }
    loadLocales(currentLocale)
  }, [])
  return (
    <Container>
      <DropdownSelect
        value={state.lang}
        onChange={(e) => {
          loadLocales(e.target.value as string)
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
              label="Be Cool"
              checked={state.beCool}
              onText="On"
              offText="Off"
              onChange={(ev: React.MouseEvent<HTMLElement>, checked?: boolean) => {
                updateState((draft) => {
                  draft.beCool = checked || false
                })
              }}
            />
            <Toggle
              label="Use Server"
              disabled={true}
              checked={state.useServer}
              onText="On"
              offText="Off"
              onChange={(ev: React.MouseEvent<HTMLElement>, checked?: boolean) => {
                updateState((draft) => {
                  draft.useServer = checked || false
                })
              }}
            />
          </div>
        </Callout>
      )}
    </Container>
  )
};

export default UserSettings;

