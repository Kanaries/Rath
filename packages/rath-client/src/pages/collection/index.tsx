import { observer } from 'mobx-react-lite';
import React, { useMemo, useState } from 'react';
import intl from 'react-intl-universal';
import { Sampling } from 'visual-insights';
import { useGlobalStore } from '../../store';
import { IInsightVizView } from '../../interfaces';
import { searchFilterView } from '../../utils';
import { Card } from '../../components/card';
import { RathIcon } from '../../components/icons';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '../../components/ui/sheet';
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

const Collection: React.FC = (props) => {
    const { collectionStore, dataSourceStore, commonStore } = useGlobalStore();
    const { cleanedData, fieldMetas } = dataSourceStore;
    const { collectionList } = collectionStore;
    const [viewMode, setViewMode] = useState<VIEW_MODE>(VIEW_MODE.CARD);
    const [searchContent, setSearchContent] = useState<string>('');
    const [isOpen, setIsOpen] = useState(false);
    const openPanel = () => setIsOpen(true);
    const dismissPanel = () => setIsOpen(false);
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
                    <Input
                        placeholder="Search"
                        value={searchContent}
                        onChange={(event) => {
                            setSearchContent(event.target.value);
                        }}
                    />
                    <div>
                        <Button
                            variant={viewMode === VIEW_MODE.LIST ? 'secondary' : 'ghost'}
                            size="icon"
                            onClick={() => {
                                setViewMode(VIEW_MODE.LIST);
                            }}
                            title={intl.get('collection.viewMode.list')}
                            aria-label={intl.get('collection.viewMode.list')}
                        >
                            <RathIcon name="ViewList" />
                        </Button>
                        <Button
                            variant={viewMode === VIEW_MODE.CARD ? 'secondary' : 'ghost'}
                            size="icon"
                            onClick={() => {
                                setViewMode(VIEW_MODE.CARD);
                            }}
                            title={intl.get('collection.viewMode.card')}
                            aria-label={intl.get('collection.viewMode.card')}
                        >
                            <RathIcon name="SnapToGrid" />
                        </Button>
                    </div>
                    <Sheet open={isOpen} onOpenChange={(open) => !open && dismissPanel()}>
                        <SheetContent className="flex w-[480px] flex-col sm:max-w-none">
                            <SheetHeader>
                                <SheetTitle>Configuration Item</SheetTitle>
                            </SheetHeader>
                            <div className="flex-1">
                                {collectionConfig.map((item) => (
                                    <div key={item.key} style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
                                        <Label htmlFor={`collection-config-${item.key}`}>{item.title}</Label>
                                        <Input
                                            id={`collection-config-${item.key}`}
                                            value={configValue[item.key] || ''}
                                            onChange={(event) => {
                                                setConfigValue({
                                                    ...configValue,
                                                    [item.key]: event.target.value,
                                                });
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <SheetFooter>
                                <Button variant="outline" onClick={dismissPanel}>
                                    Cancel
                                </Button>
                                <Button
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
                                </Button>
                            </SheetFooter>
                        </SheetContent>
                    </Sheet>
                    {filteredColcList.length === 0 && (
                        <div role="status" className="rounded-lg border border-dashed bg-muted/20 px-6 py-12 text-center">
                            <RathIcon name={searchContent ? 'Search' : 'FavoriteStar'} size={28} className="mx-auto mb-3 text-muted-foreground" />
                            <h2 className="text-sm font-medium">{intl.get(searchContent ? 'collection.searchEmpty' : 'collection.emptyTitle')}</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {intl.get(searchContent ? 'collection.searchEmptyDescription' : 'collection.emptyDescription')}
                            </p>
                        </div>
                    )}
                    {filteredColcList.length > 0 && viewMode === VIEW_MODE.CARD && (
                        <CardView
                            metas={fieldMetas}
                            data={sampleData}
                            views={filteredColcList}
                            onConfig={onOpenKeyChange}
                            themeConfig={commonStore.themeConfig}
                        />
                    )}
                    {filteredColcList.length > 0 && viewMode === VIEW_MODE.LIST && (
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
