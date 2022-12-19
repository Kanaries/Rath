import { Modal } from '@fluentui/react';
import React from 'react';
import intl from 'react-intl-universal';
import MonacoEditor from 'react-monaco-editor';
import styled from 'styled-components';

const Container = styled.div`
    padding: 3em;
    max-height: 500px;
    overflow-y: auto;
`;

interface SubinsightProps {
    data: any;
    show: boolean;
    onClose: () => void;
}

const SubinsightSegment: React.FC<SubinsightProps> = (props) => {
    return (
        <Modal isOpen={props.show} onDismiss={props.onClose}>
            <Container>
                <h2>{intl.get('megaAuto.subinsights')}</h2>
                <MonacoEditor width="600" height="300" language="json" theme="vs" value={JSON.stringify(props.data, null, 2)} />
            </Container>
        </Modal>
    );
};

export default SubinsightSegment;
