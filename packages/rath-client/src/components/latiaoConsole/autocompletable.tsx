import { observer } from 'mobx-react-lite';
import { useEffect, useMemo } from 'react';
import intl from 'react-intl-universal';
import styled from 'styled-components';
import { getOperatorList } from '../../latiao/program/operator';
import { useGlobalStore } from '../../store';
import type { InputMaybe } from './modal';


const Container = styled.div`
    overflow: hidden scroll;
    padding: 0.2em 0 1em;
    height: 6em;
    border: 1px solid #8888;
    border-top: none;
    display: flex;
    flex-direction: column;

    > * {
        width: 100%;
        flex-grow: 0;
        flex-shrink: 0;
        cursor: pointer;
        user-select: none;
        font-size: 0.9rem;
        line-height: 1.2em;
        padding: 0.2em 1em;
        display: flex;
        flex-direction: row;
        &.highlight {
            background-color: rgba(0, 120, 212, 0.12);
        }
        :hover {
            background-color: rgba(0, 120, 212, 0.3);
        }

        > span {
            flex-grow: 0;
            flex-shrink: 0;
            color: rgb(0, 120, 212);
            font-size: 0.6rem;
            width: 6em;
            padding: 0 0.4em;
            text-align: center;
        }
        > div {
            flex-grow: 1;
            flex-shrink: 1;
        }
    }
    pre {
        margin: 0;
    }
`;

export interface LaTiaoACProps {
    editingText: string;
    setOptions: (list: InputMaybe[]) => void;
    maybeIdx: number;
    setMaybeIdx: (idx: number) => void;
    submit: (content: string) => void;
}

const LaTiaoAC = observer<LaTiaoACProps>(({ editingText, setOptions, maybeIdx, setMaybeIdx, submit }) => {
    const { dataSourceStore } = useGlobalStore();
    const { fields: mutFields } = dataSourceStore;

    const inputMaybe = useMemo<InputMaybe[]>(() => {
        if (editingText.length === 0) {
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

            return maybe.find(op => op.content === editingText) ? [] : maybe;
        }

        const pattern = new RegExp(`^${editingText.split('').map(c => `.*${c}`).join('')}.*$`, 'i');

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

        if (editingText.startsWith('$')) {
            // 优先推算子
            const ops = getOperatorList().filter(op => op.name.slice(1).match(new RegExp(`^${editingText.slice(1).split('').map(c => `.*${c}`).join('')}.*$`, 'i')));

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

        return maybe.find(m => m.content === editingText) ? [] : maybe;
    }, [editingText, mutFields]);

    useEffect(() => {
        setOptions(inputMaybe);
    }, [inputMaybe, setOptions]);

    useEffect(() => {
        setMaybeIdx(0);
    }, [inputMaybe, setMaybeIdx]);

    return (
        <Container>
            {inputMaybe.map((maybe, i) => (
                <div
                    key={i}
                    className={i === maybeIdx ? 'highlight' : undefined}
                    onClick={
                        () => {
                            submit(maybe.content);
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
        </Container>
    );
});


export default LaTiaoAC;
