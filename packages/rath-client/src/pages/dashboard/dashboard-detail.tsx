import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import styled from 'styled-components';
import { useGlobalStore } from '../../store';


const PageLayout = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    height: calc(100vh - 16px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    > div {
        background-color: #fff;
        margin-inline: 2em;
        padding-block: 1.5em;
        padding-inline: 3em;
        border-radius: 2px;
        box-shadow: 0 1.6px 3.6px 0 rgb(0 0 0 / 13%), 0 0.3px 0.9px 0 rgb(0 0 0 / 11%);
    }
`;

export interface DashboardDetailProps {
    cursor: number;
    /** back to dashboard list */
    goBack: () => void;
}

const DashboardDetail: FC<DashboardDetailProps> = ({ cursor }) => {
    const { dashboardStore } = useGlobalStore();
    const { pages } = dashboardStore;
    const page = pages[cursor];

    console.log(page);

    return (
        <PageLayout>
            {cursor}
        </PageLayout>
    );
};

export default observer(DashboardDetail);
