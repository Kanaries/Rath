import { PrimaryButton } from '@fluentui/react';
import React from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { useGlobalStore } from '../../store';
import { PIVOT_KEYS } from '../../constants';

const Cont = styled.div`
    padding: 2em;
    text-align: center;
    .header {
        font-size: 5em;
        font-weight: 500;
    }
    .desc {
        font-size: 2em;
        font-weight: 500;
    }
`;
const EmptyError: React.FC = () => {
    const { commonStore } = useGlobalStore();
    return (
        <Cont>
            <h1 className="header">404</h1>
            <p className="desc">You need bring a visualization from semi/mega auto exploration.</p>
            <div>
                <PrimaryButton
                    style={{ marginRight: '1em' }}
                    text={intl.get('menu.megaAuto')}
                    onClick={() => {
                        commonStore.setAppKey(PIVOT_KEYS.megaAuto);
                    }}
                />
                <PrimaryButton
                    text={intl.get('menu.semiAuto')}
                    onClick={() => {
                        commonStore.setAppKey(PIVOT_KEYS.semiAuto);
                    }}
                />
            </div>
        </Cont>
    );
};

export default observer(EmptyError);
