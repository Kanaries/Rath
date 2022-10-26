import { memo, useEffect, useRef, useState } from 'react';
import { QueryEditorProps } from '.';
import { EditorView, basicSetup } from 'codemirror';
import { sql } from '@codemirror/lang-sql';
import { DefaultButton } from '@fluentui/react';

const SQLEditor = memo<QueryEditorProps>(function QueryEditor({ query, tables, setQuery }) {
    const container = useRef<HTMLDivElement>(null);
    const [view, setView] = useState<any>(null);
    useEffect(() => {
        if (container.current) {
            const editorView = new EditorView({
                extensions: [basicSetup, sql()],
                parent: container.current,
            });
            setView(editorView);
        }
    }, []);
    return (
        <div style={{ width: '100%', height: 300, marginTop: 10 }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <DefaultButton
                    onClick={() => {
                        if (view !== null) {
                            console.log("2")
                            setQuery(view.state.doc.text);
                        }
                    }}
                >
                    Run
                </DefaultButton>
            </div>
            <div style={{ display: 'flex' }}>
                <div style={{ flex: 1 }}>
                    <div
                        style={{ width: '100%', height: '200px', overflow: 'auto' }}
                        ref={container}
                        className="sqlEditor"
                    ></div>
                </div>
            </div>
        </div>
    );
});

export default SQLEditor;
