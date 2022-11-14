import { CommandButton } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { Fragment, useState } from 'react';
import intl from 'react-intl-universal';
import { useGlobalStore } from '../../store';
import LaTiaoModal from './modal';


const LaTiaoConsole = observer(() => {
    const { dataSourceStore } = useGlobalStore();
    const { rawData } = dataSourceStore;
    const [open, setOpen] = useState(false);

    return (
        <Fragment>
            <CommandButton
                text={intl.get('dataSource.extend.manual')}
                disabled={rawData.length === 0}
                iconProps={{ iconName: 'AppIconDefaultAdd' }}
                onClick={() => rawData.length && setOpen(true)}
            />
            {open && (
                <LaTiaoModal close={() => setOpen(false)} />
            )}
        </Fragment>
    );
});


export default LaTiaoConsole;
