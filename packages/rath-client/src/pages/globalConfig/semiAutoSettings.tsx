import { useMemo, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { ChoiceGroup, IChoiceGroupOption, Label, Toggle, DefaultButton, PrimaryButton } from '@fluentui/react';
import intl from 'react-intl-universal';
import { useGlobalStore } from '../../store';
import OperationBar from '../semiAutomation/operationBar';
import styled from 'styled-components';
import { notify } from '../../components/error';

const SemiAutoDiv = styled.div`
    padding: 1rem 0.5rem;
    .save-btn {
        margin-top: 2rem;
        display: flex;
        justify-content: flex-end;
    }
    .auto-prediction {
        display: flex;
        margin-bottom: 10px;
        > div {
            margin-right: 20px;
            width: 100px;
        }
    }
`;

const SemiAutoSetting = (props: { onSave: (check: boolean) => void }) => {
    const { semiAutoStore } = useGlobalStore();
    const { onSave } = props;
    useEffect(() => {
        semiAutoStore.getConfigurePersistence();
    }, []);

    const options = useMemo<IChoiceGroupOption[]>(() => {
        return [
            { text: intl.get('semiAuto.main.vizsys.lite'), key: 'lite' },
            { text: intl.get('semiAuto.main.vizsys.strict'), key: 'strict' },
        ];
    }, []);
    const { settings, autoAsso } = semiAutoStore;
    const { vizAlgo } = settings;

    return (
        <SemiAutoDiv>
            <ChoiceGroup
                label={intl.get('semiAuto.main.vizsys.title')}
                onChange={(e, op) => {
                    op && semiAutoStore.updateSettings('vizAlgo', op.key);
                }}
                selectedKey={vizAlgo}
                options={options}
            />
            <hr style={{ margin: '1em 0 10px 0' }} />
            <Label>Auto Prediction</Label>
            <div className="auto-prediction">
                <Toggle
                    className="mr-8"
                    checked={autoAsso.featViews}
                    onText="Auto"
                    offText="Manual"
                    label="Feat"
                    onChange={(e, checked) => {
                        semiAutoStore.updateAutoAssoConfig('featViews', Boolean(checked));
                    }}
                />
                <Toggle
                    className="mr-8"
                    checked={autoAsso.pattViews}
                    onText="Auto"
                    offText="Manual"
                    label="Patt"
                    onChange={(e, checked) => {
                        semiAutoStore.updateAutoAssoConfig('pattViews', Boolean(checked));
                    }}
                />
                <Toggle
                    checked={autoAsso.filterViews}
                    onText="Auto"
                    offText="Manual"
                    label="Subspace"
                    onChange={(e, checked) => {
                        semiAutoStore.updateAutoAssoConfig('filterViews', Boolean(checked));
                    }}
                />
            </div>

            <hr />
            <OperationBar />
            <div className="save-btn">
                <PrimaryButton
                    onClick={() => {
                        onSave(true);
                        semiAutoStore.configurePersistence().then(() => {
                            notify({
                                title: 'Save Success',
                                type: 'success',
                                content: 'Configuration Item Saved Successfully',
                            });
                            onSave(false);
                        });
                    }}
                >
                    {intl.get('function.confirm')}
                </PrimaryButton>
            </div>
        </SemiAutoDiv>
    );
};

export default observer(SemiAutoSetting);
