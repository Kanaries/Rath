import React, { useState } from 'react';
import styled from 'styled-components';
import { applyFilters } from '@kanaries/loa';
import { Pagination } from '@material-ui/core';
import ReactVega from '../../../components/react-vega';
import VisErrorBoundary from '../../../components/visErrorBoundary';
import { IFieldMeta, IInsightVizView, IRow } from '../../../interfaces';
import { changeVisSize, VIEW_NUM_IN_PAGE } from '../utils';
import ViewInfo from '../../../components/viewInfo/pillInfo';
import { VegaThemeConfig } from '../../../queries/themes/config';

const CollectContainer = styled.div`
    .seg-header {
        font-size: 3em;
        font-weight: 500;
    }
`;

const ItemContainer = styled.div`
    background-color: #fff;
    box-shadow: 0 0.6px 2px rgb(218, 220, 224);
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
    & .title {
        display: flex;
        justify-content: center;
        font-size: 1.05rem;
        font-weight: 550;
        margin-bottom: 1em;
    }
    & .desc {
        width: 100%;
        color: #444;
        font-size: 0.98rem;
    }
    cursor: pointer;
`;

interface ListViewProps {
    data: IRow[];
    metas: IFieldMeta[];
    views: IInsightVizView[];
    onConfig: (data: IInsightVizView) => void;
    themeConfig?: VegaThemeConfig;
}
const ListView: React.FC<ListViewProps> = (props) => {
    const { data, views, metas, onConfig, themeConfig } = props;
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
            <hr style={{ marginBlock: '1.2em', border: 'none' }} />
            <CollectContainer>
                {views.slice(pageIndex * VIEW_NUM_IN_PAGE, (pageIndex + 1) * VIEW_NUM_IN_PAGE).map((item, i) => (
                    <ItemContainer
                        key={item.viewId}
                        onClick={() => {
                            onConfig(item);
                        }}
                    >
                        <div className="c-vis">
                            <div className="title">{item.title}</div>
                            <VisErrorBoundary>
                                <ReactVega
                                    dataSource={applyFilters(data, item.filters)}
                                    spec={changeVisSize(item.spec, 320, 220)}
                                    actions={false}
                                    config={themeConfig}
                                />
                            </VisErrorBoundary>
                        </div>
                        <div className="c-desc">
                            <div className="desc">{item.desc}</div>
                            <ViewInfo metas={metas} fields={item.fields} filters={item.filters} />
                        </div>
                    </ItemContainer>
                ))}
            </CollectContainer>
        </div>
    );
};

export default ListView;
