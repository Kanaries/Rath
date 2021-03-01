import React from 'react';
import App, { EditorProps } from './App';
import { GlobalContextWrapper } from './store/index';

const Editor: React.FC<EditorProps> = props => {
    return <GlobalContextWrapper>
      <App {...props} />
    </GlobalContextWrapper>
}

export default Editor;
