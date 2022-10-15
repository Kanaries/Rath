import { SearchBox, IconButton } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import React, { useMemo, useState } from 'react';
import { useGlobalStore } from '../../store';
import { baseDemoSample } from '../painter/sample';
import { IInsightVizView } from '../../interfaces';
import { MainCardContainer } from './components';
import CardView from './collectionView/cardView';
import ListView from './collectionView/listView';
import { searchFilterView } from './utils';


enum VIEW_MODE {
    CARD = 'card',
    LIST = 'list',
}

const Collection: React.FC = (props) => {
    const { collectionStore, dataSourceStore } = useGlobalStore();
    const { cleanedData, fieldMetas } = dataSourceStore;
    const { collectionList } = collectionStore;
    const [viewMode, setViewMode] = useState<VIEW_MODE>(VIEW_MODE.CARD);
    const [searchContent, setSearchContent] = useState<string>('');
    const sampleData = useMemo(() => {
        if (cleanedData.length > 2000) return cleanedData;
        return baseDemoSample(cleanedData, 2000);
    }, [cleanedData]);
    const filteredColcList = useMemo<IInsightVizView[]>(() => {
        if (searchContent === '') return collectionList;
        return searchFilterView(searchContent, collectionList)
    }, [collectionList, searchContent])
    return (
        <div className="content-container">
            <div className="card">
                <MainCardContainer>
                    <h1 className="seg-header">Collection</h1>
                    <p className="seg-desc">This is a collection of your analytic result</p>
                    <SearchBox placeholder="Search" onSearch={(newValue) => {
                        // const res = searchFilterView(newValue, collectionList)
                        // console.log(res)
                        setSearchContent(newValue)
                    }} />
                    <div>
                        <IconButton
                            iconProps={{ iconName: 'ViewList' }}
                            onClick={() => {
                                setViewMode(VIEW_MODE.LIST);
                            }}
                        />
                        <IconButton
                            iconProps={{ iconName: 'SnapToGrid' }}
                            onClick={() => {
                                setViewMode(VIEW_MODE.CARD);
                            }}
                        />
                    </div>
                    {viewMode === VIEW_MODE.CARD && <CardView metas={fieldMetas} data={sampleData} views={filteredColcList} />}
                    {viewMode === VIEW_MODE.LIST && <ListView metas={fieldMetas} data={sampleData} views={filteredColcList} />}
                </MainCardContainer>
            </div>
        </div>
    );
};

export default observer(Collection);
