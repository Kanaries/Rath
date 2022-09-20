import { observer } from 'mobx-react-lite';
import React from 'react';
import { useTranslation } from 'react-i18next';

import Modal from '../../components/modal';
import type { IFilterRule } from '../../interfaces';
import { useGlobalStore } from '../../store';
import Tabs, { RuleFormProps } from './tabs';


const QuantitativeRuleForm: React.FC<RuleFormProps> = ({
    field,
    onChange,
}) => {
    return (
        <Tabs
            field={field}
            onChange={onChange}
            tabs={['range', 'one of']}
        />
    );
};

const NominalRuleForm: React.FC<RuleFormProps> = ({
    field,
    onChange,
}) => {
    return (
        <Tabs
            field={field}
            onChange={onChange}
            tabs={['one of']}
        />
    );
};

const OrdinalRuleForm: React.FC<RuleFormProps> = ({
    field,
    onChange,
}) => {
    return (
        <Tabs
            field={field}
            onChange={onChange}
            tabs={['range', 'one of']}
        />
    );
};

const TemporalRuleForm: React.FC<RuleFormProps> = ({
    field,
    onChange,
}) => {
    return (
        <Tabs
            field={field}
            onChange={onChange}
            tabs={['one of', 'temporal range']}
        />
    );
};

const FilterEditDialog: React.FC = observer(() => {
    const { vizStore } = useGlobalStore();
    const { editingFilterIdx, draggableFieldState } = vizStore;

    const { t } = useTranslation('translation', { keyPrefix: 'filters' });

    const field = editingFilterIdx !== null ? draggableFieldState.filters[editingFilterIdx] : null;

    const handleChange = React.useCallback((rule: IFilterRule) => {
        if (editingFilterIdx !== null) {
            vizStore.writeFilter(editingFilterIdx, rule);
        }
    }, [editingFilterIdx]);

    const Form = field ? ({
        quantitative: QuantitativeRuleForm,
        nominal: NominalRuleForm,
        ordinal: OrdinalRuleForm,
        temporal: TemporalRuleForm,
    }[field.semanticType] as React.FC<RuleFormProps>) : React.Fragment;

    return field ? (
        <Modal
            title={t('editing')}
            onClose={() => vizStore.closeFilterEditing()}
        >
            <header>
                {t('form.name')}
            </header>
            <input readOnly value={field.name}/>
            <header>
                {t('form.rule')}
            </header>
            <Form
                field={field}
                onChange={handleChange}
            />
        </Modal>
    ) : null;
});


export default FilterEditDialog;
