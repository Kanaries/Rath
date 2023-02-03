import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import { toJS } from 'mobx';
import produce from 'immer';
import { Textarea } from '@fluentui/react-components';
import type { DashboardTextBlock } from 'src/interfaces';

const StyledTextArea = styled(Textarea)`
    flex-grow: 1;
    flex-shrink: 1;
    flex-basis: 0%;
    textarea {
        height: 100%;
        font-size: 0.8rem;
    }
`;

const TextInspect = observer<{ data: DashboardTextBlock; onChange: (next: DashboardTextBlock) => void }>(function TextInspect ({
    data, onChange
}) {
    const { content } = data;

    return (
        <StyledTextArea
            value={content}
            onChange={(_, next) => onChange(produce(toJS(data), draft => {
                draft.content = next.value;
            }))}
        />
    );
});


export default TextInspect;
