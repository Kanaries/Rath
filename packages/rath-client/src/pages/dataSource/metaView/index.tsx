import React, { useCallback, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite'
import intl from 'react-intl-universal';
import { useGlobalStore } from '../../../store';
import { RathIcon } from '../../../components/icons';
import { Alert } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
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
                <Alert className="box-border w-auto border-transparent bg-[rgba(0,120,212,0.12)] text-[#0078d4]">
                    <div className="flex items-center gap-2">
                        <RathIcon name="AutoEnhanceOn" className="shrink-0 font-extrabold" />
                        <span className="grow">
                            {intl.get('dataSource.extend.autoExtend', { count: fieldsCanExpand.length })}
                        </span>
                        <div>
                            <Button
                                variant="ghost"
                                className={onlyAutoExtent ? 'h-6 px-3 opacity-90' : 'h-6 px-3 opacity-70'}
                                onClick={() => setOnlyAutoExtent(!onlyAutoExtent)}
                            >
                                {intl.get('dataSource.extend.checkThem')}
                            </Button>
                            <Button
                                variant="ghost"
                                className="h-6 px-3"
                                onClick={focusNext}
                            >
                                {intl.get('dataSource.extend.findThem')}
                            </Button>
                        </div>
                    </div>
                </Alert>
            </div>
        )}
        {fieldsNotDecided.length > 0 && (
            <Alert className="my-[2px] mb-[1em] box-border w-auto">
                <span>
                    {intl.get('dataSource.extend.notDecided', { count: fieldsNotDecided.length })}
                </span>
            </Alert>
        )}
        <MetaList onlyExt={onlyAutoExtent} metas={fields} focusIdx={fieldsCanExpand[focusIdx]?.index ?? -1} onChange={updateFieldInfo} />
    </div>
}

export default observer(MetaView);
