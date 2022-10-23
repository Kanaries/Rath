import { ActionButton, Callout, CommandButton } from "@fluentui/react";
import { useId } from "@fluentui/react-hooks";
import { observer } from "mobx-react-lite";
import { FC, useEffect, useState } from "react";
import intl from 'react-intl-universal';
import styled from "styled-components";
import type { FieldExtSuggestion } from "../../interfaces";


export interface FieldExtSuggestionsProps {
  fid: string;
  suggestions: FieldExtSuggestion[];
}

const Container = styled.div({
  padding: '1em',
  minWidth: '400px',
  maxWidth: '40vw',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',

  '> *': {
    flexGrow: 0,
    flexShrink: 0,
    width: '100%',

    '& small': {
      display: 'block',
    },
  },
});

const FieldExtSuggestions: FC<FieldExtSuggestionsProps> = ({ fid, suggestions }) => {
  const btnId = useId('field-ext-suggestion-btn');

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      const close = () => setOpen(false);

      document.body.addEventListener('click', close);
      document.body.addEventListener('wheel', close);

      return () => {
        document.body.removeEventListener('click', close);
        document.body.removeEventListener('wheel', close);
      };
    }
  }, [open]);

  return (
    <div onClick={e => e.stopPropagation()}>
      <ActionButton
        style={{
          animation: 'live-polite 4s infinite',
        }}
        id={btnId}
        iconProps={{
          iconName: 'AppIconDefaultAdd',
        }}
        text={intl.get('dataSource.extend.auto')}
        onClick={() => setOpen(true)}
      />
      {open && (
        <Callout target={`#${btnId}`}>
          <Container onClick={() => setOpen(false)}>
            {suggestions.map(((sug, i) => {
              const [title, desc] = intl.get(`dataSource.extend.suggestion.${sug.type}`).split('|');

              return (
                <CommandButton
                  key={i}
                  iconProps={{
                    iconName: 'AutoEnhanceOn',
                  }}
                  styles={{
                    root: {
                      height: 'max-content',
                    },
                    rootHovered: {
                      backgroundColor: '#1890ff10',
                    },
                    flexContainer: {
                      paddingBlockStart: '0.6em',
                      paddingBlockEnd: '0.8em',
                      paddingInline: '0.5em',
                      alignItems: 'baseline',
                      textAlign: 'start',
                      height: 'max-content',
                    },
                    icon: {
                      marginInlineEnd: '0.8em',
                    },
                  }}
                  onClick={() => sug.apply(fid)}
                >
                  <div>
                    <span>
                      {title}
                    </span>
                    {desc && (
                      <small style={{ marginBlockStart: '0.5em' }}>
                        {desc}
                      </small>
                    )}
                  </div>
                </CommandButton>
              );
            }))}
          </Container>
        </Callout>
      )}
    </div>
  );
};


export default observer(FieldExtSuggestions);
