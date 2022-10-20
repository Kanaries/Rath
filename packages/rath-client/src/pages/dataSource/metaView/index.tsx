import React, { useCallback, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite'
import { useGlobalStore } from '../../../store';
import { IFieldMeta } from '../../../interfaces';
import MetaList from './metaList';
import { MessageBar, MessageBarType, PrimaryButton } from '@fluentui/react';


const MetaView: React.FC = props => {
    const { dataSourceStore } = useGlobalStore();
    const { fieldMetas, mutFields } = dataSourceStore;
    const updateFieldInfo = useCallback((fieldId: string, fieldPropKey: string, value: any) => {
        dataSourceStore.updateFieldInfo(fieldId, fieldPropKey, value);
    }, [dataSourceStore])

    const expandMetas: (IFieldMeta & { canExpandAsTime: boolean })[] = mutFields.map(f => {
        const meta = fieldMetas.find(m => m.fid === f.fid);
        const dist = meta ? meta.distribution : []
        return {
            ...f,
            disable: f.disable,
            distribution: dist,
            features: meta ? meta.features: { entropy: 0, maxEntropy: 0, unique: dist.length },
            canExpandAsTime: dataSourceStore.canExpandAsDateTime(f.fid),
        }
    })
    const fieldsCanExpand = expandMetas.map((f, i) => ({ ...f, index: i })).filter(
        f => f.canExpandAsTime,
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
                                {/* TODO: i18n */}
                                {'查找'}
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
                    {/* TODO: i18n */}
                    <span>
                        {`${fieldsCanExpand.length} 个字段可以扩展生成新的字段。`}
                    </span>
                </MessageBar>
            </div>
        )}
        <MetaList metas={expandMetas} focusIdx={fieldsCanExpand[focusIdx]?.index ?? -1} onChange={updateFieldInfo} />
    </div>
}

export default observer(MetaView);
