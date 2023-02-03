import React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore, webpack may fail to find the declaration
import ReactDOM from 'react-dom/client';
import { FluentProvider, teamsLightTheme } from '@fluentui/react-components';
import App from './App';

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);
root.render(
    <React.StrictMode>
        <FluentProvider theme={teamsLightTheme}>
            <App />
        </FluentProvider>
    </React.StrictMode>
);
