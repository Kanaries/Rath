import { Icon } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import { createElement, forwardRef, ForwardRefExoticComponent, Fragment, PropsWithoutRef, RefAttributes, useMemo } from "react";
import styled, { StyledComponentProps } from "styled-components";
import type { IFieldMeta } from "../../../../interfaces";


type AllowedDOMType = 'div' | 'p' | 'pre' | 'span' | 'output';

type RefType = {
    div: HTMLDivElement;
    p: HTMLParagraphElement;
    pre: HTMLPreElement;
    span: HTMLSpanElement;
    output: HTMLOutputElement;
};

export type IVisTextProps<T extends AllowedDOMType = 'p'> = Omit<
    StyledComponentProps<T, {}, {}, never>, 'ref'
> & (T extends 'p' ? {
    /** @default "p" */
    as?: T;
} : {
    /** @default "p" */
    as: T;
}) & {
    context?: {
        fields: readonly IFieldMeta[];
        onClickField?: (fid: string) => void;
    };
    children?: string | null | boolean | undefined;
};

const FieldToken = styled.span`
    color: #0027b4;
    margin: 0 0.12em;
    padding: 0.15em 0.5em 0.15em 0.2em;
    border-radius: 4px;
    &:not(.noEvents) {
        cursor: pointer;
        background-color: #a9d3f210;
        :hover {
            background-color: #a9d3f230;
        }
    }
`;

const ScoreToken = styled.span`
    color: #eaa300;
    font-weight: 500;
    margin: 0 0.12em;
`;

const Renderer: { [type: string]: (context: IVisTextProps['context'], text: string, attrs: string[]) => JSX.Element } = {
    field: (context, text, attrs) => {
        const f = context?.fields.find(f => f.fid === text);
        const name = f?.name ?? text;
        const clickable = !attrs.includes('noEvents') && f;
        const handleClick = clickable ? () => {
            context?.onClickField?.(f.fid);
        } : undefined;

        return (
            <FieldToken className={attrs.join(' ')} onClick={handleClick}>
                <Icon iconName="Tag" style={{ transform: 'scale(0.8)', userSelect: 'none' }} />
                {name}
            </FieldToken>
        );
    },
    score: (context, text, attrs) => {
        return (
            <ScoreToken className={attrs.join(' ')}>
                {text}
            </ScoreToken>
        );
    },
};

const VisText = forwardRef<RefType[AllowedDOMType], IVisTextProps<AllowedDOMType>>(function VisText (
    { as = 'p', children, context, ...props }, ref
) {
    const content = useMemo(() => {
        if (typeof children !== 'string') {
            return null;
        }
        const list: unknown[] = [];
        let temp = children;
        while (temp.length) {
            const nextPattern = /(?<type>((field)|(score)))(?<attrs>(\.[a-zA-Z]+)*)\((?<value>[^)]*)\)/.exec(temp);
            if (nextPattern) {
                if (nextPattern.index !== 0) {
                    list.push(temp.slice(0, nextPattern.index));
                }
                temp = temp.slice(nextPattern.index + nextPattern[0].length);
                const { type, attrs, value } = nextPattern.groups!;
                const attributes = attrs.split('.');
                list.push(Renderer[type]?.(context, value, attributes) ?? value);
            } else {
                list.push(temp);
                break;
            }
        }
        return (
            <>
                {list.map((item, i) => <Fragment key={i}>{item}</Fragment>)}
            </>
        );
    }, [children, context]);

    return createElement(as, { ...props, ref }, (
        <>
            {content}
        </>
    ));
});


type VisTextOverloads = {
    [T in keyof RefType]: PropsWithoutRef<IVisTextProps<T>> & RefAttributes<RefType[T]>;
};

type VisTextType = ForwardRefExoticComponent<VisTextOverloads[keyof VisTextOverloads]>;

export default observer(VisText as VisTextType);
