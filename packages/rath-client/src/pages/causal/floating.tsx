import { forwardRef } from "react";
import styled, { StyledComponentProps } from "styled-components";


const AsideWidth = '2em';

const Container = styled.div<{ position: 'absolute' | 'fixed'; direction: 'start' | 'end' }>`
    position: ${({ position }) => position};
    ${({ direction }) => direction === 'start' ? 'left' : 'right'}: 0;
    top: 50%;
    background-color: #fff;
    box-shadow: 0 1.6px 3.6px 0 rgb(0 0 0 / 13%), 0 0.3px 0.9px 0 rgb(0 0 0 / 11%);
    transition: transform 400ms, margin 400ms;
    margin-left: ${AsideWidth};
    margin-right: ${AsideWidth};
    transform: translate(${({ direction }) => direction === 'start' ? '-100%' : '100%'}, -50%);
    :hover {
        transform: translate(0, -50%);
        margin-left: 0;
        margin-right: 0;
    }
    display: flex;
    flex-direction: row;
`;

const Aside = styled.div`
    user-select: none;
    flex-grow: 0;
    flex-shrink: 0;
    flex-basis: ${AsideWidth};
    display: flex;
    align-items: center;
    justify-content: center;
    width: ${AsideWidth};
`;

const Content = styled.div`
    flex: 1;
`;

const Floating = forwardRef<HTMLDivElement, StyledComponentProps<'div', {}, {
    /** @default 'fixed' */
    position?: 'absolute' | 'fixed';
    /** @default 'end' */
    direction?: 'start' | 'end';
    onRenderAside?: () => JSX.Element;
}, never>>(function Floating (
    { children, position = 'fixed', direction = 'end', onRenderAside = () => direction === 'end' ? '<' : '>', ...props }, ref
) {
    return (
        <Container position={position} direction={direction}>
            {direction === 'end' && (
                <Aside>
                    {onRenderAside()}
                </Aside>
            )}
            <Content ref={ref} {...props}>
                {children}
            </Content>
            {direction === 'start' && (
                <Aside>
                    {onRenderAside()}
                </Aside>
            )}
        </Container>
    );
});


export default Floating;
