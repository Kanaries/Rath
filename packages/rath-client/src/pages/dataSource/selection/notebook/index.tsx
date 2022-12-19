import intl from 'react-intl-universal';
import styled from 'styled-components';
import { observer } from "mobx-react-lite";
import { useGlobalStore } from "../../../../store";
import { LoginPanel } from "../../../loginInfo/account";
import NotebookSpace from './space';


const Container = styled.div`
    > header {
        font-size: 1rem;
        font-weight: 500;
        margin: 1em;
    }
    > div {
        display: flex;
        flex-direction: column;
        align-items: center;
        > * {
            flex-grow: 0;
            flex-shrink: 1;
        }
    }
`;

const Notebook = observer(function Notebook () {
    const { userStore } = useGlobalStore();
    const { loggedIn } = userStore;
    
    return (
        <Container>
            <header>{loggedIn ? intl.get('storage.download') : intl.get('login.login')}</header>
            {loggedIn ? (
                <NotebookSpace />
            ) : (
                <div>
                    <LoginPanel />
                </div>
            )}
        </Container>
    );
});


export default Notebook;
