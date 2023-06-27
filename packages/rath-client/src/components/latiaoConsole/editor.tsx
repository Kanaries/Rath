import { TextField } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import intl from 'react-intl-universal';
import { debounceTime, Subject } from 'rxjs';
import styled from 'styled-components';
import { IRow, IFieldMeta } from '../../interfaces';
import { rich } from '../../latiao/ide-helper';
import createProgram, { resolveFields } from '../../latiao/program';
import { Static } from '../../latiao/program/types';
import { computeFieldMetaService } from '../../services';
import { useGlobalStore } from '../../store';


const Container = styled.div`
    display: flex;
    flex-direction: column;
    overflow: hidden auto;
    --font-family: "Segoe UI", "Segoe UI Web (West European)", "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif;
    --font-size: 0.95rem;
    --letter-spacing: 0.4px;
    --font-weight: 600;
    --line-height: 1.5em;
    --padding: 0.8em 1em 1.5em;

    > * {
        width: 100%;
        flex-grow: 0;
        flex-shrink: 0;
        overflow: hidden;
    }
    & label {
        font-size: 13px;
        margin-bottom: 0.4em;
    }
    & textarea {
        color: transparent;
        caret-color: #444;
        font-family: var(--font-family);
        font-size: var(--font-size);
        font-weight: var(--font-weight);
        letter-spacing: var(--letter-spacing);
        line-height: var(--line-height);
        padding: var(--padding);
        white-space: pre-line;
        line-break: anywhere;
    }
    > .content {
        position: fixed;
        pointer-events: none;
        overflow: hidden;
        
        > pre {
            color: #444;
            width: 100%;
            height: 100%;
            font-family: var(--font-family);
            font-size: var(--font-size);
            font-weight: var(--font-weight);
            letter-spacing: var(--letter-spacing);
            line-height: var(--line-height);
            padding: var(--padding);
            background-color: transparent;
            overflow: hidden;
            resize: none;
            white-space: break-spaces;
            line-break: anywhere;
        }
    }
`;

export interface LaTiaoEditorProps {
    code: string;
    setCode: (code: string) => void;
    position: {
        x: number; y: number; w: number; h: number; H: number; offset: number
    };
    autocomplete: () => void;
    moveHintCursorPrev: () => void;
    moveHintCursorNext: () => void;
    setPreview: (fields: Static<IFieldMeta[]>, data: Static<IRow[]> | undefined) => void;
    setErrMsg: (msg: [string, [number, number]]) => void;
}

const LaTiaoEditor = observer(forwardRef<HTMLDivElement, LaTiaoEditorProps>(({
    code, setCode, position, autocomplete, moveHintCursorPrev, moveHintCursorNext, setPreview, setErrMsg,
}, ref) => {
    const { dataSourceStore } = useGlobalStore();
    const { rawDataMetaInfo, extData, fields: mutFields } = dataSourceStore;
    const [rawData, setRawData] = useState<IRow[]>([]);

    useEffect(() => {
        if (rawDataMetaInfo.versionCode > -1) {
            dataSourceStore.rawDataStorage.getAll().then(setRawData);
        }
    }, [rawDataMetaInfo.versionCode, dataSourceStore.rawDataStorage]);

    const mergedData = useMemo(() => {
        return rawData.map((row, i) => Object.fromEntries(
            mutFields.map<[string, string | number]>(({ fid }) => {
                const col = extData.get(fid);
                return [fid, col ? col.data[i] : row[fid]];
            })
        ));
    }, [rawData, extData, mutFields]);

    const auto$ = useMemo(() => new Subject<string>(), []);
    const serviceRef = useRef<ReturnType<typeof computeFieldMetaService>>();

    const program = useMemo(() => {
        const fields = mutFields.map<Parameters<typeof createProgram>[1][0]>(f => {
            return {
                fid: `_${f.fid}`,
                name: f.name ?? f.fid,
                mode: typeof mergedData[0]?.[f.fid] === 'string' ? 'text' : ({
                    nominal: 'text',
                    ordinal: 'set',
                    quantitative: 'vec',
                    temporal: 'vec',
                } as const)[f.semanticType],
                out: f.name ?? f.fid,
            };
        });

        const p = createProgram(
            mergedData.map(row => Object.fromEntries(Object.entries(row).map(([k, v]) => [`_${k}`, v]))),
            fields,
            (fieldArr, data) => {
                const fields = fieldArr.map(f => ({
                    ...f,
                    fid: f.fid.slice(1),
                }));
                setErrMsg(['', [-1, -1]]);

                const rows: IRow[] = data[0].map(d => ({
                    [fields[0].fid]: d,
                }));

                data.slice(1).forEach((col, i) => {
                    const fid = fields[i + 1].fid;

                    col.forEach((d, k) => {
                        rows[k][fid] = d;
                    });
                });

                const f = resolveFields(fields);

                setPreview([], rows);

                const s = computeFieldMetaService({
                    dataSource: rows,
                    fields: f,
                });

                serviceRef.current = s;

                s.then(meta => {
                    if (serviceRef.current === s) {
                        setPreview(
                            meta.map((f, i) => ({
                                ...f,
                                extInfo: fields[i].extInfo,
                            })),
                            rows
                        );
                    }                    
                });
            },
        );

        p.onError(err => {
            setPreview([], undefined);
            setErrMsg([err.message, err.loc ? err.loc[0] : [-1, -1]]);
        });

        return p;
    }, [mergedData, mutFields, setErrMsg, setPreview]);

    useEffect(() => {
        auto$.next(code);
    }, [code, auto$]);

    useEffect(() => {
        setPreview([], undefined);

        const subscription = auto$.pipe(
            debounceTime(300)
        ).subscribe(source => {
            program.run(source);
        });

        return () => subscription.unsubscribe();
    }, [auto$, program, setPreview]);

    return (
        <Container ref={ref}>
            <TextField
                label={intl.get('dataSource.extend.editor')}
                value={code}
                onChange={(_, data) => setCode(data ?? '')}
                multiline
                autoAdjustHeight
                resizable={false}
                style={{
                    minHeight: '15vmin',
                    maxHeight: '30vh',
                }}
                styles={{
                    fieldGroup: {
                        border: '1px solid #8888',
                    },
                }}
                onKeyDown={e => {
                    if (e.key === 'Tab') {
                        autocomplete();
                        e.preventDefault();
                    } else if (e.key === 'ArrowDown') {
                        moveHintCursorNext();
                    } else if (e.key === 'ArrowUp') {
                        moveHintCursorPrev();
                    }
                }}
            />
            <div
                className="content"
                style={{
                    top: position.y,
                    left: position.x,
                    width: position.w,
                    height: position.h,
                }}
            >
                <pre
                    style={{
                        height: position.H,
                        transform: `translateY(${-1 * position.offset}px)`,
                    }}
                >
                    {rich(code, mutFields.map(f => ({
                        ...f,
                        fid: `_${f.fid}`,
                    })))}
                </pre>
            </div>
        </Container>
    );
}));


export default LaTiaoEditor;
