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

import { FC, useCallback, useId, useMemo, useRef } from 'react';
import intl from 'react-intl-universal';
import styled from 'styled-components';
import { FileTypeIcon } from '../../components/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
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

const ITEM_MIN_WIDTH = 320;

const DemoData: FC<DemoDataProps> = props => {
    const { onDataLoaded, onClose, onStartLoading, onLoadingFailed } = props;
    const options = useDemoDataOptions();

    const loadDemo = useCallback((demo: typeof options[number]) => {
        onStartLoading();
        requestDemoData(demo.key).then(data => {
            const { dataSource, fields } = data;
            onDataLoaded(fields, dataSource, `${demo.text}.${RathDemoVirtualExt}`, DataSourceTag.DEMO);
        }).catch((err) => {
            onLoadingFailed(err);
        })
        onClose();
    }, [onClose, onDataLoaded, onLoadingFailed, onStartLoading]);

    const labelId = `demo-ds-${useId().replace(/:/g, '')}`;

    const listRef = useRef<HTMLDivElement>(null);
    const { width } = useBoundingClientRect(listRef, { width: true });
    const colCount = useMemo(() => Math.floor((width ?? (window.innerWidth * 0.6)) / ITEM_MIN_WIDTH), [width]);

    return (
        <Container>
            <Label id={labelId}>{intl.get("dataSource.importData.demo.available")}</Label>
            <List role="grid" ref={listRef} aria-colcount={colCount || 1} style={{ gridTemplateColumns: `repeat(${colCount || 1}, 1fr)` }}>
                {options.map((demo, i) => {
                    return (
                        <Card
                            key={demo.key}
                            role="gridcell"
                            aria-rowindex={Math.floor(i / colCount) + 1}
                            aria-colindex={(i % colCount) + 1}
                            tabIndex={0}
                            className="cursor-pointer transition-colors hover:bg-accent/40"
                            onClick={() => loadDemo(demo)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    loadDemo(demo);
                                }
                            }}
                        >
                            <CardHeader className="flex-row items-center gap-3 space-y-0">
                                <FileTypeIcon type={getFileIcon('')} />
                                <div className="min-w-0">
                                    <CardTitle className="text-sm">{intl.get(`dataSource.demoDataset.${demo.key}.title`)}</CardTitle>
                                    <CardDescription className="text-xs">{intl.get(`dataSource.sizeInfo`, demo)}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="m-0 text-sm">{intl.get(`dataSource.demoDataset.${demo.key}.description`)}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </List>
        </Container>
    );
}

export default DemoData;
