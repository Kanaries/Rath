import {
    Callout,
    Dropdown,
    IDropdownOption,
    Stack,
    PrimaryButton,
    DefaultButton,
} from '@fluentui/react';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import produce from 'immer';
import { IFieldEncode } from '@kanaries/loa';
import { IFieldMeta } from '../../interfaces';
import { AGGREGATION_LIST } from '../../global';
import BasePillPlaceholder from './basePillPlaceholder';

const Cont = styled.div`
    padding: 1em;
    min-width: 16em;
`;
interface EncodeCreationPillProps {
    fields: IFieldMeta[];
    onSubmit: (encode: IFieldEncode) => void;
}
const EncodeCreationPill: React.FC<EncodeCreationPillProps> = (props) => {
    const { fields, onSubmit } = props;
    const container = useRef<HTMLDivElement>(null);
    const [show, setShow] = useState(false);
    const [encode, setEncode] = useState<IFieldEncode>({
        aggregate: 'sum'
    })


    const toggleShow = useCallback(() => {
        setShow((v) => !v);
    }, []);
    const fieldOptions = useMemo<IDropdownOption[]>(() => {
        return fields.map((f) => ({
            key: f.fid,
            text: f.name || f.fid,
        })).concat({
            key: '',
            text: 'none'
        });
    }, [fields]);

    const aggregatorOptions = useMemo<IDropdownOption[]>(() => {
        return AGGREGATION_LIST.map((f) => ({
            key: f.key,
            text: f.text
        }));
    }, []);

    const submitResult = () => {
        onSubmit(encode)
        toggleShow();
    }

    return (
        <div ref={container}>
            <BasePillPlaceholder text={intl.get('common.addEncode')} onClick={toggleShow} />
            {show && (
                <Callout
                    target={container}
                    role="dialog"
                    gapSpace={0}
                    onDismiss={() => {
                        setShow(false);
                    }}
                    setInitialFocus
                >
                    <Cont>
                        <Stack tokens={{ childrenGap: 10 }}>
                            <Stack.Item>
                                <Dropdown
                                    label={intl.get('common.field')}
                                    options={fieldOptions}
                                    selectedKey={encode.field}
                                    onChange={(e, op) => {
                                        if (op) {
                                            if (op.key === '') {
                                                setEncode({
                                                    aggregate: 'count'
                                                })
                                                return;
                                            }
                                            const targetField = fields.find((f) => f.fid === op.key);
                                            if (targetField) {
                                                setEncode((f) => {
                                                    const nextF = produce(f, (draft) => {
                                                        draft.field = targetField.fid;
                                                    });
                                                    return nextF;
                                                });
                                            }
                                        }
                                    }}
                                />
                            </Stack.Item>
                            <Stack.Item>
                                <Dropdown
                                    label={intl.get('common.aggregation')}
                                    options={aggregatorOptions}
                                    selectedKey={encode.aggregate}
                                    onChange={(e, op) => {
                                        if (op) {
                                            setEncode((f) => {
                                                const nextF = produce(f, (draft) => {
                                                    draft.aggregate = op.key as any;
                                                });
                                                return nextF;
                                            });
                                        }
                                    }}
                                />
                            </Stack.Item>

                            <Stack.Item>
                                <Stack horizontal>
                                    <PrimaryButton text={intl.get('dataSource.filter.submit')} onClick={submitResult} />
                                    <DefaultButton
                                        style={{ marginLeft: '1em' }}
                                        text={intl.get('dataSource.filter.cancel')}
                                        onClick={toggleShow}
                                    />
                                </Stack>
                            </Stack.Item>
                        </Stack>
                        
                    </Cont>
                </Callout>
            )}
        </div>
    );
};

export default EncodeCreationPill;
