import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { useTranslation } from 'react-i18next';

import Modal from '../../components/modal';
import type { IFilterField, IFilterRule } from '../../interfaces';
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

const EmptyForm: React.FC<RuleFormProps> = () => <React.Fragment />;

const FilterEditDialog: React.FC = observer(() => {
    const { vizStore } = useGlobalStore();
    const { editingFilterIdx, draggableFieldState } = vizStore;

    const { t } = useTranslation('translation', { keyPrefix: 'filters' });

    const field = React.useMemo(() => {
        return editingFilterIdx !== null ? draggableFieldState.filters[editingFilterIdx] : null;
    }, [editingFilterIdx, draggableFieldState]);

    const [uncontrolledField, setUncontrolledField] = React.useState(field as IFilterField | null);
    const ufRef = React.useRef(uncontrolledField);
    ufRef.current = uncontrolledField;

    React.useEffect(() => {
        if (field !== ufRef.current) {
            setUncontrolledField(field);
        }
    }, [field]);

    const handleChange = React.useCallback((r: IFilterRule) => {
        if (editingFilterIdx !== null) {
            setUncontrolledField(uf => ({
                ...uf,
                rule: r,
            }) as IFilterField);
        }
    }, [editingFilterIdx]);

    const handleSubmit = React.useCallback(() => {
        if (editingFilterIdx !== null) {
            vizStore.writeFilter(editingFilterIdx, uncontrolledField?.rule ?? null);
        }

        vizStore.closeFilterEditing();
    }, [editingFilterIdx, uncontrolledField]);

    const Form = field ? ({
        quantitative: QuantitativeRuleForm,
        nominal: NominalRuleForm,
        ordinal: OrdinalRuleForm,
        temporal: TemporalRuleForm,
    }[field.semanticType] as React.FC<RuleFormProps>) : EmptyForm;
    
    return uncontrolledField ? (
        <Modal
            title={t('editing')}
            onClose={() => vizStore.closeFilterEditing()}
        >
            <header className="text-lg font-semibold py-2 outline-none">
                {t('form.name')}
            </header>
            <input className="border py-1 px-4" readOnly value={uncontrolledField.name}/>
            <header className="text-lg font-semibold py-2 outline-none">
                {t('form.rule')}
            </header>
            <Form
                field={uncontrolledField}
                onChange={handleChange}
            />
            <div className="flex justify-center text-green-500 mt-4">
                <CheckCircleIcon
                    width="3em"
                    height="3em"
                    role="button"
                    tabIndex={0}
                    aria-label="ok"
                    className="cursor-pointer hover:bg-green-50 p-1"
                    onClick={handleSubmit}
                    strokeWidth="1.5"
                />
            </div>
        </Modal>
    ) : null;
});


export default FilterEditDialog;
