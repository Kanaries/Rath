import { useCallback, useState } from 'react';
import { DefaultButton, Stack } from '@fluentui/react';
import styled from 'styled-components';
import MonacoEditor, { ChangeHandler } from 'react-monaco-editor';
import intl from 'react-intl-universal';
import { QueryEditorProps } from './interfaces';

const Container = styled.div`
    width: 100%;
    height: 300;
    .sql-editor {
        margin-top: 1em;
    }
`;

const SQLEditor = ({ setQuery, preview }: QueryEditorProps) => {
    const [code, setCode] = useState<string>('');

    const updateCode = useCallback<ChangeHandler>((newValue, e) => {
        setCode(newValue);
    }, []);
    return (
        <Container>
            <Stack horizontal>
                <DefaultButton
                    onClick={() => {
                        setQuery(code);
                        preview(code);
                    }}
                >
                    {intl.get('common.preview')}
                </DefaultButton>
            </Stack>
            <div className="sql-editor">
                <MonacoEditor width="100%" height="300" language="sql" theme="vs" value={code} onChange={updateCode} />
            </div>
        </Container>
    );
};

export default SQLEditor;
