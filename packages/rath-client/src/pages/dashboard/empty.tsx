import { PrimaryButton } from '@fluentui/react';
import React from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
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
                <PrimaryButton
                    style={{ marginRight: '1em' }}
                    text={intl.get('menu.editor')}
                    disabled
                    onClick={() => {
                        commonStore.setAppKey(PIVOT_KEYS.editor);
                    }}
                />
                <PrimaryButton
                    style={{ marginRight: '1em' }}
                    text={intl.get('menu.semiAuto')}
                    onClick={() => {
                        commonStore.setAppKey(PIVOT_KEYS.semiAuto);
                    }}
                />
                <PrimaryButton
                    text={intl.get('menu.megaAuto')}
                    onClick={() => {
                        commonStore.setAppKey(PIVOT_KEYS.megaAuto);
                    }}
                />
            </div>
        </Cont>
    );
};

export default observer(Empty);
