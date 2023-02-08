import { FC, useCallback, useState } from 'react';
import { PrimaryButton, Spinner, Stack } from '@fluentui/react';
import styled from 'styled-components';
import MonacoEditor, { ChangeHandler } from 'react-monaco-editor';
import intl from 'react-intl-universal';
import TablePreview from '../table-preview';
import type { TableData } from '../..';

const Container = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    > * {
        flex-grow: 1;
        flex-shrink: 1;
        flex-basis: 0%;
        overflow: auto;
        margin: 0;
        padding: 0;
    }
`;

const Editor = styled.div`
    border-top: 1px solid #eee;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    > *:last-child {
        flex-grow: 1;
        flex-shrink: 1;
        flex-basis: 0%;
        overflow: auto;
    }
`;

export interface SQLEditorProps {
    busy: boolean;
    setQuery: (q: string) => void;
    preview: TableData | null;
    doPreview: (q: string) => void;
}

const SQLEditor: FC<SQLEditorProps> = ({ setQuery, preview, doPreview, busy }) => {
    const [code, setCode] = useState<string>('');

    const updateCode = useCallback<ChangeHandler>(newValue => {
        setCode(newValue);
    }, []);

    return (
        <Container>
            <div>
                <TablePreview data={preview ?? { columns: [], rows: [] }} />
            </div>
            <Editor>
                <Stack horizontal style={{ marginBlock: '0.5em', paddingInline: '1em' }} horizontalAlign="end">
                    <PrimaryButton
                        disabled={busy}
                        onClick={() => {
                            setQuery(code);
                            doPreview(code);
                        }}
                        iconProps={busy ? undefined : { iconName: "Play" }}
                    >
                        {busy ? <Spinner /> : intl.get('common.preview')}
                    </PrimaryButton>
                </Stack>
                <MonacoEditor language="sql" theme="vs" value={code} onChange={updateCode} />
            </Editor>
        </Container>
    );
};

export default SQLEditor;
