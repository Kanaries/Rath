import React from 'react';
import styled from 'styled-components';
import ReactVega from '../../../components/react-vega';
import ViewInfo from '../../../components/viewInfo/textInfo';
import { IFieldMeta, IInsightVizView, IRow } from '../../../interfaces';
import VisErrorBoundary from '../../../visBuilder/visErrorBoundary';
import { changeVisSize } from '../utils';

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
    return (
        <CollectContainer>
            {views.map((item, i) => (
                <div className="chart-container" key={item.viewId}>
                    <div className="c-vis">
                    <VisErrorBoundary>
                        <ReactVega dataSource={data} spec={changeVisSize(item.spec, 200, 180)} actions={false} />
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

export default CardView;
