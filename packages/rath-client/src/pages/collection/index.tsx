import { SearchBox, IconButton, Panel, TextField, DefaultButton, PrimaryButton, Stack } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import React, { useMemo, useState } from 'react';
import intl from 'react-intl-universal';
import { Sampling } from "visual-insights";
import { useBoolean } from '@fluentui/react-hooks';
import { useGlobalStore } from '../../store';
import { IInsightVizView } from '../../interfaces';
import { searchFilterView } from '../../utils';
import { Card } from '../../components/card';
import { MainCardContainer } from './components';
import CardView from './collectionView/cardView';
import ListView from './collectionView/listView';

enum VIEW_MODE {
    CARD = 'card',
    LIST = 'list',
}

enum COLLECT_CONFIG {
    TITLE = 'title',
    DESC = 'desc',
}

const collectionConfig = [
    { key: COLLECT_CONFIG.TITLE, title: COLLECT_CONFIG.TITLE },
    { key: COLLECT_CONFIG.DESC, title: COLLECT_CONFIG.DESC },
];

const buttonGroupToken = { childrenGap: 10 };

const Collection: React.FC = (props) => {
    const { collectionStore, dataSourceStore, commonStore } = useGlobalStore();
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
        if (cleanedData.length <= 2000) return cleanedData;
        return Sampling.reservoirSampling(cleanedData, 2000);
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
            <Card>
                <MainCardContainer>
                    <h1 className="seg-header">{intl.get('collection.title')}</h1>
                    <p className="seg-desc">{intl.get('collection.desc')}</p>
                    <SearchBox
                        placeholder="Search"
                        onSearch={(newValue) => {
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
                                <Stack horizontal horizontalAlign="end" tokens={buttonGroupToken}>
                                    <DefaultButton onClick={dismissPanel}>Cancel</DefaultButton>
                                    <PrimaryButton
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
                                            dismissPanel();
                                            collectionStore.addConfigCollectionList(newCollectionList);
                                        }}
                                    >
                                        Submit
                                    </PrimaryButton>
                                </Stack>
                            );
                        }}
                        isFooterAtBottom
                    >
                        {collectionConfig.map((item) => (
                            <TextField
                                key={item.key}
                                label={item.title}
                                value={configValue[item.key] || ''}
                                onChange={(e, data) => {
                                    setConfigValue({
                                        ...configValue,
                                        [item.key]: data,
                                    });
                                }}
                            />
                        ))}
                    </Panel>
                    {viewMode === VIEW_MODE.CARD && (
                        <CardView
                            metas={fieldMetas}
                            data={sampleData}
                            views={filteredColcList}
                            onConfig={onOpenKeyChange}
                            themeConfig={commonStore.themeConfig}
                        />
                    )}
                    {viewMode === VIEW_MODE.LIST && (
                        <ListView
                            metas={fieldMetas}
                            data={sampleData}
                            views={filteredColcList}
                            onConfig={onOpenKeyChange}
                            themeConfig={commonStore.themeConfig}
                        />
                    )}
                </MainCardContainer>
            </Card>
        </div>
    );
};

export default observer(Collection);
