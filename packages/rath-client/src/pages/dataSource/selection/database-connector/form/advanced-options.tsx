import { ContextualMenu, PrimaryButton, Stack, TextField } from "@fluentui/react";
import { useState } from "react";
import { useId } from "@fluentui/react-hooks";
import intl from 'react-intl-universal';
import { observer } from "mobx-react-lite";


const AdvancedOptions = observer<{
    servers: {
        target: string;
        status: 'pending' | 'fulfilled' | 'rejected';
    }[];
    removeServer: (idx: number) => void;
    server: string;
    setServer: (target: string) => void;
}>(function AdvancedOptions ({ servers, server }) {
    const [customServer, setCustomServer] = useState('');
    const id = useId();

    return (
        <Stack>
            <TextField
                styles={{ root: { flexGrow: 1 } }}
                label={intl.get('dataSource.connectorService')}
                value={customServer}
                onChange={(_, val) => {
                    setCustomServer(val ?? '');
                }}
                autoComplete="off"
                id={id}
            />
            <ContextualMenu
                target={`#${id}`}
                items={servers.map(item => ({
                    key: item.target,
                    text: item.target,
                }))}
            />
            {/* <PrimaryButton
                text={intl.get('dataSource.apply')}
                onClick={serviceInfoHandler}
            /> */}
        </Stack>
    );
});


export default AdvancedOptions;
