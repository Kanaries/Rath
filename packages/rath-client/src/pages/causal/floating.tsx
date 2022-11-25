import { forwardRef } from "react";
import styled, { StyledComponentProps } from "styled-components";


const Container = styled.div`
    position: fixed;
    right: 0;
    top: 50vh;
    background-color: #fff;
    box-shadow: 0 1.6px 3.6px 0 rgb(0 0 0 / 13%), 0 0.3px 0.9px 0 rgb(0 0 0 / 11%);
    transition: transform 400ms, margin 400ms;
    margin-right: 3em;
    transform: translate(100%, -50%);
    :hover {
        transform: translate(0, -50%);
        margin-right: 0;
    }
    display: flex;
    flex-direction: row;
`;

const Aside = styled.div`
    user-select: none;
    flex-grow: 0;
    flex-shrink: 0;
    flex-basis: 3em;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3em;
`;

const Content = styled.div`
    flex: 1;
`;

const Floating = forwardRef<HTMLDivElement, StyledComponentProps<'div', {}, {}, never>>(function Floating (
    { children, ...props }, ref
) {
    return (
        <Container>
            <Aside>
                {'<'}
            </Aside>
            <Content ref={ref} {...props}>
                {children}
            </Content>
        </Container>
    );
});


export default Floating;
