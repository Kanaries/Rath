import { observer } from 'mobx-react-lite';
import { FC, ReactNode, useEffect, useState } from 'react';
import MonacoEditor from 'react-monaco-editor';
import { DefaultButton, MessageBar, MessageBarType, Stack } from '@fluentui/react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { useGlobalStore } from '../../../store';

const Container = styled.div`
    .action-bar {
    }
    hr {
        margin: 1em 0em;
    }
`;

interface EditorCoreProps {
    actionButtons?: ReactNode;
    actionPosition?: 'top' | 'bottom';
}

const EditorCore: FC<EditorCoreProps> = (props) => {
    const { actionButtons, actionPosition = 'top' } = props;
    const { editorStore } = useGlobalStore();
    const { muteSpec } = editorStore;
    const [rawCode, setRawCode] = useState<string>(JSON.stringify(muteSpec, null, 2));
    const [notValid, setNotValid] = useState<boolean>(false);
    useEffect(() => {
        if (muteSpec === null) {
            setRawCode('');
            return;
        }
        setRawCode(JSON.stringify(muteSpec, null, 2));
    }, [muteSpec]);

    const updateCode = () => {
        try {
            const newSpec = JSON.parse(rawCode);
            editorStore.updateMuteSpec(newSpec);
            setNotValid(false);
        } catch (e) {
            setNotValid(true);
        }
    };

    return (
        <Container>
            {actionPosition === 'top' && (
                <Stack horizontal tokens={{ childrenGap: 10 }}>
                    <DefaultButton text={intl.get('common.run')} iconProps={{ iconName: 'Play' }} onClick={updateCode} />
                    {actionButtons}
                </Stack>
            )}
            {actionPosition === 'top' && <hr />}
            {notValid && <MessageBar messageBarType={MessageBarType.error}>Not Valid Specification.</MessageBar>}
            <MonacoEditor
                width="500px"
                height="500"
                language="json"
                theme="vs"
                value={rawCode}
                onChange={(newValue) => {
                    setRawCode(newValue);
                }}
            />
            {actionPosition === 'bottom' && <hr />}
            {actionPosition === 'bottom' && (
                <Stack horizontal tokens={{ childrenGap: 10 }}>
                    <DefaultButton text={intl.get('common.run')} iconProps={{ iconName: 'Play' }} onClick={updateCode} />
                    {actionButtons}
                </Stack>
            )}
        </Container>
    );
};

export default observer(EditorCore);
