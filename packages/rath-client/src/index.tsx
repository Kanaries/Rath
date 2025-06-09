/* eslint-disable import/first */
import 'buffer';
// import { Buffer } from 'buffer';
// @ts-ignore
// if (window.Buffer === undefined) window.Buffer = Buffer;

import React from 'react';

import ReactDOM from 'react-dom';
import { initializeIcons } from '@fluentui/font-icons-mdl2';
import { ThemeProvider } from '@fluentui/react';
import { inject } from '@vercel/analytics';

// import 'office-ui-fabric-core/dist/css/fabric.css'; // Deprecated - commenting out to avoid CDN issues
import './index.css';
import { FluentProvider } from '@fluentui/react-components';
// @ts-ignore
// eslint-disable-next-line import/first
import App from './App';
import { customLightTheme, mainTheme } from './theme';

inject();

// Fix for deprecated Fluent UI CDN - use local/npm-based icons instead of CDN
initializeIcons(/* baseUrl */ undefined, { disableWarnings: true });

ReactDOM.render(
    <ThemeProvider theme={mainTheme}>
        <FluentProvider theme={customLightTheme}>
            <App />
        </FluentProvider>
    </ThemeProvider>,
    document.getElementById('root')
);
