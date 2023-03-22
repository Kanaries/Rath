import React, { useState, useEffect, useCallback } from 'react';
import { SearchBox } from '@fluentui/react/lib/SearchBox';
import { Pivot, PivotItem, PrimaryButton, Spinner, Stack } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { IFieldMeta, IPattern } from '@kanaries/loa';
import { useGlobalStore } from '../../../../store';
import { getEnhanceService } from '../../../../services/enhance';

interface NLQProps {
    onMainViewUpdate: (patt: IPattern) => void;
}
const NLQ: React.FC<NLQProps> = (props) => {
    const { onMainViewUpdate } = props;
    const { dataSourceStore } = useGlobalStore();
    const { fieldMetas } = dataSourceStore;
    const [augmentedEngineConnected, setAugmentedEngineConnected] = useState(false);
    const [searchContent, setSearchContent] = useState('');
    // const [searchResult, setSearchResult] = useState<any>('');
    const [pivotKey, setPivotKey] = useState('search');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch(getEnhanceService('/api/ping'))
            .then((res) => res.json())
            .then((res) => {
                if (res.success) {
                    setAugmentedEngineConnected(true);
                }
            });
    }, []);

    const searchHandler = useCallback(() => {
        setLoading(true);
        fetch(getEnhanceService('/api/nl2dvw'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: searchContent,
                metas: fieldMetas.map((m) => ({
                    fid: m.fid,
                    name: m.name,
                    semanticType: m.semanticType,
                    analyticType: m.analyticType,
                })),
            }),
        })
            .then((res) => res.json())
            .then((res) => {
                if (res.success) {
                    const result = res.data
                    // setSearchResult(res.data);
                    if (result instanceof Array) {
                        const patt: IPattern = {
                            fields: result.map((r) => fieldMetas.find((m) => m.fid === r)!).filter((f) => Boolean(f)) as IFieldMeta[],
                            imp: 0,
                        };
                        // semiAutoStore.updateMainView(patt);
                        onMainViewUpdate(patt);
                    }
                }
            })
            .finally(() => {
                setLoading(false);
            });
    }, [fieldMetas, searchContent, onMainViewUpdate]);
    return (
        <div>
            <Pivot
                selectedKey={pivotKey}
                onLinkClick={(item) => {
                    setPivotKey(item?.props.itemKey! ?? 'raw');
                }}
            >
                <PivotItem headerText="Search" itemKey="search" />
                <PivotItem headerText="QA" itemKey="raw" />
            </Pivot>
            {pivotKey === 'search' && (
                <Stack horizontal>
                    <Stack.Item grow>
                        <SearchBox
                            onSearch={(newValue) => {
                                setSearchContent(newValue);
                            }}
                            onChange={(e, newValue) => {
                                setSearchContent(newValue + '');
                            }}
                            disabled={!augmentedEngineConnected}
                        />
                    </Stack.Item>
                    <Stack.Item>
                        <PrimaryButton disabled={!augmentedEngineConnected} onClick={searchHandler}>
                            Ask {loading && <Spinner label='Asking' />}
                        </PrimaryButton>
                    </Stack.Item>
                    {/* <div>{JSON.stringify(searchResult, null, 2)}</div> */}
                </Stack>
            )}
        </div>
    );
};

export default observer(NLQ);
