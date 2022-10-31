import { CommandButton, DefaultButton, PrimaryButton, TextField } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import intl from 'react-intl-universal';
import { debounceTime, Subject } from 'rxjs';
import styled from 'styled-components';
import { IRow, IFieldMeta } from '../../interfaces';
import { rich } from '../../latiao/ide-helper';
import createProgram, { resolveFields } from '../../latiao/program';
import { getOperatorList } from '../../latiao/program/operator';
import { computeFieldMetaService } from '../../services';
import { useGlobalStore } from '../../store';
import DistributionChart from './metaView/distChart';


const Mask = styled.div({
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8884',
    zIndex: 10000,
});

const Container = styled.div({
    minHeight: '10vh',
    backgroundColor: '#fff',
    boxShadow: '0 0 16px #8884',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'row',

    '> div': {
        padding: '1em',
        display: 'flex',
        flexDirection: 'column',
        width: '30vw',
    
        '> *': {
            width: '100%',
            flexGrow: 0,
            flexShrink: 0,
            overflow: 'hidden',
        },
        '> header': {
            marginBottom: '0.6em',
        },
        '> div.editor': {
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden auto',
            '--font-family': '"Segoe UI", "Segoe UI Web (West European)", "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
            '--font-size': '0.95rem',
            '--letter-spacing': '0.4px',
            '--font-weight': '600',
            '--line-height': '1.5em',
            '--padding': '0.8em 1em 1.5em',
    
            '> *': {
                width: '100%',
                flexGrow: 0,
                flexShrink: 0,
                overflow: 'hidden',
            },
            '& label': {
                fontSize: '13px',
                marginBottom: '0.4em',
            },
            '& textarea': {
                color: 'transparent',
                caretColor: '#444',
                fontFamily: 'var(--font-family)',
                fontSize: 'var(--font-size)',
                fontWeight: 'var(--font-weight)',
                letterSpacing: 'var(--letter-spacing)',
                lineHeight: 'var(--line-height)',
                padding: 'var(--padding)',
                whiteSpace: 'pre-line',
                lineBreak: 'anywhere',
            },
            '> .content': {
                position: 'fixed',
                pointerEvents: 'none',
                overflow: 'hidden',
                
                '> pre': {
                    color: '#444',
                    width: '100%',
                    height: '100%',
                    fontFamily: 'var(--font-family)',
                    fontSize: 'var(--font-size)',
                    fontWeight: 'var(--font-weight)',
                    letterSpacing: 'var(--letter-spacing)',
                    lineHeight: 'var(--line-height)',
                    padding: 'var(--padding)',
                    backgroundColor: 'transparent',
                    overflow: 'hidden',
                    resize: 'none',
                    whiteSpace: 'break-spaces',
                    lineBreak: 'anywhere',
                },
            },
        },
        '> pre': {
            whiteSpace: 'pre-line',
            overflow: 'hidden auto',
            border: '1px solid #c81',
            padding: '0.6em 1em 1.4em',
            
            '&.err-msg': {
                margin: '1em 0',
                height: '8em',
                fontSize: '0.8rem',
                lineHeight: '1.5em',
                color: '#c22',
            },
        },
        '> .maybe': {
            overflow: 'hidden scroll',
            padding: '0.2em 0 1em',
            height: '6em',
            border: '1px solid #8888',
            borderTop: 'none',
            display: 'flex',
            flexDirection: 'column',
    
            '> *': {
                width: '100%',
                flexGrow: 0,
                flexShrink: 0,
                cursor: 'pointer',
                userSelect: 'none',
                fontSize: '0.9rem',
                lineHeight: '1.2em',
                padding: '0.2em 1em',
                display: 'flex',
                flexDirection: 'row',
                '&.highlight': {
                    backgroundColor: 'rgba(0, 120, 212, 0.12)',
                },
                ':hover': {
                    backgroundColor: 'rgba(0, 120, 212, 0.3)',
                },
    
                '> span': {
                    flexGrow: 0,
                    flexShrink: 0,
                    color: 'rgb(0, 120, 212)',
                    fontSize: '0.6rem',
                    width: '6em',
                    padding: '0 0.4em',
                    textAlign: 'center',
                },
                '> div': {
                    flexGrow: 1,
                    flexShrink: 1,
                },
            },
        },

        '> .preview': {
            flexGrow: 1,
            flexShrink: 1,
            border: '1px solid #8882',
            margin: '1em 0',
            height: '400px',
            overflow: 'hidden scroll',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',

            '> div': {
                margin: '1em 0',
                padding: '1em 2em',
                border: '1px solid',

                '> header': {
                    fontSize: '0.9rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                },
            },

            '& + div': {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                '> *': {
                    marginInline: '1em',
                },
            },
        },
    },
});

export type InputMaybe = {
    type: 'keyword' | 'operator' | 'fid';
    content: string;
    description?: string;
};

const LaTiaoConsole = observer(() => {
    const { dataSourceStore } = useGlobalStore();
    const { rawData, extData, fields: mutFields } = dataSourceStore;

    const mergedData = useMemo(() => {
        return rawData.map((row, i) => Object.fromEntries(
            mutFields.map<[string, string | number]>(({ fid }) => {
                const col = extData.get(fid);
                return [fid, col ? col.data[i] : row[fid]];
            })
        ));
    }, [rawData, extData, mutFields]);

    const [open, setOpen] = useState(false);
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

    const inputMaybe = useMemo<InputMaybe[]>(() => {
        if (!open) {
            return [];
        }

        if (editing.text.length === 0) {
            // 只推算子
            const ops = getOperatorList();

            const maybe = ops.reduce<typeof ops>(
                (list, op) => {
                    if (list.find(o => o.name === op.name)) {
                        return list;
                    }

                    return [...list, op];
                }, []
            ).map(op => ({
                type: 'operator' as const,
                content: op.name,
                description: intl.get(`latiao.op.${op.name}`) || '',
            })).sort(); // 字典序

            return maybe.find(op => op.content === editing.text) ? [] : maybe;
        }

        const pattern = new RegExp(`^${editing.text.split('').map(c => `.*${c}`).join('')}.*$`, 'i');

        const maybe: InputMaybe[] = [];

        if ('out'.match(pattern)) {
            maybe.push({
                type: 'keyword',
                content: 'out',
                description: intl.get('latiao.keyword.out') || '',
            });
        }

        const fields = mutFields.filter(f => (
            f.fid.match(pattern) || f.name?.match(pattern)
        ));

        maybe.push(...fields.map(f => ({
            type: 'fid' as const,
            content: `_${f.fid}`,
            description: f.name ?? f.fid,
        })));

        // 文本越长说明匹配比例越低
        maybe.sort((a, b) => a.content.length - b.content.length);

        if (editing.text.startsWith('$')) {
            // 优先推算子
            const ops = getOperatorList().filter(op => op.name.slice(1).match(new RegExp(`^${editing.text.slice(1).split('').map(c => `.*${c}`).join('')}.*$`, 'i')));

            maybe.splice(
                0,
                0,
                ...ops.reduce<typeof ops>(
                    (list, op) => {
                        if (list.find(o => o.name === op.name)) {
                            return list;
                        }

                        return [...list, op];
                    }, []
                ).map(op => ({
                    type: 'operator' as const,
                    content: op.name,
                    description: intl.get(`latiao.op.${op.name}`) || '',
                })).sort((a, b) => a.content.length - b.content.length)
            );
        }

        return maybe.find(m => m.content === editing.text) ? [] : maybe;
    }, [editing, open, mutFields]);

    const auto$ = useMemo(() => new Subject<string>(), []);
    const serviceRef = useRef<ReturnType<typeof computeFieldMetaService>>();
    const resultRef = useRef<IRow[]>();
    const [preview, setPreview] = useState<IFieldMeta[]>([]);

    const program = useMemo(() => {
        const fields = mutFields.map<Parameters<typeof createProgram>[1][0]>(f => {
            return {
                fid: `_${f.fid}`,
                name: f.name ?? f.fid,
                mode: typeof mergedData[0]?.[f.fid] === 'string' ? 'collection' : ({
                    nominal: 'collection',
                    ordinal: 'set',
                    quantitative: 'group',
                    temporal: 'group',
                } as const)[f.semanticType],
                out: f.name ?? f.fid,
            };
        });

        const p = createProgram(
            mergedData.map(row => Object.fromEntries(Object.entries(row).map(([k, v]) => [`_${k}`, v]))),
            fields,
            (fs, data) => {
                const fields = fs.map(f => ({
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

                resultRef.current = rows;

                const f = resolveFields(fields);

                setPreview([]);

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
                            }))
                        );
                    }                    
                });

                // console.log('扩展数据', {fields, f, data, rows});
            },
        );

        p.onError(err => {
            setPreview([]);
            resultRef.current = undefined;
            setErrMsg([err.message, err.loc ? err.loc[0] : [-1, -1]]);
        });

        return p;
    }, [mergedData, mutFields]);

    useEffect(() => {
        if (open) {
            auto$.next(code);

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
        } else {
            setEditing({
                pos: [0, 0],
                text: '',
            });
        }
    }, [open, code, auto$]);

    useEffect(() => {
        setPreview([]);
        resultRef.current = undefined;

        const subscription = auto$.pipe(
            debounceTime(300)
        ).subscribe(source => {
            program.run(source);
        });

        return () => subscription.unsubscribe();
    }, [auto$, program]);

    const [position, setPosition] = useState<{
        x: number; y: number; w: number; h: number; H: number; offset: number
    }>({ x: 0, y: 0, w: 0, h: 0, H: 0, offset: 0 });

    const editorRef = useRef<HTMLDivElement>(null);
    const cursorPosRef = useRef<number>();

    useEffect(() => {
        if (cursorPosRef.current) {
            if (open) {
                const textarea = editorRef.current?.querySelector('textarea');
    
                if (textarea) {
                    textarea.setSelectionRange(cursorPosRef.current, null);
                    // textarea.selectionStart = cursorPosRef.current;
                    // textarea.selectionEnd = cursorPosRef.current;
                }
            }

            cursorPosRef.current = undefined;
        }
    }, [open]);

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
    }, [open]);

    const submitMaybe = (data: string) => {
        const textarea = editorRef.current?.querySelector('textarea');

        if (open && textarea) {
            cursorPosRef.current = textarea.selectionEnd;

            setCode(
                `${
                    code.slice(0, editing.pos[0])
                }${data}${
                    code.slice(editing.pos[1])
                }`
            );
        }
    };

    const [maybeIdx, setMaybeIdx] = useState(0);

    useEffect(() => {
        setMaybeIdx(0);
    }, [inputMaybe]);

    return (
        <Fragment>
            <CommandButton
                text={intl.get('dataSource.extend.manual')}
                disabled={rawData.length === 0}
                iconProps={{ iconName: 'AppIconDefaultAdd' }}
                onClick={() => rawData.length && setOpen(true)}
            />
            {open && (
                <Mask onClick={() => setOpen(false)}>
                    <Container onClick={e => e.stopPropagation()}>
                        <div>
                            <header>
                                {intl.get('dataSource.extend.manual')}
                            </header>
                            <div className="editor" ref={editorRef}>
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
                                            const target = inputMaybe[maybeIdx];

                                            if (target) {
                                                submitMaybe(target.content);
                                                setMaybeIdx(0);
                                            }

                                            e.preventDefault();
                                        } else if (e.key === 'ArrowDown') {
                                            setMaybeIdx((maybeIdx + 1) % inputMaybe.length);
                                        } else if (e.key === 'ArrowUp') {
                                            setMaybeIdx((maybeIdx + inputMaybe.length - 1) % inputMaybe.length);
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
                            </div>
                            <div className="maybe">
                                {inputMaybe.map((maybe, i) => (
                                    <div
                                        key={i}
                                        className={i === maybeIdx ? 'highlight' : undefined}
                                        onClick={
                                            () => {
                                                submitMaybe(maybe.content);
                                                setMaybeIdx(0);
                                            }
                                        }
                                        ref={e => {
                                            if (e && i === maybeIdx) {
                                                e.scrollIntoView({
                                                    behavior: 'smooth',
                                                    block: 'nearest',
                                                });
                                            }
                                        }}
                                    >
                                        <span>
                                            {intl.get(`latiao.maybe.${maybe.type}`)}
                                        </span>
                                        <div>
                                            <pre>
                                                {maybe.content}
                                            </pre>
                                            {maybe.description && (
                                                <small>
                                                    {maybe.description}
                                                </small>
                                            )}
                                        </div>
                                        {i === maybeIdx && (
                                            <span>
                                                {'[Tab]'}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <pre className="err-msg">
                                {errMsg[0]}
                            </pre>
                        </div>
                        <div>
                            <div className="preview">
                                {preview.length === 0 ? (
                                    <p>
                                        {intl.get('dataSource.extend.empty')}
                                    </p>
                                ) : (
                                    <>
                                        {preview.map(meta => (
                                            <div key={meta.fid}>
                                                <header>
                                                    {meta.name ? (
                                                        <>
                                                            {meta.name}
                                                            <small>
                                                                {`(${meta.fid})`}
                                                            </small>
                                                        </>
                                                    ) : meta.fid}
                                                </header>
                                                <DistributionChart
                                                    dataSource={meta.distribution}
                                                    x="memberName"
                                                    y="count"
                                                    height={70}
                                                    width={220}
                                                    maxItemInView={16}
                                                    analyticType={meta.analyticType}
                                                    semanticType={meta.semanticType}
                                                />
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                            <div>
                                <PrimaryButton
                                    disabled={preview.length === 0 || !resultRef.current}
                                    onClick={() => {
                                        if (preview.length === 0 || !resultRef.current) {
                                            return;
                                        }
                                        if (resultRef.current.length !== rawData.length) {
                                            console.error(
                                                'Lengths do not match:',
                                                resultRef.current[0].length,
                                                rawData.length,
                                            );

                                            return;
                                        }

                                        // dataSourceStore.mergeExtended(resultRef.current, preview);
                                        dataSourceStore.addExtFieldsFromRows(
                                            resultRef.current,
                                            preview.map(f => ({
                                                ...f,
                                                stage: 'settled',
                                            })),
                                        );
                                        setOpen(false);
                                        setCode('');
                                        resultRef.current = undefined;
                                    }}
                                >
                                    {intl.get('dataSource.extend.apply')}
                                </PrimaryButton>
                                <DefaultButton onClick={() => setOpen(false)}>
                                    {intl.get('dataSource.extend.cancel')}
                                </DefaultButton>
                            </div>
                        </div>
                    </Container>
                </Mask>
            )}
        </Fragment>
    );
});


export default LaTiaoConsole;
