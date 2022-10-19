import React, { useState } from 'react';
import styled from 'styled-components';
import { applyFilters } from '@kanaries/loa';
import { Divider, Pagination } from '@material-ui/core';
import ReactVega from '../../../components/react-vega';
import VisErrorBoundary from '../../../components/visErrorBoundary';
import { IFieldMeta, IInsightVizView, IRow } from '../../../interfaces';
import { changeVisSize, VIEW_NUM_IN_PAGE } from '../utils';
import ViewInfo from '../../../components/viewInfo/pillInfo';

const CollectContainer = styled.div`
    .seg-header {
        font-size: 3em;
        font-weight: 500;
    }
    .chart-container {
        border: 1px solid rgb(218, 220, 224);
        border-radius: 1em;
        padding: 1em;
        margin: 1em;
        display: flex;
        .c-vis {
            flex-shrink: 0;
            flex-grow: 0;
        }
        .c-desc {
            flex-direction: 1;
            flex-grow: 1;
            border-left: 1px solid rgb(218, 220, 224);
            margin-left: 1em;
            padding-left: 1em;
        }
    }
`;

interface ListViewProps {
    data: IRow[];
    metas: IFieldMeta[];
    views: IInsightVizView[];
}
const ListView: React.FC<ListViewProps> = (props) => {
    const { data, views, metas } = props;
    const [pageIndex, setPageIndex] = useState<number>(0);
    return (
        <div>
            <Pagination
                style={{ marginTop: '1em', marginLeft: '1em' }}
                variant="outlined"
                shape="rounded"
                count={Math.ceil(views.length / VIEW_NUM_IN_PAGE)}
                page={pageIndex + 1}
                onChange={(e, v) => {
                    setPageIndex(v - 1);
                }}
            />
            <Divider style={{ marginBottom: '1em', marginTop: '1em' }} />
            <CollectContainer>
                {views.slice(pageIndex * VIEW_NUM_IN_PAGE, (pageIndex + 1) * VIEW_NUM_IN_PAGE).map((item, i) => (
                    <div className="chart-container" key={item.viewId}>
                        <div className="c-vis">
                            <VisErrorBoundary>
                                <ReactVega
                                    dataSource={applyFilters(data, item.filters)}
                                    spec={changeVisSize(item.spec, 320, 220)}
                                    actions={false}
                                />
                            </VisErrorBoundary>
                        </div>
                        <div className="c-desc">
                            <ViewInfo
                                metas={metas}
                                fields={item.fields}
                                filters={item.filters}
                            />
                        </div>
                    </div>
                ))}
            </CollectContainer>
        </div>
    );
};

export default ListView;
