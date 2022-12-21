import { Stack, Label } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import type { FC } from 'react';
import styled from 'styled-components';
import { getI18n } from '../../locales';
import LaTiaoConsole from '../../../../components/latiaoConsole';
import FieldPanel from './fieldTable';
import Picker from './picker';


const Container = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
`;

const CausalDatasetConfig: FC = () => {
    return (
        <Container>
            <Stack style={{ marginBlock: '0.6em -0.6em', alignItems: 'center' }} horizontal>
                <Label style={{ marginRight: '1em' }}>{getI18n('dataset_config.calc')}</Label>
                <LaTiaoConsole />
            </Stack>
            <Picker />
            <FieldPanel />
        </Container>
    );
};


export default observer(CausalDatasetConfig);
