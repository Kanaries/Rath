import intl from 'react-intl-universal';
import styled from 'styled-components';
import { observer } from "mobx-react-lite";


const Container = styled.div`
    width: 100%;
`;

const NotebookSpace = observer(function NotebookSpace () {
    return (
        <Container></Container>
    );
});


export default NotebookSpace;
