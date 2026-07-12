import isPropValid from '@emotion/is-prop-valid';
import { GraphicWalker } from '@kanaries/graphic-walker';
import '@kanaries/graphic-walker/dist/style.css';
import { createRoot } from 'react-dom/client';
import { StyleSheetManager } from 'styled-components';

const dataSource = [
    { category: 'A', value: 12, date: '2026-01-01' },
    { category: 'B', value: 20, date: '2026-01-02' },
    { category: 'C', value: 8, date: '2026-01-03' },
];

const rawFields = [
    { fid: 'category', name: 'Category', semanticType: 'nominal', analyticType: 'dimension' },
    { fid: 'value', name: 'Value', semanticType: 'quantitative', analyticType: 'measure' },
    { fid: 'date', name: 'Date', semanticType: 'temporal', analyticType: 'dimension' },
] as const;

createRoot(document.getElementById('root')!).render(
    <StyleSheetManager shouldForwardProp={(prop, target) => typeof target !== 'string' || isPropValid(prop)}>
        <GraphicWalker dataSource={dataSource} rawFields={rawFields} fieldKeyGuard={false} keepAlive dark="light" themeKey="g2" />
    </StyleSheetManager>
);
