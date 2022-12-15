import { PrimaryButton, Spinner } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import type { FC } from 'react';
import styled from 'styled-components';
import { useGlobalStore } from '../../../../store';
import AdvancedOptions from './advancedOptions';
import { useHypothesisTestContext } from './context';
import DefinitionPanel from './definitionPanel';


const Container = styled.div`
    display: flex;
    flex-direction: column;
    > * {
        flex-grow: 0;
        flex-shrink: 0;
    }
`;

const ConfigPanel: FC = () => {
    const { causalStore } = useGlobalStore();
    const { serverActive } = causalStore.operator;
    const context = useHypothesisTestContext();

    return (
        <Container>
            <DefinitionPanel />
            <AdvancedOptions />
            <div>
                <PrimaryButton
                    iconProps={context?.busy ? {} : { iconName: 'ReRun' }}
                    disabled={context?.okToRun !== true || context?.busy || !serverActive}
                    onClick={() => context?.run()}
                >
                    {context?.busy ? <Spinner /> : 'Run'}
                </PrimaryButton>
            </div>
        </Container>
    );
};


export default observer(ConfigPanel);
