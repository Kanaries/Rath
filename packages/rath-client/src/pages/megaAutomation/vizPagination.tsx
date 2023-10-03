import { Icon, SearchBox } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { IFieldMeta } from '../../interfaces';
import { useGlobalStore } from '../../store';
import { searchFilterView } from '../../utils';
import { usePagination } from '../../components/pagination/hooks';

const VizCard = styled.div<{ selected?: boolean }>`
    overflow: hidden;
    padding: 12px;
    margin: 12px 2px 2px 2px;
    border: 1px solid ${(props) => (props.selected ? '#faad14' : 'rgba(0, 0, 0, 0.23)')};
    color: #434343;
    border-radius: 4px;
    display: flex;
    cursor: pointer;
    justify-content: center;
    align-items: center;
`;

const VizCardContainer = styled.div`
    display: flex;
    overflow-x: auto;
`;

const VizPagination: React.FC = (props) => {
    const { megaAutoStore } = useGlobalStore();
    const { insightSpaces, fieldMetas, pageIndex } = megaAutoStore;
    const [searchContent, setSearchContent] = useState<string>('');
    const updatePage = useCallback(
        (e: any, v: number) => {
            megaAutoStore.emitViewChangeTransaction((v - 1) % insightSpaces.length);
        },
        [megaAutoStore, insightSpaces.length]
    );

    const insightViews = useMemo(() => {
        return insightSpaces.map((space, i) => {
            const fields = space.dimensions
                .concat(space.measures)
                .map((f) => fieldMetas.find((fm) => fm.fid === f))
                .filter((f) => Boolean(f)) as IFieldMeta[];

            return {
                id: i,
                fields,
                filters: [],
            };
        });
    }, [fieldMetas, insightSpaces]);

    const searchedInsightViews = useMemo(() => {
        return searchFilterView(searchContent, insightViews);
    }, [searchContent, insightViews]);

    const { items } = usePagination({
        count: searchedInsightViews.length,
        siblingCount: 1,
        page: pageIndex + 1,
        onChange: updatePage,
    });

    return (
        <div>
            <SearchBox onSearch={setSearchContent} placeholder={intl.get('common.search.searchViews')} iconProps={{ iconName: 'Search' }} />
            <VizCardContainer>
                {searchedInsightViews.length > 0 &&
                    items.map(({ page, type, selected, ...item }, index) => {
                        let children = null;
                        if (type === 'start-ellipsis' || type === 'end-ellipsis') {
                            children = '…';
                        } else if (type === 'page') {
                            children = (
                                <div
                                    style={{
                                        fontWeight: selected ? 'bold' : undefined,
                                    }}
                                    {...item}
                                >
                                    {page}
                                </div>
                            );
                        } else {
                            if (type === 'next') children = <Icon style={{ fontSize: '1em', fontWeight: 600 }} iconName="ChevronRight" />;
                            if (type === 'previous') children = <Icon style={{ fontSize: '1em', fontWeight: 600 }} iconName="ChevronLeft" />;
                        }
                        return (
                            <VizCard {...item} selected={selected} key={index}>
                                {children}
                            </VizCard>
                        );
                    })}
            </VizCardContainer>
        </div>
    );
};

export default observer(VizPagination);
