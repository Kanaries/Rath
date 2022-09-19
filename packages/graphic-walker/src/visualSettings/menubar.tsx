import { BarsArrowDownIcon, BarsArrowUpIcon } from '@heroicons/react/24/outline';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { LiteForm } from '../components/liteForm';
import SizeSetting from '../components/sizeSetting';
import { CHART_LAYOUT_TYPE, GEMO_TYPES } from '../config';
import { useGlobalStore } from '../store';
import styled from 'styled-components'
import { ArrowPathIcon } from '@heroicons/react/24/solid';
import { useTranslation } from 'react-i18next';


export const MenubarContainer = styled.div({
    marginBlock: '0 0.6em',
    marginInline: '0.2em',
});

const Button = styled.button(({ disabled = false }) => ({
    '&:hover': disabled ? {} : {
        backgroundColor: 'rgba(243, 244, 246, 0.5)',
    },
    color: disabled ? 'rgb(156, 163, 175)' : 'rgb(55, 65, 81)',
    '& > pre': {
        display: 'inline-block',
        marginInlineStart: '0.2em',
    },
    marginInlineStart: '0.6em',
    '&:first-child': {
        marginInlineStart: '0',
    },
    cursor: disabled ? 'default' : 'pointer',
}));

interface ButtonWithShortcutProps {
    label: string;
    shortcut: string;
    disabled: boolean;
    handler: () => void;
}

const ButtonWithShortcut: React.FC<ButtonWithShortcutProps> = ({ label, shortcut, disabled, handler }) => {
    const { t } = useTranslation('translation', { keyPrefix: 'main.tabpanel.menubar' });

    React.useEffect(() => {
        const cb = (ev: KeyboardEvent) => {
            if (ev.key === shortcut.toLowerCase()) {
                handler();
                ev.stopPropagation();
            }
        };

        document.body.addEventListener('keydown', cb);

        return () => document.body.removeEventListener('keydown', cb);
    }, [shortcut, handler]);

    return (
        <Button
            className="text-sm px-3 py-1 border text-gray-400 select-none"
            disabled={disabled}
            onClick={handler}
            aria-label={t(label)}
            title={t(label)}
        >
            {t(label)}
            <pre>
                {"("}
                    <u>
                        {shortcut}
                    </u>
                {")"}
            </pre>
        </Button>
    );
};

const Menubar: React.FC = () => {
    const { vizStore } = useGlobalStore();
    const { canUndo, canRedo } = vizStore;

    return (
        <MenubarContainer>
            <ButtonWithShortcut
                label="undo"
                disabled={!canUndo}
                handler={vizStore.undo.bind(vizStore)}
                shortcut="U"
            />
            <ButtonWithShortcut
                label="redo"
                disabled={!canRedo}
                handler={vizStore.redo.bind(vizStore)}
                shortcut="R"
            />
        </MenubarContainer>
    );
}

export default observer(Menubar);