import React from 'react';
import App, { EditorProps } from './App';
import { StoreWrapper } from './store/index';
import { FieldsContextWrapper } from './fields/fieldsContext';

export const GraphicWalker: React.FC<EditorProps> = props => {
    return <StoreWrapper>
        <FieldsContextWrapper>
            <App {...props} />
        </FieldsContextWrapper>
    </StoreWrapper>
}
