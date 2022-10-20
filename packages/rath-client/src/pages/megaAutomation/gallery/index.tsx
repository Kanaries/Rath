import { observer } from 'mobx-react-lite';
import React from 'react';
import styled from 'styled-components';
import ReactVega from '../../../components/react-vega';
import { useGlobalStore } from '../../../store';
import VisErrorBoundary from '../../../visBuilder/visErrorBoundary';

const GalleryCard = styled.div`
    padding: 1em;
    margin: 1em;
    border: 1px solid red;
    border-radius: 4px;
`
const Gallery: React.FC = props => {
    const { megaAutoStore } = useGlobalStore();
    const { dataSource, gallerySpecList, visualConfig } = megaAutoStore;
    return <div>
        {
            gallerySpecList.map((spec, i) => <GalleryCard key={`s-${i}`}>
                <VisErrorBoundary>
                <ReactVega
                    dataSource={dataSource}
                    spec={spec}
                    actions={visualConfig.debug}
                />
            </VisErrorBoundary>
            </GalleryCard>)
        }
    </div>
}

export default observer(Gallery);
