import { Modal } from '@fluentui/react';
import React from 'react';
import ReactJson from 'react-json-view';
import intl from 'react-intl-universal'
import styled from 'styled-components'

const Container = styled.div`
    padding: 3em;
    max-height: 500px;
    overflow-y: auto;
`

interface SubinsightProps {
    data: any
    show: boolean;
    onClose: () => void;
}

const SubinsightSegment: React.FC<SubinsightProps> = props => {
    return <Modal isOpen={props.show} onDismiss={props.onClose}>
        <Container>
            <h2>{intl.get('megaAuto.subinsights')}</h2>
            <ReactJson src={props.data} displayDataTypes={false} />
        </Container>
    </Modal>
}

export default SubinsightSegment;