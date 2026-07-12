import React from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { Button } from '../../components/ui/button';
import { useGlobalStore } from '../../store';
import { PIVOT_KEYS } from '../../constants';

const Cont = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-bottom: 10vh;

    > header {
        font-size: 1.4rem;
        margin: 2.5em;
    }
    > p {
        margin: 1em;
    }
    > div {
        margin: 4em;
    }
`;

const Empty: React.FC = () => {
    const { commonStore } = useGlobalStore();

    return (
        <Cont>
            <header className="header">空的收藏夹</header>
            <p className="desc">将图表添加至收藏夹以在这里使用它们</p>
            <div>
                <Button
                    style={{ marginRight: '1em' }}
                    disabled
                    onClick={() => {
                        commonStore.setAppKey(PIVOT_KEYS.editor);
                    }}
                >
                    {intl.get('menu.editor')}
                </Button>
                <Button
                    style={{ marginRight: '1em' }}
                    onClick={() => {
                        commonStore.setAppKey(PIVOT_KEYS.semiAuto);
                    }}
                >
                    {intl.get('menu.semiAuto')}
                </Button>
                <Button
                    onClick={() => {
                        commonStore.setAppKey(PIVOT_KEYS.megaAuto);
                    }}
                >
                    {intl.get('menu.megaAuto')}
                </Button>
            </div>
        </Cont>
    );
};

export default observer(Empty);
