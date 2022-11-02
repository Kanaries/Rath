import { ActionButton } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { FC, useCallback, useState } from 'react';
import styled from 'styled-components';
import DashboardDraft from './dashboard-draft';


const PageLayout = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    height: calc(100vh - 16px - 1em);
    display: flex;
    flex-direction: column;
    overflow: hidden;
`;

const Header = styled.div`
    flex-grow: 0;
    flex-shrink: 0;
    background-color: #fff;
    border-radius: 2px;
    box-shadow: 0 1.6px 3.6px 0 rgb(0 0 0 / 13%), 0 0.3px 0.9px 0 rgb(0 0 0 / 11%);
    margin-bottom: 0.6em;
    margin-inline: 16px;
`;

export interface DashboardDetailProps {
    cursor: number;
    /** back to dashboard list */
    goBack: () => void;
}

const DashboardDetail: FC<DashboardDetailProps> = ({ cursor, goBack }) => {
    const [mode, setMode] = useState<'edit' | 'preview'>('preview');

    const toggleMode = useCallback(() => {
        setMode(mode === 'edit' ? 'preview' : 'edit');
    }, [mode]);

    return (
        <PageLayout>
            <Header>
                <ActionButton iconProps={{ iconName: 'Back' }} onClick={goBack} />
                <ActionButton iconProps={{ iconName: mode === 'edit' ? 'AnalyticsView' : 'Edit' }} onClick={toggleMode} />
            </Header>
            <DashboardDraft cursor={cursor} mode={mode} />
        </PageLayout>
    );
};

export default observer(DashboardDetail);
