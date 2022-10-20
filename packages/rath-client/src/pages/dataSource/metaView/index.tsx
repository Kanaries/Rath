import React, { useCallback, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite'
import { useGlobalStore } from '../../../store';
import MetaList from './metaList';
import { MessageBar, MessageBarType, PrimaryButton } from '@fluentui/react';
import intl from 'react-intl-universal';


const MetaView: React.FC = props => {
    const { dataSourceStore } = useGlobalStore();
    const { fieldsWithExtSug: fields } = dataSourceStore;
    const updateFieldInfo = useCallback((fieldId: string, fieldPropKey: string, value: any) => {
        dataSourceStore.updateFieldInfo(fieldId, fieldPropKey, value);
    }, [dataSourceStore])

    const fieldsCanExpand = fields.map((f, i) => ({ ...f, index: i })).filter(
        f => f.extSuggestions.length > 0,
    );

    const [focusIdx, setFocusIdx] = useState(-1);

    useEffect(() => {
        setFocusIdx(-1);
    }, [fieldsCanExpand.length]);

    const focusNext = () => {
        if (fieldsCanExpand.length === 0) {
            return setFocusIdx(-1);
        } else if (fieldsCanExpand.length === 1) {
            return setFocusIdx(-2);
        }

        setFocusIdx((focusIdx + 1) % fieldsCanExpand.length);
    };

    useEffect(() => {
        if (focusIdx === -2) {
            setFocusIdx(0);
        }
    }, [focusIdx]);

    // 这里加入一个快捷操作，只使用主体数据
    return <div>
        {fieldsCanExpand.length > 0 && (
            <div
                style={{
                    width: '100%',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    padding: '22px 1em 1em',
                    backgroundColor: '#fff',
                }}
            >
                <MessageBar
                    messageBarType={MessageBarType.warning}
                    isMultiline={false}
                    messageBarIconProps={{
                        iconName: 'AutoEnhanceOn',
                        style: {
                            color: 'rgb(0, 120, 212)',
                            fontWeight: 800,
                        },
                    }}
                    actions={
                        <div>
                            <PrimaryButton
                                style={{
                                    padding: '0 12px',
                                    height: '24px',
                                }}
                                onClick={focusNext}
                            >
                                {intl.get('dataSource.extend.findThem')}
                            </PrimaryButton>
                        </div>
                    }
                    styles={{
                        root: {
                            boxSizing: 'border-box',
                            width: 'unset',
                            color: 'rgb(0, 120, 212)',
                            backgroundColor: 'rgba(0, 120, 212, 0.02)',
                            border: '1px solid',
                        },
                    }}
                >
                    <span>
                        {intl.get('dataSource.extend.autoExtend', { count: fieldsCanExpand.length })}
                    </span>
                </MessageBar>
            </div>
        )}
        <MetaList metas={fields} focusIdx={fieldsCanExpand[focusIdx]?.index ?? -1} onChange={updateFieldInfo} />
    </div>
}

export default observer(MetaView);
