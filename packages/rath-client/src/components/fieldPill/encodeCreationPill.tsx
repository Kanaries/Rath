import React, { useCallback, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import produce from 'immer';
import { IFieldEncode } from '@kanaries/loa';
import { IFieldMeta } from '../../interfaces';
import { AGGREGATION_LIST } from '../../global';
import { RathSelect, RathSelectOption } from '../rath-ui/rath-select';
import { Button } from '../ui/button';
import { Popover, PopoverAnchor, PopoverContent } from '../ui/popover';
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
        aggregate: 'sum',
    });

    const toggleShow = useCallback(() => {
        setShow((v) => !v);
    }, []);
    const fieldOptions = useMemo<RathSelectOption[]>(() => {
        return fields
            .map((f) => ({
                key: f.fid,
                text: f.name || f.fid,
            }))
            .concat({
                key: '',
                text: 'none',
            });
    }, [fields]);

    const aggregatorOptions = useMemo<RathSelectOption[]>(() => {
        return AGGREGATION_LIST.map((f) => ({
            key: f.key,
            text: f.text,
        }));
    }, []);

    const submitResult = () => {
        onSubmit(encode);
        toggleShow();
    };

    return (
        <div ref={container}>
            <Popover open={show} onOpenChange={setShow}>
                <PopoverAnchor asChild>
                    <div>
                        <BasePillPlaceholder text={intl.get('common.addEncode')} onClick={toggleShow} />
                    </div>
                </PopoverAnchor>
                <PopoverContent className="w-auto p-0">
                    <Cont>
                        <div className="flex flex-col gap-[10px]">
                            <div>
                                <RathSelect
                                    label={intl.get('common.field')}
                                    options={fieldOptions}
                                    selectedKey={encode.field}
                                    onChange={(key) => {
                                        if (key === '') {
                                            setEncode({
                                                aggregate: 'count',
                                            });
                                            return;
                                        }
                                        const targetField = fields.find((f) => f.fid === key);
                                        if (targetField) {
                                            setEncode((f) => {
                                                const nextF = produce(f, (draft) => {
                                                    draft.field = targetField.fid;
                                                });
                                                return nextF;
                                            });
                                        }
                                    }}
                                />
                            </div>
                            <div>
                                <RathSelect
                                    label={intl.get('common.aggregation')}
                                    options={aggregatorOptions}
                                    selectedKey={encode.aggregate}
                                    onChange={(key) => {
                                        setEncode((f) => {
                                            const nextF = produce(f, (draft) => {
                                                draft.aggregate = key as any;
                                            });
                                            return nextF;
                                        });
                                    }}
                                />
                            </div>

                            <div className="flex flex-row gap-[1em]">
                                <Button onClick={submitResult}>{intl.get('dataSource.filter.submit')}</Button>
                                <Button variant="outline" onClick={toggleShow}>
                                    {intl.get('dataSource.filter.cancel')}
                                </Button>
                            </div>
                        </div>
                    </Cont>
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default EncodeCreationPill;
