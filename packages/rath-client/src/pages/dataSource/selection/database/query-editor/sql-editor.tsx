import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { sql } from '@codemirror/lang-sql';
import { DefaultButton } from '@fluentui/react';
import styled from 'styled-components';
import type { QueryEditorProps } from '.';

const Container = styled.div`
    width: 100%;
    height: 300;
    margin-top: 10;
    > div {
        display: flex;
        &.group {
            width: 100%;
            justify-content: flex-end;
            align-items: center;
        }
        .sqlEditor {
            width: 100%;
            height: 200px;
            overflow: auto;
        }
    }
`;

const SQLEditor = ({ setQuery, preview }: QueryEditorProps) => {
    const container = useRef<HTMLDivElement>(null);
    const viewRef = useRef<any>(null);

    useEffect(() => {
        if (container.current) {
            const editorView = new EditorView({
                extensions: [basicSetup, sql()],
                parent: container.current,
            });
            viewRef.current = editorView;

            return () => editorView.destroy();
        }
    }, []);
    
    return (
        <Container>
            <div className="group">
                <DefaultButton
                    onClick={() => {
                        if (viewRef.current !== null) {
                            const queryString = (viewRef.current.state.doc.text as string[]).join(' ');
                            setQuery(queryString);
                            preview(queryString);
                        }
                    }}
                >
                    {'Preview'}
                </DefaultButton>
            </div>
            <div>
                <div style={{ flex: 1 }}>
                    <div
                        ref={container}
                        className="sqlEditor"
                    ></div>
                </div>
            </div>
        </Container>
    );
};

export default SQLEditor;
