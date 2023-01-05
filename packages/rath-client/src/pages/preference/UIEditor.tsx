import { memo } from "react";
import styled from "styled-components";
import Form from "./form";
import { PreferencesSchema } from "./types";


const Container = styled.div`
    height: 80vh;
    overflow: auto;
`;

const UIEditor = memo<{ schema: PreferencesSchema }>(function UIEditor ({ schema }) {
    return (
        <Container onKeyDown={e => e.stopPropagation()}>
            <Form schema={schema} />
        </Container>
    );
});


export default UIEditor;
