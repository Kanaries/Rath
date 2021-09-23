import React from 'react';
import App, { EditorProps } from './App';
import { StoreWrapper } from './store/index';
import "tailwindcss/tailwind.css"
import './index.css'

export const GraphicWalker: React.FC<EditorProps> = props => {
    return <StoreWrapper>
        <App {...props} />
    </StoreWrapper>
}
