import React, { useRef, useState } from "react";
import { Callout, ActionButton, Toggle, DirectionalHint } from "office-ui-fabric-react";
import { useGlobalState } from "../state";

const UserSettings: React.FC = props => {
  const target = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState<boolean>(false);
  const [state, updateState] = useGlobalState();
  return (
    <div>
      <div ref={target}>
        <ActionButton text="Preference" iconProps={{ iconName: 'PlayerSettings' }} onClick={() => {setShow(true)}}></ActionButton>
      </div>

      {show && (
        <Callout
          target={target.current}
          directionalHint={DirectionalHint.bottomLeftEdge}
          onDismiss={() => {
            setShow(false);
          }}
        >
          <div style={{ padding: '1rem' }}>
            <Toggle
              label="Be Cool"
              checked={state.beCool}
              onText="On"
              offText="Off"
              onChange={(
                ev: React.MouseEvent<HTMLElement>,
                checked?: boolean
              ) => {
                updateState(draft => {
                  draft.beCool = checked || false;
                });
              }}
            />
            <Toggle
              label="Use Server"
              disabled={true}
              checked={state.useServer}
              onText="On"
              offText="Off"
              onChange={(
                ev: React.MouseEvent<HTMLElement>,
                checked?: boolean
              ) => {
                updateState(draft => {
                  draft.useServer = checked || false;
                });
              }}
            />
          </div>
        </Callout>
      )}
    </div>
  );
};

export default UserSettings;

