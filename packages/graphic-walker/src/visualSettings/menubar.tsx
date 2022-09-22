import { observer } from 'mobx-react-lite';
import React from 'react';
import { useGlobalStore } from '../store';
import styled from 'styled-components'
import { ArrowUturnLeftIcon, ArrowUturnRightIcon } from '@heroicons/react/24/solid';
import { useTranslation } from 'react-i18next';


export const MenubarContainer = styled.div({
    marginBlock: '0 0.6em',
    marginInline: '0.2em',
});

const Button = styled.button(({ disabled = false }) => ({
    '&:hover': disabled ? {} : {
        backgroundColor: 'rgba(243, 244, 246, 0.7)',
    },
    color: disabled ? 'rgba(156, 163, 175, 0.5)' : 'rgb(55, 65, 81)',
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
    icon?: JSX.Element;
}

const ButtonWithShortcut: React.FC<ButtonWithShortcutProps> = ({ label, shortcut, disabled, handler, icon }) => {
    const { t } = useTranslation('translation', { keyPrefix: 'main.tabpanel.menubar' });

    const rule = React.useMemo(() => {
        const keys = shortcut.split('+').map(d => d.trim());

        return {
            key: keys.filter(
                d => /^[a-z]$/i.test(d)
            )[0],
            ctrlKey: keys.includes('Ctrl'),
            shiftKey: keys.includes('Shift'),
            altKey: keys.includes('Alt'),
        };
    }, [shortcut]);

    React.useEffect(() => {
        const cb = (ev: KeyboardEvent) => {
            if (
                ev.ctrlKey === rule.ctrlKey
                && ev.shiftKey === rule.shiftKey
                && ev.altKey === rule.altKey
                && ev.key.toLowerCase() === rule.key.toLowerCase()
            ) {
                handler();
                ev.stopPropagation();
            }
        };

        document.body.addEventListener('keydown', cb);

        return () => document.body.removeEventListener('keydown', cb);
    }, [rule, handler]);

    return (
        <Button
            className="text-sm px-3 py-1 border text-gray-400 select-none"
            disabled={disabled}
            onClick={handler}
            aria-label={t(label)}
            title={`${t(label)} (${shortcut})`}
        >
            {icon || t(label)}
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
                shortcut="Ctrl+Z"
                icon={<ArrowUturnLeftIcon width="1.4em" height="1.4em" />}
            />
            <ButtonWithShortcut
                label="redo"
                disabled={!canRedo}
                handler={vizStore.redo.bind(vizStore)}
                shortcut="Ctrl+Shift+Z"
                icon={<ArrowUturnRightIcon width="1.4em" height="1.4em" />}
            />
        </MenubarContainer>
    );
}

export default observer(Menubar);