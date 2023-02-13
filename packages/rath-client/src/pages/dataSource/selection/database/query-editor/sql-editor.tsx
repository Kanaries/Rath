import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { PrimaryButton, Spinner, Stack } from '@fluentui/react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import MonacoEditor, { ChangeHandler, EditorWillMount } from 'react-monaco-editor';
import { IRange, languages } from 'monaco-editor';
import TablePreview from '../table-preview';
import type { TableData } from '..';
import { INestedListItem } from '../components/nested-list-item';

type Monaco = Parameters<EditorWillMount>[0];

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

const createSuggestion = (label: string, kind: languages.CompletionItemKind, range: IRange): languages.CompletionItem => {
    return {
        label,
        kind,
        // documentation: "",
        insertText: label,
        range: range,
    };
};

const keywordsAsSuggestions = [
    'SELECT', 'AS', 'DISTINCT', 'FROM', 'WHERE', 'AND', 'OR', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'JOIN', 'ON',
];

const flatAll = (items: INestedListItem[], path: string[] = []): { label: string; kind: languages.CompletionItemKind }[] => {
    const result: { label: string; kind: languages.CompletionItemKind }[] = [];
    for (const item of items) {
        if (!['database', 'schema', 'table'].includes(item.group ?? '')) {
            result.push({
                label: item.text,
                kind: languages.CompletionItemKind.Field,
            });
            break;
        }
        const label = [...path, item.text].join('.');
        result.push({
            label,
            kind: languages.CompletionItemKind.Module,
        });
        if (Array.isArray(item.children)) {
            result.push(...flatAll(item.children, [...path, item.text]));
        }
    }
    return result;
};

export interface SQLEditorProps {
    busy: boolean;
    setQuery: (q: string) => void;
    preview: TableData | null;
    doPreview: (q: string) => void;
    items: INestedListItem[];
}

const SQLEditor: FC<SQLEditorProps> = ({ setQuery, preview, doPreview, busy, items }) => {
    const [code, setCode] = useState<string>('');

    const updateCode = useCallback<ChangeHandler>(newValue => {
        setCode(newValue);
    }, []);

    const monacoRef = useRef<Monaco>();

    const editorWillMount = useCallback<EditorWillMount>(monaco => {
        monacoRef.current = monaco;
    }, []);

    useEffect(() => {
        const labels = flatAll(items);
        if (monacoRef.current) {
            const disposer = monacoRef.current.languages.registerCompletionItemProvider("sql", {
                provideCompletionItems: (model, position) => {
                    const word = model.getWordUntilPosition(position);
                    const range = {
                        startLineNumber: position.lineNumber,
                        endLineNumber: position.lineNumber,
                        startColumn: word.startColumn,
                        endColumn: word.endColumn,
                    };
                    return {
                        suggestions: labels.map(kw => createSuggestion(kw.label, kw.kind, range)).concat(
                            keywordsAsSuggestions.map(kw => createSuggestion(kw, languages.CompletionItemKind.Keyword, range))
                        ),
                    };
                },
            });
            return () => disposer.dispose();
        }
    }, [items]);

    return (
        <Container>
            <div>
                <TablePreview name="preview" data={preview ?? { meta: [], columns: [], rows: [] }} />
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
                        {busy ? <Spinner /> : intl.get('common.run')}
                    </PrimaryButton>
                </Stack>
                <MonacoEditor language="sql" theme="vs" value={code} onChange={updateCode} editorWillMount={editorWillMount} />
            </Editor>
        </Container>
    );
};

export default SQLEditor;
