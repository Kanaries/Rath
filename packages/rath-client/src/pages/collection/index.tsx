import { SearchBox, IconButton, Panel, TextField, DefaultButton, ActionButton, PrimaryButton } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import React, { useMemo, useState } from 'react';
import intl from 'react-intl-universal';
import { useGlobalStore } from '../../store';
import { baseDemoSample } from '../painter/sample';
import { IInsightVizView } from '../../interfaces';
import { searchFilterView } from '../../utils';
import { MainCardContainer } from './components';
import CardView from './collectionView/cardView';
import ListView from './collectionView/listView';
import { useBoolean } from '@fluentui/react-hooks';

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
    const [isOpen, { setTrue: openPanel, setFalse: dismissPanel }] = useBoolean(false);
    const [openKey, setOpenKey] = useState('');
    const [configValue, setConfigValue] = useState<{ title: string | undefined; desc: string | undefined }>({
        title: '',
        desc: '',
    });
    const sampleData = useMemo(() => {
        if (cleanedData.length > 2000) return cleanedData;
        return baseDemoSample(cleanedData, 2000);
    }, [cleanedData]);
    const filteredColcList = useMemo<IInsightVizView[]>(() => {
        if (searchContent === '') return collectionList;
        return searchFilterView(searchContent, collectionList);
    }, [collectionList, searchContent]);

    const onOpenKeyChange = (data: IInsightVizView) => {
        const { title, desc, viewId } = data;
        setOpenKey(viewId);
        setConfigValue({
            title: title || (openKey === data.viewId && configValue.title) || '',
            desc: desc || (openKey === data.viewId && configValue.desc) || '',
        });
        openPanel();
    };
    return (
        <div className="content-container">
            <div className="card">
                <MainCardContainer>
                    <h1 className="seg-header">{intl.get('collection.title')}</h1>
                    <p className="seg-desc">{intl.get('collection.desc')}</p>
                    <SearchBox
                        placeholder="Search"
                        onSearch={(newValue) => {
                            // const res = searchFilterView(newValue, collectionList)
                            // console.log(res)
                            setSearchContent(newValue);
                        }}
                    />
                    <div>
                        <IconButton
                            iconProps={{ iconName: 'ViewList' }}
                            onClick={() => {
                                setViewMode(VIEW_MODE.LIST);
                            }}
                            title={intl.get('collection.viewMode.list')}
                            ariaLabel={intl.get('collection.viewMode.list')}
                        />
                        <IconButton
                            iconProps={{ iconName: 'SnapToGrid' }}
                            onClick={() => {
                                setViewMode(VIEW_MODE.CARD);
                            }}
                            title={intl.get('collection.viewMode.card')}
                            ariaLabel={intl.get('collection.viewMode.card')}
                        />
                    </div>
                    <Panel
                        headerText="Configuration Item"
                        isOpen={isOpen}
                        onDismiss={dismissPanel}
                        closeButtonAriaLabel="Close"
                        onRenderFooterContent={() => {
                            return (
                                <div className="flex justify-end">
                                    <DefaultButton onClick={dismissPanel}>Cancel</DefaultButton>
                                    <PrimaryButton
                                        className="ml-2"
                                        onClick={() => {
                                            const newCollectionList = collectionList.map((item) => {
                                                if (item.viewId === openKey) {
                                                    return {
                                                        ...item,
                                                        ...configValue,
                                                    };
                                                }
                                                return item;
                                            });
                                            dismissPanel()
                                            collectionStore.addConfigCollectionList(newCollectionList)
                                        }}
                                    >
                                        Submit
                                    </PrimaryButton>
                                </div>
                            );
                        }}
                        isFooterAtBottom
                    >
                        <TextField
                            label="title"
                            value={configValue.title || ''}
                            onChange={(e, data) => {
                                setConfigValue({
                                    ...configValue,
                                    title: data,
                                });
                            }}
                        ></TextField>
                        <TextField
                            label="desc"
                            value={configValue.desc || ''}
                            onChange={(e, data) => {
                                setConfigValue({
                                    ...configValue,
                                    desc: data,
                                });
                            }}
                        ></TextField>
                    </Panel>
                    {viewMode === VIEW_MODE.CARD && (
                        <CardView
                            metas={fieldMetas}
                            data={sampleData}
                            views={filteredColcList}
                            onConfig={onOpenKeyChange}
                        />
                    )}
                    {viewMode === VIEW_MODE.LIST && (
                        <ListView
                            metas={fieldMetas}
                            data={sampleData}
                            views={filteredColcList}
                            onConfig={onOpenKeyChange}
                        />
                    )}
                </MainCardContainer>
            </div>
        </div>
    );
};

export default observer(Collection);
