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
import 'office-ui-fabric-core/dist/css/fabric.css';
import './index.css';

// @ts-ignore
// eslint-disable-next-line import/first
import App from './App';
import { mainTheme } from './theme';

inject();

// @ts-ignore
// window.Buffer = Buffer.Buffer;
// console.log('buffer', Buffer)
initializeIcons();

ReactDOM.render(
    <ThemeProvider theme={mainTheme}>
        <App />
    </ThemeProvider>,
    document.getElementById('root')
);
