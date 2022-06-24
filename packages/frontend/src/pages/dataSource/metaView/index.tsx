import React, { useCallback } from 'react';
import { observer } from 'mobx-react-lite'
import { useGlobalStore } from '../../../store';
import MetaList from './metaList';
import { IFieldMeta } from '../../../interfaces';
// import { DefaultButton } from 'office-ui-fabric-react';


const MetaView: React.FC = props => {
    const { dataSourceStore } = useGlobalStore();
    const { fieldMetas, mutFields } = dataSourceStore;
    const updateFieldInfo = useCallback((fieldId: string, fieldPropKey: string, value: any) => {
        dataSourceStore.updateFieldInfo(fieldId, fieldPropKey, value);
    }, [dataSourceStore])

    const expandMetas: IFieldMeta[] = mutFields.map(f => {
        const meta = fieldMetas.find(m => m.fid === f.fid);
        const dist = meta ? meta.distribution : []
        return {
            ...f,
            disable: f.disable,
            distribution: dist,
            features: meta ? meta.features: { entropy: 0, maxEntropy: 0, unique: dist.length }
        }
    })
    // 这里加入一个快捷操作，只使用主体数据
    return <div>
        {/* <DefaultButton text="tets" onClick={() => {
            dataSourceStore.addFilter()
        }} /> */}
        <MetaList metas={expandMetas} onChange={updateFieldInfo} />
    </div>
}

export default observer(MetaView);
