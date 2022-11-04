import {
    Dropdown,
    IconButton,
    IDropdownOption,
    Label,
    Panel,
    PrimaryButton,
    Slider,
    Stack,
    Toggle,
} from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { makeRenderLabelHandler } from '../../components/labelTooltip';
import { useGlobalStore } from '../../store';
import { ICausalAlgorithm, IndepenenceTest, UCPriority, UCRule } from '../../store/causalStore';

const CAUSUAL_ALGORITHM_OPTIONS: IDropdownOption[] = [
    { key: ICausalAlgorithm.PC, text: ICausalAlgorithm.PC },
    { key: ICausalAlgorithm.FCI, text: ICausalAlgorithm.FCI },
    { key: ICausalAlgorithm.CONOD, text: ICausalAlgorithm.CONOD },
];

const INDEPENDENCE_TEST_OPTIONS: IDropdownOption[] = [
    { key: IndepenenceTest.chiSquare, text: 'chi-square' },
    { key: IndepenenceTest.gSquare, text: 'g-square' },
    { key: IndepenenceTest.fisherZ, text: 'fisher-z' },
    { key: IndepenenceTest.kci, text: 'kci' },
    { key: IndepenenceTest.mvFisherz, text: 'mv-fisherz' },
];

const UC_RULE_OPTIONS: IDropdownOption[] = [
    { key: UCRule.uc_supset, text: 'uc_supset' },
    { key: UCRule.maxP, text: 'maxP' },
    { key: UCRule.definiteMaxP, text: 'definiteMaxP' },
];

const UC_PRIORITY_OPTIONS: IDropdownOption[] = [
    { key: UCPriority.default, text: 'whatever is default in uc_rule' },
    { key: UCPriority.overwrite, text: 'overwrite' },
    { key: UCPriority.biDirected, text: 'orient bi-directed' },
    { key: UCPriority.existing, text: 'prioritize existing colliders' },
    { key: UCPriority.stronger, text: 'prioritize stronger colliders' },
    { key: UCPriority.stronger_plus, text: 'prioritize stronger* colliders' },
];

const Params: React.FC = (props) => {
    const { causalStore } = useGlobalStore();
    const { causalParams, showSettings } = causalStore;
    return (
        <div>
            <IconButton
                text="Params"
                iconProps={{ iconName: 'Settings' }}
                onClick={() => causalStore.toggleSettings(true)}
            />
            <Panel
                isOpen={showSettings}
                onDismiss={() => {
                    causalStore.toggleSettings(false);
                }}
            >
                <Label>Settings</Label>
                <Stack tokens={{ childrenGap: '1em' }}>
                    <Stack.Item>
                        <Dropdown
                            label="Algorithm"
                            options={CAUSUAL_ALGORITHM_OPTIONS}
                            selectedKey={causalParams.algorithm}
                            onChange={(e, o) => {
                                o && causalStore.updateCausalParamsValue('algorithm', o.key as ICausalAlgorithm);
                            }}
                            onRenderLabel={makeRenderLabelHandler('The algorithm to use.')}
                        />
                    </Stack.Item>
                    <Stack.Item>
                        <Slider
                            label="Alpha"
                            min={0}
                            max={1}
                            step={0.01}
                            value={causalParams.alpha}
                            onChange={(v) => {
                                causalStore.updateCausalParamsValue('alpha', v);
                            }}
                        />
                    </Stack.Item>
                    <Stack.Item>
                        <Dropdown
                            label="Independence Test"
                            options={INDEPENDENCE_TEST_OPTIONS}
                            selectedKey={causalParams.indep_test}
                            onChange={(e, o) => {
                                o && causalStore.updateCausalParamsValue('indep_test', o.key as IndepenenceTest);
                            }}
                            onRenderLabel={makeRenderLabelHandler('The independence test to use.')}
                        />
                    </Stack.Item>
                    <Stack.Item>
                        <Toggle
                            label="Stable"
                            checked={causalParams.stable}
                            onChange={(e, v) => {
                                causalStore.updateCausalParamsValue('stable', Boolean(v));
                            }}
                        />
                    </Stack.Item>
                    <Stack.Item>
                        <Dropdown
                            label="UC Rule"
                            options={UC_RULE_OPTIONS}
                            selectedKey={causalParams.uc_rule}
                            onChange={(e, o) => {
                                o && causalStore.updateCausalParamsValue('uc_rule', o.key as UCRule);
                            }}
                            onRenderLabel={makeRenderLabelHandler('how unshielded colliders are oriented.')}
                        />
                    </Stack.Item>
                    <Stack.Item>
                        <Dropdown
                            label="UC Priority"
                            options={UC_PRIORITY_OPTIONS}
                            selectedKey={causalParams.uc_priority}
                            onChange={(e, o) => {
                                o && causalStore.updateCausalParamsValue('uc_priority', o.key as UCPriority);
                            }}
                            onRenderLabel={makeRenderLabelHandler('rule of resolving conflicts between unshielded colliders.')}
                        />
                    </Stack.Item>
                    <Stack.Item>
                        <Toggle
                            label="mvpc"
                            checked={causalParams.mvpc}
                            onChange={(e, v) => {
                                causalStore.updateCausalParamsValue('mvpc', Boolean(v));
                            }}
                        />
                    </Stack.Item>
                    <Stack.Item>
                        <PrimaryButton
                            text="Run"
                            onClick={() => {
                                causalStore.reRunCausalDiscovery();
                            }}
                        />
                    </Stack.Item>
                </Stack>
            </Panel>
        </div>
    );
};

export default observer(Params);
