import { observer } from "mobx-react-lite";
import { createElement, forwardRef, ForwardRefExoticComponent, PropsWithoutRef, RefAttributes } from "react";
import { StyledComponentProps } from "styled-components";


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
> & T extends 'p' ? {
    /** @default "p" */
    as?: T;
} : {
    /** @default "p" */
    as: T;
};

const VisText = forwardRef<RefType[AllowedDOMType], IVisTextProps<AllowedDOMType>>(function VisText (
    { as = 'p', children, ...props }, ref
) {
    return createElement(as, { ...props, ref }, (
        <>
            {children}
        </>
    ));
});


type VisTextOverloads = {
    [T in keyof RefType]: ForwardRefExoticComponent<PropsWithoutRef<IVisTextProps<T>> & RefAttributes<RefType[T]>>;
};

type VisTextType = VisTextOverloads[keyof VisTextOverloads];

export default observer(VisText) as VisTextType;
