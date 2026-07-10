/* eslint-disable import/first */
import 'buffer';
// import { Buffer } from 'buffer';
// @ts-ignore
// if (window.Buffer === undefined) window.Buffer = Buffer;

import React from 'react';

import { createRoot } from 'react-dom/client';
import { inject } from '@vercel/analytics';

import './styles/tokens.css';
import './index.css';
// @ts-ignore
// eslint-disable-next-line import/first
import App from './App';
import { TooltipProvider } from './components/ui/tooltip';

inject();

const root = createRoot(document.getElementById('root')!);

root.render(
    <TooltipProvider>
        <App />
    </TooltipProvider>
);
