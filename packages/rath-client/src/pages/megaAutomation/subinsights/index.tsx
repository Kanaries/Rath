import React from 'react';
import intl from 'react-intl-universal';
import MonacoEditor from '../../../components/themed-monaco-editor';
import styled from 'styled-components';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';

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
        <Dialog
            open={props.show}
            onOpenChange={(open) => {
                if (!open) {
                    props.onClose();
                }
            }}
        >
            <DialogContent className="max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>{intl.get('megaAuto.subinsights')}</DialogTitle>
                </DialogHeader>
                <Container>
                    <MonacoEditor width="600" height="300" language="json" theme="vs" value={JSON.stringify(props.data, null, 2)} />
                </Container>
            </DialogContent>
        </Dialog>
    );
};

export default SubinsightSegment;
