import React, { useCallback, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import { Panel, Stack, Checkbox, Separator } from '@fluentui/react';
import { useGlobalStore } from '../../../store';

const stackTokens = { childrenGap: 10 };

interface ConstraintsPanelProps {}
const CHECKBOX_EXAMPLES = [
    { fid: 'exclude', state: -1 },
    { fid: 'auto', state: 0 },
    { fid: 'include', state: 1 },
];
const ConstraintsPanel: React.FC<ConstraintsPanelProps> = (props) => {
    const { exploreStore } = useGlobalStore();
    const { showConstraints, globalConstraints } = exploreStore;
    const { dimensions, measures } = globalConstraints;
    const closePanel = useCallback(() => {
        exploreStore.setShowContraints(false);
    }, [exploreStore]);
    useEffect(() => {
        exploreStore.initConstraints();
    }, [exploreStore, showConstraints]);
    return (
        <Panel headerText={intl.get('lts.commandBar.constraints')} isOpen={showConstraints} onDismiss={closePanel}>
            <Stack tokens={stackTokens}>
                <Separator>Explain</Separator>
                {CHECKBOX_EXAMPLES.map((f) => (
                    <Checkbox
                        disabled
                        key={f.fid}
                        label={intl.get(`lts.constraints.${f.fid}`)}
                        indeterminate={f.state === 0}
                        checked={f.state === 1}
                    />
                ))}
                <Separator>{intl.get('common.dimension')}</Separator>
                {dimensions.map((f, fIndex) => (
                    <Checkbox
                        key={f.fid}
                        label={f.name || f.fid}
                        indeterminate={f.state === 0}
                        checked={f.state === 1}
                        onChange={(e, checked) => {
                            exploreStore.updateConstraints('dimensions', fIndex);
                        }}
                    />
                ))}
                <Separator>{intl.get('common.measure')}</Separator>
                {measures.map((f, fIndex) => (
                    <Checkbox
                        key={f.fid}
                        label={f.name || f.fid}
                        indeterminate={f.state === 0}
                        checked={f.state === 1}
                        onChange={(e, checked) => {
                            exploreStore.updateConstraints('dimensions', fIndex);
                        }}
                    />
                ))}
            </Stack>
        </Panel>
    );
};

export default observer(ConstraintsPanel);
