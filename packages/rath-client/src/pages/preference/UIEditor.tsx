import { observer } from "mobx-react-lite";
import styled from "styled-components";
import DynamicForm from "../causal/dynamicForm";
import { PreferencesSchema } from "./types";
import { toForm } from "./utils";


const Container = styled.div`
    height: 80vh;
    overflow: auto;
`;

const UIEditor = observer<{ schema: PreferencesSchema }>(function UIEditor ({ schema }) {
    const [form, values] = toForm('Preferences', schema);

    return (
        <Container onKeyDown={e => e.stopPropagation()}>
            <DynamicForm
                form={form}
                values={values}
                onChange={(k, v) => {
                    const item = schema.properties[k];
                    if ('onChange' in item) {
                        item.onChange(v as never);
                    }
                }}
            />
        </Container>
    );
});


export default UIEditor;
