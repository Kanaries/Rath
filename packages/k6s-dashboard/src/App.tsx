import type { FC } from 'react';
import type { DashboardSpecification } from './interfaces';
import { DashboardEditor } from './editor';
import { themeGold } from './theme';


const App: FC = () => {
    const dashboard: DashboardSpecification = {
        version: 1,
        title: 'My Dashboard',
        size: {
            width: 1080,
            height: 1920,
            padding: 80,
            spacing: 40,
        },
        config: {
            themes: [themeGold],
        },
        items: {
            id: 'root',
            type: 'layout',
            direction: 'vertical',
            children: [],
        },
    };

    return (
        <div style={{ width: 'calc(100vw - 16px)', height: 'calc(100vh - 16px)', overflow: 'hidden' }}>
            <DashboardEditor dashboard={dashboard} />
        </div>
    );
};


export default App;
