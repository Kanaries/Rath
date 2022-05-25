import { useState, FC } from 'react'
import { observer } from 'mobx-react-lite'
import { Pivot, PivotItem } from '@fluentui/react'
import { IPageKey } from './interfaces'
import { useGlobalStore } from './store'
import CreateDatasetPage from './pages/createDataset'

import './App.css'

const App: FC = () => {
    const [count, setCount] = useState(0)
    const { dataSourceStore } = useGlobalStore();
    const { pageKey } = dataSourceStore

    return (
        <div className="App">
            <Pivot onLinkClick={(item) => {
                item && item.props.itemKey && dataSourceStore.setPageKey(item.props.itemKey as IPageKey)
            }}>
                <PivotItem headerText="Create" itemKey={IPageKey.CREATE} />
                <PivotItem headerText="List" itemKey={IPageKey.LIST} />
            </Pivot>
            {
                pageKey === IPageKey.CREATE && <CreateDatasetPage />
            }
            <header className="App-header">
                <p>Hello Vite + React!</p>
                <p>
                    <button type="button" onClick={() => setCount((count) => count + 1)}>
                        count is: {count}
                    </button>
                </p>
                <p>
                    Edit <code>App.tsx</code> and save to test HMR updates.
                </p>
                <p>
                    <a
                        className="App-link"
                        href="https://reactjs.org"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Learn React
                    </a>
                    {' | '}
                    <a
                        className="App-link"
                        href="https://vitejs.dev/guide/features.html"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Vite Docs
                    </a>
                </p>
            </header>
        </div>
    )
}

export default observer(App)
