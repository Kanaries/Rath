import { DefaultButton, PrimaryButton, TextField } from '@fluentui/react';
import React, { useMemo, useRef, useState } from 'react';
import intl from 'react-intl-universal';
import { ICol, IFieldMeta, IRow } from '../../../interfaces';
import { rich } from '../../../latiao/ide-helper';
import { getOperatorList } from '../../../latiao/program/operator';
import DistributionChart from '../metaView/distChart';
import { ConsoleContainer, ConsoleMask } from './components';
export type InputMaybe = {
    type: 'keyword' | 'operator' | 'fid';
    content: string;
    description?: string;
};
interface IProps {
    data: IRow[];
    extData: Map<string, ICol<any>>;
    fields: IFieldMeta[];
    onClose: () => void;
}
const ComputationConsole: React.FC<IProps> = (props) => {
    const { onClose, fields } = props;
    const [code, setCode] = useState('');
    const editorRef = useRef<HTMLDivElement>(null);
    const [editing, ] = useState<{ pos: [number, number]; text: string }>({
        pos: [0, 0],
        text: '',
    });
    const cursorPosRef = useRef<number>();
    const [position, ] = useState<{
        x: number;
        y: number;
        w: number;
        h: number;
        H: number;
        offset: number;
    }>({ x: 0, y: 0, w: 0, h: 0, H: 0, offset: 0 });
    const [maybeIdx, setMaybeIdx] = useState(0);
    const [preview, ] = useState<IFieldMeta[]>([]);
    const [errMsg, ] = useState<[string, [number, number]]>(['', [-1, -1]]);
    const resultRef = useRef<IRow[]>();
    const inputMaybe = useMemo<InputMaybe[]>(() => {
        if (editing.text.length === 0) {
            // 只推算子
            const ops = getOperatorList();

            const maybe = ops
                .reduce<typeof ops>((list, op) => {
                    if (list.find((o) => o.name === op.name)) {
                        return list;
                    }

                    return [...list, op];
                }, [])
                .map((op) => ({
                    type: 'operator' as const,
                    content: op.name,
                    description: intl.get(`latiao.op.${op.name}`) || '',
                }))
                .sort(); // 字典序

            return maybe.find((op) => op.content === editing.text) ? [] : maybe;
        }

        const pattern = new RegExp(
            `^${editing.text
                .split('')
                .map((c) => `.*${c}`)
                .join('')}.*$`,
            'i'
        );

        const maybe: InputMaybe[] = [];

        if ('out'.match(pattern)) {
            maybe.push({
                type: 'keyword',
                content: 'out',
                description: intl.get('latiao.keyword.out') || '',
            });
        }

        const matchedFields = fields.filter((f) => f.fid.match(pattern) || f.name?.match(pattern));

        maybe.push(
            ...matchedFields.map((f) => ({
                type: 'fid' as const,
                content: `_${f.fid}`,
                description: f.name ?? f.fid,
            }))
        );

        // 文本越长说明匹配比例越低
        maybe.sort((a, b) => a.content.length - b.content.length);

        if (editing.text.startsWith('$')) {
            // 优先推算子
            const ops = getOperatorList().filter((op) =>
                op.name.slice(1).match(
                    new RegExp(
                        `^${editing.text
                            .slice(1)
                            .split('')
                            .map((c) => `.*${c}`)
                            .join('')}.*$`,
                        'i'
                    )
                )
            );

            maybe.splice(
                0,
                0,
                ...ops
                    .reduce<typeof ops>((list, op) => {
                        if (list.find((o) => o.name === op.name)) {
                            return list;
                        }

                        return [...list, op];
                    }, [])
                    .map((op) => ({
                        type: 'operator' as const,
                        content: op.name,
                        description: intl.get(`latiao.op.${op.name}`) || '',
                    }))
                    .sort((a, b) => a.content.length - b.content.length)
            );
        }

        return maybe.find((m) => m.content === editing.text) ? [] : maybe;
    }, [editing, fields]);
    const submitMaybe = (data: string) => {
        const textarea = editorRef.current?.querySelector('textarea');

        if (textarea) {
            cursorPosRef.current = textarea.selectionEnd;

            setCode(`${code.slice(0, editing.pos[0])}${data}${code.slice(editing.pos[1])}`);
        }
    };
    return (
        <ConsoleMask onClick={onClose}>
            <ConsoleContainer onClick={(e) => e.stopPropagation()}>
                <div>
                    <header>{intl.get('dataSource.extend.manual')}</header>
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
                            onKeyDown={(e) => {
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
                                {rich(
                                    code,
                                    fields.map((f) => ({
                                        ...f,
                                        fid: `_${f.fid}`,
                                    }))
                                )}
                            </pre>
                        </div>
                    </div>
                    <div className="maybe">
                        {inputMaybe.map((maybe, i) => (
                            <div
                                key={i}
                                className={i === maybeIdx ? 'highlight' : undefined}
                                onClick={() => {
                                    submitMaybe(maybe.content);
                                    setMaybeIdx(0);
                                }}
                                ref={(e) => {
                                    if (e && i === maybeIdx) {
                                        e.scrollIntoView({
                                            behavior: 'smooth',
                                            block: 'nearest',
                                        });
                                    }
                                }}
                            >
                                <span>{intl.get(`latiao.maybe.${maybe.type}`)}</span>
                                <div>
                                    <pre>{maybe.content}</pre>
                                    {maybe.description && <small>{maybe.description}</small>}
                                </div>
                                {i === maybeIdx && <span>{'[Tab]'}</span>}
                            </div>
                        ))}
                    </div>
                    <pre className="err-msg">{errMsg[0]}</pre>
                </div>
                <div>
                    <div className="preview">
                        {preview.length === 0 ? (
                            <p>{intl.get('dataSource.extend.empty')}</p>
                        ) : (
                            <>
                                {preview.map((meta) => (
                                    <div key={meta.fid}>
                                        <header>
                                            {meta.name ? (
                                                <>
                                                    {meta.name}
                                                    <small>{`(${meta.fid})`}</small>
                                                </>
                                            ) : (
                                                meta.fid
                                            )}
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
                                // if (resultRef.current.length !== rawData.length) {
                                //     console.error('Lengths do not match:', resultRef.current[0].length, rawData.length);

                                //     return;
                                // }
                                // dataSourceStore.addExtFieldsFromRows(
                                //     resultRef.current,
                                //     preview.map(
                                //         (f) =>
                                //             ({
                                //                 ...f,
                                //                 extInfo: f.extInfo
                                //                     ? {
                                //                           extOpt: f.extInfo.extOpt,
                                //                           extInfo: f.extInfo.extInfo,
                                //                           extFrom: f.extInfo.extFrom.map((s) => s.slice(1)), // 里面为了防止 fid 作为保留字前面加了一个下划线所以这里记得去掉
                                //                       }
                                //                     : undefined,
                                //                 stage: 'settled',
                                //             } as IExtField)
                                //     )
                                // );
                                // onClose();
                                // setCode('');
                                // resultRef.current = undefined;
                            }}
                        >
                            {intl.get('dataSource.extend.apply')}
                        </PrimaryButton>
                        <DefaultButton onClick={onClose}>{intl.get('dataSource.extend.cancel')}</DefaultButton>
                    </div>
                </div>
            </ConsoleContainer>
        </ConsoleMask>
    );
};

export default ComputationConsole;
