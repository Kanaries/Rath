import { FC, useState } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import { RathIcon } from '../../components/icons';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
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

const LoginInfoDiv = styled.div`
    display: flex;
    align-items: center;
    /* flex-direction: column; */
    border-top-width: 1px;
    padding: 0.6em 0.8em 0.8em;
    > div {
        user-select: none;
        cursor: pointer;
    }
    .user {
        white-space: nowrap;
        max-width: 164px;
        overflow-x: auto;
        font-size: 0.875rem;
        line-height: 1.25rem;
        font-weight: 400;
    }
    .user::-webkit-scrollbar {
        display: none;
    }
    .user-avatar {
        width: 38px;
        height: 38px;
        border-radius: 19px;
        border: 3px solid #000;
        margin: 0px 12px;
        background-size: contain;
        background-repeat: no-repeat;
    }
`;

const Container = styled.div`
    display: flex;
    > .nav-menu {
        flex-grow: 0;
        border: 1px solid #e9ebf0;
    }
    > .nav-content {
        padding: 1em;
        flex-grow: 1;
        flex-shrink: 1;
        border-top: 1px solid #e9ebf0;
        border-right: 1px solid #e9ebf0;
        border-bottom: 1px solid #e9ebf0;
    }
`;

const LoginInfo: FC = () => {
    const [showUserPanel, setShowUserPanel] = useState(false);
    const [tab, setTab] = useState<PreferencesType>(PreferencesType.Setting);

    return (
        <LoginInfoDiv>
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
                                        'flex h-8 w-full items-center gap-2 rounded-sm px-3 text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
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
            <div
                className="user"
                onClick={() => {
                    setShowUserPanel(true);
                }}
            >
                <RathIcon name="PlayerSettings" />
            </div>
        </LoginInfoDiv>
    );
};

export default observer(LoginInfo);
