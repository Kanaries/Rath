import { observer } from 'mobx-react-lite';
import type { FC } from 'react';
import styled from 'styled-components';
import AdvancedOptions from './advancedOptions';
import DefinitionPanel from './definitionPanel';


const Container = styled.div``;

const ConfigPanel: FC = () => {
    return (
        <Container>
            <DefinitionPanel />
            <AdvancedOptions />
        </Container>
    );
};


export default observer(ConfigPanel);
