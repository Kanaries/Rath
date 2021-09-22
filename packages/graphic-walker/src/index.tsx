import React from 'react';
import App, { EditorProps } from './App';
import { StoreWrapper } from './store/index';

export const GraphicWalker: React.FC<EditorProps> = props => {
    return <StoreWrapper>
        <App {...props} />
    </StoreWrapper>
}
