import { Spinner } from "@fluentui/react";
import intl from 'react-intl-universal';
import { observer } from "mobx-react-lite";
import styled from "styled-components";
import { useGlobalStore } from "../../store";


const Container = styled.div`
    position: fixed;
    right: 1.6em;
    top: 1.2em;
    pointer-events: none;
`;

const AutoSaving = observer(function AutoSaving () {
    const { userStore } = useGlobalStore();
    const { saving } = userStore;

    return saving ? (
        <Container>
            <Spinner label={intl.get('storage.auto_save')} styles={{ root: { flexDirection: 'row-reverse' }, label: { margin: '0 0.6em 0 0', fontSize: '0.9rem', color: '#888' } }} />
        </Container>
    ) : null;
});


export default AutoSaving;
