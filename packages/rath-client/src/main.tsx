import { Fragment } from 'react';
import { createRoot } from 'react-dom/client';
import { inject } from '@vercel/analytics';
import isPropValid from '@emotion/is-prop-valid';
import { StyleSheetManager, ThemeProvider as StyledThemeProvider } from 'styled-components';

import './index.css';
import App from './App';
import { TooltipProvider } from './components/ui/tooltip';
import type { RathBootstrapPlugin } from './bootstrap';
import { AppearanceProvider, useAppearance } from './appearance';

function ThemedApplication() {
    const appearance = useAppearance();
    return (
        <StyledThemeProvider theme={appearance}>
            <TooltipProvider>
                <App />
            </TooltipProvider>
        </StyledThemeProvider>
    );
}

export function mountRathApplication(plugin?: RathBootstrapPlugin): void {
    inject();

    const container = document.getElementById('root');
    if (!container) throw new Error('Rath root element was not found.');

    const Providers = plugin?.providers ?? Fragment;
    const root = createRoot(container);

    root.render(
        <Providers>
            <StyleSheetManager shouldForwardProp={(prop, target) => typeof target !== 'string' || isPropValid(prop)}>
                <AppearanceProvider>
                    <ThemedApplication />
                </AppearanceProvider>
            </StyleSheetManager>
        </Providers>
    );
}
