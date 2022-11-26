import React, { useCallback, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite'
import intl from 'react-intl-universal';
import { ActionButton, DefaultButton, MessageBar, MessageBarType } from '@fluentui/react';
import { useGlobalStore } from '../../../store';
import MetaList from './metaList';


const MetaView: React.FC = props => {
    const { dataSourceStore } = useGlobalStore();
    const { fieldsWithExtSug } = dataSourceStore;
    const updateFieldInfo = useCallback((fieldId: string, fieldPropKey: string, value: any) => {
        dataSourceStore.updateFieldInfo(fieldId, fieldPropKey, value);
    }, [dataSourceStore])

    const fields: typeof fieldsWithExtSug = [];

    for (const f of fieldsWithExtSug) {
        if (f.stage === undefined) {
            fields.push(f);
        }
    }

    for (const f of fieldsWithExtSug) {
        if (f.stage !== undefined) {
            const from = f.extInfo?.extFrom.at(-1);
            const parent = fields.findIndex(_f => _f.fid === from);

            if (parent !== -1) {
                fields.splice(parent + 1, 0, f);
            } else {
                fields.push(f);
            }
        }
    }

    const fieldsCanExpand = fields.map((f, i) => ({ ...f, index: i })).filter(
        f => f.extSuggestions.length > 0,
    );

    const fieldsNotDecided = fields.filter(
        f => f.stage === 'preview',
    );

    const [focusIdx, setFocusIdx] = useState(-1);
    const [onlyAutoExtent, setOnlyAutoExtent] = useState(false);

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
                    // padding: '22px 1em 1em',
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
                            <DefaultButton
                                toggle
                                checked={onlyAutoExtent}
                                onClick={() => setOnlyAutoExtent(!onlyAutoExtent)}
                                style={{
                                    padding: '0 12px',
                                    height: '24px',
                                    border: 'none',
                                    filter: onlyAutoExtent ? 'contrast(0.9)' : 'opacity(0.7)',
                                }}
                            >
                                {intl.get('dataSource.extend.checkThem')}
                            </DefaultButton>
                            <ActionButton
                                style={{
                                    padding: '0 12px',
                                    height: '24px',
                                }}
                                onClick={focusNext}
                            >
                                {intl.get('dataSource.extend.findThem')}
                            </ActionButton>
                        </div>
                    }
                    styles={{
                        root: {
                            boxSizing: 'border-box',
                            width: 'unset',
                            color: 'rgb(0, 120, 212)',
                            backgroundColor: 'rgba(0, 120, 212, 0.12)',
                            // border: '1px solid rgba(0, 120, 212, 0.5)',
                        },
                    }}
                >
                    <span>
                        {intl.get('dataSource.extend.autoExtend', { count: fieldsCanExpand.length })}
                    </span>
                </MessageBar>
            </div>
        )}
        {fieldsNotDecided.length > 0 && (
            <MessageBar
                messageBarType={MessageBarType.warning}
                isMultiline={false}
                styles={{
                    root: {
                        boxSizing: 'border-box',
                        width: 'unset',
                        margin: '2px 0 1em 0',
                    },
                }}
            >
                <span>
                    {intl.get('dataSource.extend.notDecided', { count: fieldsNotDecided.length })}
                </span>
            </MessageBar>
        )}
        <MetaList onlyExt={onlyAutoExtent} metas={fields} focusIdx={fieldsCanExpand[focusIdx]?.index ?? -1} onChange={updateFieldInfo} />
    </div>
}

export default observer(MetaView);
