import { Stack, Label } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import { getI18n } from '../../locales';
import LaTiaoConsole from '../../../../components/latiaoConsole';
import FieldPanel from './fieldTable';
import Picker from './picker';


const CausalDatasetConfig: FC = () => {
    return (
        <>
            <Stack style={{ marginBlock: '0.6em -0.6em', alignItems: 'center' }} horizontal>
                <Label style={{ marginRight: '1em' }}>{getI18n('dataset_config.calc')}</Label>
                <LaTiaoConsole />
            </Stack>
            <Picker />
            <FieldPanel />
        </>
    );
};


export default observer(CausalDatasetConfig);
