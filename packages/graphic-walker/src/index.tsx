import React from 'react';
import App, { EditorProps } from './App';
import { GlobalContextWrapper } from './store/index';

export const GraphicWalker: React.FC<EditorProps> = props => {
    return <GlobalContextWrapper>
      <App {...props} />
    </GlobalContextWrapper>
}
