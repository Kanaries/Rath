import { CommandButton } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { Fragment, useState } from 'react';
import intl from 'react-intl-universal';
import { useGlobalStore } from '../../store';
import LaTiaoModal from './modal';


const LaTiaoConsole = observer(() => {
    const { dataSourceStore } = useGlobalStore();
    const { rawDataMetaInfo } = dataSourceStore;
    const [open, setOpen] = useState(false);

    return (
        <Fragment>
            <CommandButton
                text={intl.get('dataSource.extend.manual')}
                disabled={rawDataMetaInfo.length === 0}
                iconProps={{ iconName: 'AppIconDefaultAdd' }}
                onClick={() => rawDataMetaInfo.length && setOpen(true)}
            />
            {open && (
                <LaTiaoModal close={() => setOpen(false)} />
            )}
        </Fragment>
    );
});


export default LaTiaoConsole;
