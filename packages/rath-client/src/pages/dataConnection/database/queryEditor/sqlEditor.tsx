import { FC, useCallback, useEffect, useRef } from 'react';
import { DefaultButton, PrimaryButton, Spinner, Stack } from '@fluentui/react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import MonacoEditor, { ChangeHandler, EditorWillMount } from 'react-monaco-editor';
import { IRange, languages } from 'monaco-editor';
import TablePreview from '../tablePreview';
import type { TableData } from '../main';
import type { INestedListItem } from '../components/nested-list-item';

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
    'SELECT', 'AS', 'DISTINCT', 'FROM', 'WHERE', 'AND', 'OR', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'JOIN', 'ON', 'LIMIT',
];

const validGroupLabels: readonly (string | undefined)[] = ['database', 'schema', 'table'];

const flatAll = (items: INestedListItem[], path: string[] = []): { label: string; kind: languages.CompletionItemKind }[] => {
    const result: { label: string; kind: languages.CompletionItemKind }[] = [];
    for (const item of items) {
        if (!validGroupLabels.includes(item.group)) {
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
    query: string;
    setQuery: (q: string) => void;
    preview: TableData | null;
    doPreview: (q: string) => void;
    items: INestedListItem[];
}

const emptyPreview = { meta: [], columns: [], rows: [] };

const SQLEditor: FC<SQLEditorProps> = ({ query, setQuery, preview, doPreview, busy, items, children }) => {
    const updateCode: ChangeHandler = newValue => {
        setQuery(newValue);
    };

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

    const queryRef = useRef(query);
    queryRef.current = query;

    const RunButton = children ? DefaultButton : PrimaryButton;

    return (
        <Container>
            <div>
                <TablePreview name="preview" data={preview ?? emptyPreview} />
            </div>
            <Editor>
                <Stack horizontal style={{ marginBlock: '0.5em', paddingInline: '1em' }} horizontalAlign="end" tokens={{ childrenGap: 10 }}>
                    {children}
                    <RunButton
                        disabled={busy}
                        onClick={() => {
                            doPreview(query);
                        }}
                        iconProps={busy ? undefined : { iconName: "Play" }}
                    >
                        {busy ? <Spinner /> : intl.get('common.run')}
                    </RunButton>
                </Stack>
                <MonacoEditor language="sql" theme="vs" value={query} onChange={updateCode} editorWillMount={editorWillMount} />
            </Editor>
        </Container>
    );
};

export default SQLEditor;
