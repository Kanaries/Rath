import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef } from "react";
import MonacoEditor, { EditorWillMount } from "react-monaco-editor";
import styled from "styled-components";
import { PreferencesSchema } from "./types";
import { toJSONSchema, toJSONValues } from "./utils";


const Container = styled.div`
    height: 80vh;
    overflow: auto;
`;

const JSONEditor = observer<{ schema: PreferencesSchema }>(function JSONEditor ({ schema }) {
    const JSONSchema = useMemo(() => toJSONSchema('Preferences', schema), [schema]);
    const editorRef = useRef<Parameters<EditorWillMount>[0]>();
    const contentRef = useRef(toJSONValues(schema));

    useEffect(() => {
        editorRef.current?.languages.json.jsonDefaults.setDiagnosticsOptions({
            validate: true,
            schemas: [{
                uri: '#', // "http://myserver/foo-schema.json",
                fileMatch: ['*'],
                schema: JSONSchema,
            }],
            schemaValidation: 'error',
            allowComments: true,
        });
    }, [JSONSchema]);

    return (
        <Container onKeyDown={e => e.stopPropagation()}>
            <MonacoEditor
                language="json"
                theme="vs"
                editorWillMount={monaco => {
                    editorRef.current = monaco;
                }}
                editorWillUnmount={() => {
                    editorRef.current = undefined;
                }}
                value={contentRef.current}
                onChange={content => {
                    contentRef.current = content;
                }}
            />
        </Container>
    );
});


export default JSONEditor;
