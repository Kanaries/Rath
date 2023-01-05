import intl from 'react-intl-universal';
import { PrimaryButton } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import AJV from 'ajv';
import { useEffect, useRef, useState } from "react";
import MonacoEditor, { EditorWillMount } from "react-monaco-editor";
import styled from "styled-components";
import { PreferencesSchema } from "./types";
import { diffJSON, getItem, toJSONSchema, toJSONValues } from "./utils";


const Container = styled.div`
    height: 80vh;
    overflow: auto;
`;

const Tools = styled.div`
    margin: 1em 0;
`;

const JSONEditor = observer<{ schema: PreferencesSchema }>(function JSONEditor ({ schema }) {
    const JSONSchema = toJSONSchema('Preferences', schema);
    const editorRef = useRef<Parameters<EditorWillMount>[0]>();
    const [content, setContent] = useState(toJSONValues(schema));
    const [modified, setModified] = useState(false);

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

    const validate = new AJV().compile(JSONSchema);

    const data = (() => {
        try {
            const d = JSON.parse(content);
            const valid = validate(d);
            return valid ? d : null;
        } catch (error) {
            return null;
        }
    })();

    return (
        <Container onKeyDown={e => e.stopPropagation()}>
            <Tools>
                <PrimaryButton
                    text={intl.get('function.confirm')}
                    disabled={!modified || data === null}
                    onClick={() => {
                        if (!data) {
                            return;
                        }
                        const diff = diffJSON(JSON.parse(toJSONValues(schema)), data);
                        for (const [key, value] of Object.entries(diff)) {
                            const item = getItem(schema, key);
                            item?.onChange(value as never);
                        }
                        setModified(false);
                    }}
                />
            </Tools>
            <MonacoEditor
                language="json"
                theme="vs"
                editorWillMount={monaco => {
                    editorRef.current = monaco;
                }}
                editorWillUnmount={() => {
                    editorRef.current = undefined;
                }}
                value={content}
                onChange={content => {
                    setModified(true);
                    setContent(content);
                }}
            />
        </Container>
    );
});


export default JSONEditor;
