import { FC, useState, type JSX } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import { RathIcon } from '../../components/icons';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '../../components/ui/sidebar';
import { cn } from '../../utils/cn';
import Setup from './setup';

export enum PreferencesType {
    Info = 'info',
    Setting = 'setting',
    Header = 'header',
}
export interface PreferencesListType {
    key: PreferencesType;
    name: PreferencesType;
    icon: string;
    element: () => JSX.Element;
}

const Container = styled.div`
    display: flex;
    > .nav-menu {
        flex-grow: 0;
        border: 1px solid var(--border);
    }
    > .nav-content {
        padding: 1em;
        flex-grow: 1;
        flex-shrink: 1;
        border-top: 1px solid var(--border);
        border-right: 1px solid var(--border);
        border-bottom: 1px solid var(--border);
    }
`;

const LoginInfo: FC = () => {
    const [showUserPanel, setShowUserPanel] = useState(false);
    const [tab, setTab] = useState<PreferencesType>(PreferencesType.Setting);
    const preferencesLabel = intl.get('login.preferences');

    return (
        <>
            <Dialog
                open={showUserPanel}
                onOpenChange={(nextOpen) => {
                    setShowUserPanel(nextOpen);
                }}
            >
                <DialogContent
                    className="min-w-[550px]"
                    onInteractOutside={(event) => {
                        event.preventDefault();
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>{intl.get('login.preferences')}</DialogTitle>
                    </DialogHeader>
                    <Container>
                        <div className="nav-menu">
                            <nav aria-label={intl.get('login.preferences')} className="min-w-[140px] p-1">
                                <button
                                    type="button"
                                    aria-current={tab === PreferencesType.Setting ? 'page' : undefined}
                                    className={cn(
                                        'flex h-8 w-full items-center gap-2 rounded-xs px-3 text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring',
                                        tab === PreferencesType.Setting && 'bg-accent font-medium text-accent-foreground'
                                    )}
                                    onClick={(event) => {
                                        event.preventDefault();
                                        setTab(PreferencesType.Setting);
                                    }}
                                >
                                    <RathIcon name="Settings" />
                                    {PreferencesType.Setting}
                                </button>
                            </nav>
                        </div>
                        <div className="nav-content">{tab === PreferencesType.Setting && <Setup />}</div>
                    </Container>
                </DialogContent>
            </Dialog>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton type="button" tooltip={preferencesLabel} aria-label={preferencesLabel} onClick={() => setShowUserPanel(true)}>
                        <RathIcon name="PlayerSettings" />
                        <span>{preferencesLabel}</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </>
    );
};

export default observer(LoginInfo);
