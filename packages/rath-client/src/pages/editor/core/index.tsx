import { observer } from 'mobx-react-lite';
import { FC, ReactNode, useEffect, useState } from 'react';
import MonacoEditor from 'react-monaco-editor';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { useGlobalStore } from '../../../store';
import { RathIcon } from '../../../components/icons';
import { Alert } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';

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
                <div style={{ display: 'flex', gap: 10 }}>
                    <Button variant="outline" onClick={updateCode}>
                        <RathIcon name="Play" />
                        {intl.get('common.run')}
                    </Button>
                    {actionButtons}
                </div>
            )}
            {actionPosition === 'top' && <hr />}
            {notValid && <Alert variant="destructive">Not Valid Specification.</Alert>}
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
                <div style={{ display: 'flex', gap: 10 }}>
                    <Button variant="outline" onClick={updateCode}>
                        <RathIcon name="Play" />
                        {intl.get('common.run')}
                    </Button>
                    {actionButtons}
                </div>
            )}
        </Container>
    );
};

export default observer(EditorCore);
