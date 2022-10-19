import { applyFilters } from '@kanaries/loa';
import React, { useState } from 'react';
import styled from 'styled-components';
import { Divider, Pagination } from '@material-ui/core';
import ReactVega from '../../../components/react-vega';
import ViewInfo from '../../../components/viewInfo/textInfo';
import { IFieldMeta, IInsightVizView, IRow } from '../../../interfaces';
import VisErrorBoundary from '../../../components/visErrorBoundary';
import { changeVisSize, VIEW_NUM_IN_PAGE } from '../utils';

const CollectContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    .seg-header {
        font-size: 3em;
        font-weight: 500;
    }
    .chart-container {
        border: 1px solid rgb(218, 220, 224);
        border-radius: 1em;
        padding: 1em;
        margin: 0.5em;
    }
`;

interface CardViewProps {
    data: IRow[];
    metas: IFieldMeta[];
    views: IInsightVizView[];
}
const CardView: React.FC<CardViewProps> = (props) => {
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
                                    spec={changeVisSize(item.spec, 200, 180)}
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

export default CardView;
