import { applyFilters, autoSet } from '@kanaries/loa';
import styled from 'styled-components';
import produce from 'immer';
import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import { ActionButton, DefaultButton, Dropdown, IconButton, IDropdownOption, Stack } from '@fluentui/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactVega from '../../components/react-vega';

import { IFieldMeta } from '../../interfaces';
import { distVis } from '../../queries/distVis';
import { useGlobalStore } from '../../store';
import Empty from './empty';
import { Pagination, Divider } from '@material-ui/core';
import VisErrorBoundary from '../../components/visErrorBoundary';
import { changeVisSize } from '../collection/utils';


const Segment = styled.div`
    display: flex;
    flex-wrap: wrap;
    overflow: hidden;
    > * {
        flex-grow: 1;
        flex-shrink: 1;
        overflow: hidden;
    }
    & nav > ul {
        display: flex;
        justify-content: space-between;
    }
`;

const CollectContainer = styled.div`
    display: flex;
    overflow: auto hidden;
    flex-grow: 0;
    height: max-content;
    > * {
        flex-shrink: 0;
        margin-right: 10px;
        border: 1px solid rgb(218, 220, 224);
        padding: 10px 12px 0 2px;
        &:last-child: {
            margin-right: 0;
        }
        cursor: copy;
        > * {
            pointer-events: none;
        }
    }
`;

const ResourceList = styled.div({
    margin: '0 0.6em 0.8em',
    padding: '0.8em 1em',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fff',
    boxShadow: '0 1.6px 3.6px 0 rgb(0 0 0 / 13%), 0 0.3px 0.9px 0 rgb(0 0 0 / 11%)',
});

const EditArea = styled.div({
    margin: '0 0.6em 2em',
    padding: '0.8em 1em',
    height: '80vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fff',
    boxShadow: '0 1.6px 3.6px 0 rgb(0 0 0 / 13%), 0 0.3px 0.9px 0 rgb(0 0 0 / 11%)',
});

const VIEW_NUM_IN_PAGE = 5;

const Kanban: React.FC = (props) => {
    const { collectionStore, dataSourceStore } = useGlobalStore();
    const { collectionList } = collectionStore;
    const { cleanedData, fieldMetas } = dataSourceStore;

    const [pageIndex, setPageIndex] = useState<number>(0);

    return collectionList.length === 0 ? (
        <Empty />
    ) : (
        <Segment>
            <ResourceList>
                <Pagination
                    style={{
                        margin: '0.8em 0.6em 0.5em',
                        width: 'unset',
                    }}
                    variant="outlined"
                    shape="rounded"
                    count={Math.ceil(collectionList.length / VIEW_NUM_IN_PAGE)}
                    page={pageIndex + 1}
                    onChange={(_, v) => {
                        setPageIndex(v - 1);
                    }}
                />
                <Divider style={{ marginBottom: '0.6em', marginTop: '0.6em' }} />
                <CollectContainer>
                    {collectionList.slice(pageIndex * VIEW_NUM_IN_PAGE, (pageIndex + 1) * VIEW_NUM_IN_PAGE).map((item, i) => (
                        <div key={item.viewId}>
                            <div className="c-vis">
                                <VisErrorBoundary>
                                    <ReactVega
                                        dataSource={applyFilters(cleanedData, item.filters)}
                                        spec={changeVisSize(item.spec, 160, 120)}
                                        actions={false}
                                    />
                                </VisErrorBoundary>
                            </div>
                        </div>
                    ))}
                </CollectContainer>
            </ResourceList>
            <EditArea></EditArea>
        </Segment>
    );
};

export default observer(Kanban);
