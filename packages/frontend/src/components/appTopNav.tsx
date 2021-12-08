import React from 'react';
import { Pivot, PivotItem } from 'office-ui-fabric-react';
import { observer } from 'mobx-react-lite'
import intl from 'react-intl-universal';

import UserSettings from './userSettings';

import { PIVOT_KEYS } from '../constants';
import { useGlobalStore } from '../store';

interface AppTopNavProps { }
const AppTopNav: React.FC<AppTopNavProps> = props => {
    const { langStore, commonStore } = useGlobalStore()

    const { appKey } = commonStore;

    let pivotKeys: string[] = [
        PIVOT_KEYS.dataSource,
        PIVOT_KEYS.lts,
        PIVOT_KEYS.editor,
        PIVOT_KEYS.dashBoard,
        PIVOT_KEYS.noteBook,
        PIVOT_KEYS.gallery,
        PIVOT_KEYS.explainer,
        PIVOT_KEYS.support
    ]

    let pivotList = pivotKeys.map((page, index) => {
        return { title: page, itemKey: page }
    })

    if (langStore.loaded && langStore.lang) {
        pivotList = pivotKeys.map(p => intl.get(`menu.${p}`))
            .map((page, index) => {
                return { title: page, itemKey: pivotKeys[index] }
            })
    }
    return <div>
        <div className="header-bar">
            <div className="ms-Grid-row" dir="ltr">
                <div className="ms-Grid-col ms-sm6 ms-md4 ms-lg1">
                    <a
                        // onClick={() => { window.location.reload(false); }}
                        href="https://github.com/Kanaries/Rath"
                        className="logo"
                    >
                        <img
                            style={{ width: '38px', marginTop: '4px' }}
                            src="./assets/kanaries-lite.png"
                            alt="rath"
                        />
                    </a>
                </div>
                <div className="ms-Grid-col ms-sm6 ms-md8 ms-lg8">
                    <Pivot
                        selectedKey={appKey}
                        onLinkClick={(item) => {
                            item &&
                                item.props.itemKey &&
                                commonStore.setAppKey(item.props.itemKey)
                        }}
                        headersOnly={true}
                    >
                        {pivotList.map((pivot) => (
                            <PivotItem key={pivot.itemKey} headerText={pivot.title} itemKey={pivot.itemKey} />
                        ))}
                    </Pivot>
                </div>
                <div className="ms-Grid-col ms-sm6 ms-md8 ms-lg3">
                    <div className="header-toolbar">
                        <UserSettings />
                    </div>
                </div>
            </div>
        </div>
    </div>
}

export default observer(AppTopNav);
