import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useRef, useState } from 'react';
import intl from 'react-intl-universal';
import styled from 'styled-components';
import type { IRow, IFieldMeta } from '../../interfaces';
import type { Static } from '../../latiao/program/types';
import LaTiaoEditor from './editor';
import LaTiaoAC from './autocompletable';
import LaTiaoPreview from './preview';


const Mask = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #8884;
    z-index: 10000;
`;

const Container = styled.div`
    min-height: 10vh;
    background-color: #fff;
    box-shadow: 0 0 16px #8884;
    overflow: hidden;
    display: flex;
    flex-direction: row;
    > div {
        padding: 1em;
        display: flex;
        flex-direction: column;
        width: 30vw;
        > * {
            width: 100%;
            flex-grow: 0;
            flex-shrink: 0;
            overflow: hidden;
        }
        > header {
            margin-bottom: 0.6em;
        }
        > pre {
            white-space: pre-line;
            overflow: hidden auto;
            border: 1px solid #c81;
            padding: 0.6em 1em 1.4em;
            
            &.err-msg {
                margin: 1em 0;
                height: 8em;
                font-size: 0.8rem;
                line-height: 1.5em;
                color: #c22;
            }
        }
    }
`;

export type InputMaybe = {
    type: 'keyword' | 'operator' | 'fid';
    content: string;
    description?: string;
};

export interface LaTiaoModalProps {
    close: () => void;
}

const LaTiaoModal = observer<LaTiaoModalProps>(({ close }) => {
    const [code, setCode] = useState('');
    const [editing, setEditing] = useState<{ pos: [number, number], text: string }>({
        pos: [0, 0],
        text: '',
    });
    const [errMsg, setErrMsg] = useState<[string, [number, number]]>(['', [-1, -1]]);

    useEffect(() => {
        const textarea = editorRef.current?.querySelector('textarea');
        const nowFocusing = document.querySelector(':focus');

        if (textarea && textarea !== nowFocusing) {
            textarea.focus();
        }
    }, [code]);

    const [inputMaybe, setInputMaybe] = useState<InputMaybe[]>([]);

    const resultRef = useRef<Static<IRow[]>>();
    const [preview, setPreview] = useState<Static<IFieldMeta[]>>([]);

    useEffect(() => {
        const textarea = editorRef.current?.querySelector('textarea');

        if (code && textarea && textarea.selectionStart === textarea.selectionEnd) {
            const beforeCursor = /[$\w]+$/.exec(code.slice(0, textarea.selectionStart))?.[0] ?? '';
            const afterCursor = /^[$\w]+/.exec(code.slice(textarea.selectionStart))?.[0] ?? '';
            
            setEditing({
                pos: [
                    textarea.selectionStart - beforeCursor.length,
                    textarea.selectionStart + afterCursor.length,
                ],
                text: `${beforeCursor}${afterCursor}`,
            });
        }
    }, [code]);

    const [position, setPosition] = useState<{
        x: number; y: number; w: number; h: number; H: number; offset: number
    }>({ x: 0, y: 0, w: 0, h: 0, H: 0, offset: 0 });

    const editorRef = useRef<HTMLDivElement>(null);
    const cursorPosRef = useRef<number>();

    useEffect(() => {
        if (cursorPosRef.current) {
            const textarea = editorRef.current?.querySelector('textarea');

            if (textarea) {
                textarea.setSelectionRange(cursorPosRef.current, null);
                // textarea.selectionStart = cursorPosRef.current;
                // textarea.selectionEnd = cursorPosRef.current;
            }

            cursorPosRef.current = undefined;
        }
    }, []);

    useEffect(() => {
        const textarea = editorRef.current?.querySelector('textarea');
        
        setPreview([]);

        if (textarea) {
            const observer = new ResizeObserver(() => {
                const rect = textarea.getBoundingClientRect();

                setPosition(p => ({
                    ...p,
                    x: rect.x,
                    y: rect.y,
                    w: rect.width,
                    h: rect.height,
                    H: textarea.scrollHeight,
                }));
            });

            observer.observe(textarea);

            const handleScroll = () => {
                setPosition(p => ({
                    ...p,
                    offset: textarea.scrollTop,
                    H: textarea.scrollHeight,
                }));
            };

            textarea.addEventListener('scroll', handleScroll);

            return () => {
                observer.disconnect();
                textarea.removeEventListener('scroll', handleScroll);
            };
        }
    }, []);

    const submitMaybe = useCallback((data: string) => {
        const textarea = editorRef.current?.querySelector('textarea');

        if (textarea) {
            cursorPosRef.current = textarea.selectionEnd;

            setCode(
                `${
                    code.slice(0, editing.pos[0])
                }${data}${
                    code.slice(editing.pos[1])
                }`
            );
        }
    }, [code, editing]);

    const [maybeIdx, setMaybeIdx] = useState(0);

    const autocomplete = useCallback(() => {
        const target = inputMaybe[maybeIdx];

        if (target) {
            submitMaybe(target.content);
            setMaybeIdx(0);
        }
    }, [inputMaybe, maybeIdx, submitMaybe]);

    const moveHintCursorPrev = useCallback(() => {
        setMaybeIdx(maybeIdx => (maybeIdx + inputMaybe.length - 1) % inputMaybe.length);
    }, [inputMaybe]);

    const moveHintCursorNext = useCallback(() => {
        setMaybeIdx(maybeIdx => (maybeIdx + 1) % inputMaybe.length);
    }, [inputMaybe]);

    const clearInput = useCallback(() => {
        setCode('');
        setErrMsg(['', [-1, -1]]);
        resultRef.current = undefined;
    }, []);

    const updatePreview = useCallback((fields: Static<IFieldMeta[]>, data: Static<IRow[]> | undefined) => {
        setPreview(fields);
        resultRef.current = data;
    }, []);

    return (
        <Mask onClick={() => close()}>
            <Container onClick={e => e.stopPropagation()}>
                <div>
                    <header>
                        {intl.get('dataSource.extend.manual')}
                    </header>
                    <LaTiaoEditor
                        ref={editorRef}
                        code={code}
                        setCode={setCode}
                        position={position}
                        autocomplete={autocomplete}
                        moveHintCursorPrev={moveHintCursorPrev}
                        moveHintCursorNext={moveHintCursorNext}
                        setPreview={updatePreview}
                        setErrMsg={setErrMsg}
                    />
                    <LaTiaoAC
                        editingText={editing.text}
                        setOptions={setInputMaybe}
                        maybeIdx={maybeIdx}
                        setMaybeIdx={setMaybeIdx}
                        submit={submitMaybe}
                    />
                    <pre className="err-msg">
                        {errMsg[0]}
                    </pre>
                </div>
                <LaTiaoPreview
                    preview={preview}
                    result={resultRef.current}
                    close={close}
                    clearInput={clearInput}
                />
            </Container>
        </Mask>
    );
});


export default LaTiaoModal;
