import React from 'react';
import styled from 'styled-components';
import ReactVega from '../../../components/react-vega';
import VisErrorBoundary from '../../../visBuilder/visErrorBoundary';
import { IFieldMeta, IInsightVizView, IRow } from '../../../interfaces';
import { changeVisSize } from '../utils';
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
        .c-vis{
            flex-shrink: 0;
            flex-grow: 0;
        }
        .c-desc{
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
    return (
        <CollectContainer>
            {views.map((item, i) => (
                <div className="chart-container" key={item.viewId}>
                    <div className="c-vis">
                    <VisErrorBoundary>
                        <ReactVega dataSource={data} spec={changeVisSize(item.spec, 320, 220)} actions={false} />
                    </VisErrorBoundary>
                    </div>
                    <div className="c-desc">
                        <ViewInfo
                            metas={metas}
                            fields={item.fields}
                            // filters={item.fil}
                        />
                    </div>
                </div>
            ))}
        </CollectContainer>
    );
};

export default ListView;
