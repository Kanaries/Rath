// Copyright (C) 2023 observedobserver
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { Icon, Label } from '@fluentui/react';
import { FC, useCallback, useMemo, useRef } from 'react';
import { useId } from "@fluentui/react-hooks";
import intl from 'react-intl-universal';
import styled from 'styled-components';
import { logDataImport } from '../../loggers/dataImport';
import { IDatasetBase, IMuteFieldBase, IRow } from '../../interfaces';
import { DEMO_DATA_REQUEST_TIMEOUT } from '../../constants';
import { DataSourceTag, IDBMeta } from '../../utils/storage';
import { DemoDataAssets, IDemoDataKey, useDemoDataOptions } from '../dataSource/config';
import useBoundingClientRect from '../../hooks/use-bounding-client-rect';
import getFileIcon from './history/get-file-icon';

interface DemoDataProps {
    onClose: () => void;
    onStartLoading: () => void;
    onLoadingFailed: (err: any) => void;
    onDataLoaded: (fields: IMuteFieldBase[], dataSource: IRow[], name: string, tag: DataSourceTag, withHistory?: IDBMeta | undefined) => void;
}

function valueFix (ds: IDatasetBase): IDatasetBase {
    for (let field of ds.fields) {
        if (typeof field.analyticType !== 'string') field.analyticType = 'dimension';
        if (typeof field.semanticType !== 'string') field.semanticType = 'nominal';
        if (typeof field.geoRole !== 'string') field.geoRole = 'none';
    }
    return ds;
}

function requestDemoData (dsKey: IDemoDataKey = 'CARS'): Promise<IDatasetBase> {
    return new Promise<IDatasetBase>((resolve, reject) => {
        const assetUrl = DemoDataAssets[dsKey];
        let isTimeout = false;
        setTimeout(() => {
            isTimeout = true;
        }, DEMO_DATA_REQUEST_TIMEOUT)
        fetch(assetUrl).then(res => res.json())
            .then(res => {
                if (!isTimeout) {
                    resolve(valueFix(res as IDatasetBase))
                } else {
                    reject('Demo Data Request Timeout.')
                }
            })
            .catch(err => reject(err));
    })
    // const assetUrl = DemoDataAssets[dsKey];
    // try {
    //     const res = await fetch(assetUrl);
    //     const { dataSource, fields } = await res.json();
    //     return { dataSource, fields };
    // } catch (error) {
    //     console.error(error)
    //     return {
    //         dataSource: [],
    //         fields: []
    //     }
    // }
}

export const RathDemoVirtualExt = 'rath-demo.json';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    > label {
        width: 100%;
    }
`;

const List = styled.div`
    margin: 1em 0;
    overflow: hidden auto;
    display: grid;
    gap: 0.4em;
    grid-auto-rows: max-content;
`;

const ListItem = styled.div`
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: 100%;
    padding: 1.2em 1em 1em 1.4em;
    border-radius: 2px;
    position: relative;
    box-shadow: inset 0 0 2px #8881;
    > .head {
        display: flex;
        align-items: flex-start;
        > i {
            flex-grow: 0;
            flex-shrink: 0;
            width: 2em;
            height: 2em;
            margin-right: 0.8em;
            user-select: none;
        }
        > div {
            flex-grow: 1;
            flex-shrink: 1;
            flex-basis: 0;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            > header {
                font-size: 0.8rem;
                line-height: 1.2em;
                font-weight: 550;
                color: #111;
                margin-bottom: 0.4em;
            }
            > span {
                word-break: break-all;
                line-height: 1.2em;
                margin: 0.12em 0;
            }
        }
    }
    :hover {
        background-color: #8881;
    }
    cursor: pointer;
`;

const ITEM_MIN_WIDTH = 240;

const DemoData: FC<DemoDataProps> = props => {
    const { onDataLoaded, onClose, onStartLoading, onLoadingFailed } = props;
    const options = useDemoDataOptions();

    const loadDemo = useCallback((demo: typeof options[number]) => {
        onStartLoading();
        requestDemoData(demo.key).then(data => {
            const { dataSource, fields } = data;
            onDataLoaded(fields, dataSource, `${demo.text}.${RathDemoVirtualExt}`, DataSourceTag.DEMO);
            logDataImport({
                dataType: "Demo",
                name: demo.key,
                fields,
                dataSource: [],
                size: dataSource.length,
            });
        }).catch((err) => {
            onLoadingFailed(err);
        })
        onClose();
    }, [onClose, onDataLoaded, onLoadingFailed, onStartLoading]);

    const labelId = useId('demo-ds');

    const listRef = useRef<HTMLDivElement>(null);
    const { width } = useBoundingClientRect(listRef, { width: true });
    const colCount = useMemo(() => Math.floor((width ?? (window.innerWidth * 0.6)) / ITEM_MIN_WIDTH), [width]);

    return (
        <Container>
            <Label id={labelId}>{intl.get("dataSource.importData.demo.available")}</Label>
            <List role="grid" ref={listRef} aria-colcount={colCount || 1} style={{ gridTemplateColumns: `repeat(${colCount || 1}, 1fr)` }}>
                {options.map((demo, i) => {
                    return (
                        <ListItem
                            key={i}
                            role="gridcell"
                            aria-rowindex={Math.floor(i / colCount) + 1}
                            aria-colindex={(i % colCount) + 1}
                            tabIndex={0}
                            onClick={() => loadDemo(demo)}
                        >
                            <div className="head">
                                <Icon iconName={getFileIcon('')} />
                                <div>
                                    <header>
                                        <span>{intl.get(`dataSource.demoDataset.${demo.key}.title`)}</span>
                                    </header>
                                    <span className="state-description">
                                        {intl.get(`dataSource.demoDataset.${demo.key}.description`)}
                                    </span>
                                    <span className="state-description">
                                        {intl.get(`dataSource.sizeInfo`, demo)}
                                    </span>
                                </div>
                            </div>
                        </ListItem>
                    );
                })}
            </List>
        </Container>
    );
}

export default DemoData;
