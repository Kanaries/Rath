import { DefaultButton, Label, PrimaryButton, Spinner, SpinnerSize, Stack, Toggle } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactVega from '../../../components/react-vega';
import { IFieldMeta, IRow, IVegaSubset } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import { deepcopy } from '../../../utils';
import { LABEL_FIELD_KEY } from '../constants';
import { nnMic } from '../utils';

const LoadingLayer = styled.div`
    position: absolute;
    z-index: 99;
    background-color: rgba(255, 255, 255, 0.88);
    top: 0px;
    left: 0px;
    right: 0px;
    bottom: 0px;
    display: flex;
    justify-content: center;
    .cont{
        margin-top: 1em;
    }
`

interface NALProps {
    vizSpec: IVegaSubset;
    dataSource: IRow[];
    fieldMetas: IFieldMeta[];
}
const NeighborAutoLink: React.FC<NALProps> = (props) => {
    const { vizSpec, dataSource, fieldMetas } = props;
    const { painterStore } = useGlobalStore();
    const { linkTrigger, painting, autoLink } = painterStore
    const [nearFields, setNearFields] = useState<IFieldMeta[]>([]);
    const [nearIndex, setNearIndex] = useState<number>(0);
    const nearSpec = useMemo<IVegaSubset | null>(() => {
        if (nearFields.length > 0) {
            const mvd: any = {
                ...deepcopy(vizSpec),
                data: {
                    name: 'dataSource',
                    // values: mutData
                },
            };
            mvd.encoding.color = {
                field: nearFields[nearIndex].fid,
                type: nearFields[nearIndex].semanticType,
                title: nearFields[nearIndex].name || nearFields[nearIndex].fid,
            };
            return mvd;
        }
        return null;
    }, [vizSpec, nearFields, nearIndex]);

    const getNearFields = useCallback(
        (data: IRow[]) => {
            const X = data.map((r) => r[LABEL_FIELD_KEY]);
            const ans: { field: IFieldMeta; score: number }[] = [];
            for (let field of fieldMetas) {
                // eslint-disable-next-line no-constant-condition
                if (true) {
                    const Y = data.map((r) => r[field.fid]);
                    const score = nnMic(X, Y);
                    ans.push({
                        field,
                        score,
                    });
                }
            }
            ans.sort((a, b) => b.score - a.score);
            setNearFields(ans.map((a) => a.field));
            painterStore.setPainting(false);
        },
        [fieldMetas]
    );

    useEffect(() => {
        getNearFields(dataSource)
    }, [dataSource, painterStore.linkTrigger])
    return (
        <div className="card" style={{ position: 'relative' }}>
                {
                    painting && <LoadingLayer>
                        <div className='cont'>
                            <Label>Search for relative patterns</Label>
                            <Spinner label="Linking..." size={SpinnerSize.large} />
                        </div>
                    </LoadingLayer>
                }
                <div>
                <Toggle label="Auto Search" inlineLabel checked={autoLink} onChange={(e, checked) => {
                        painterStore.setAutoLinkMode(Boolean(checked))
                    }} />
                </div>
                <Stack horizontal tokens={{ childrenGap: 10, padding: '0em 0em 2em 0em' }}>
                    <PrimaryButton
                            text="Search"
                            iconProps={{ iconName: 'Search' }}
                            onClick={() => {
                                getNearFields(dataSource);
                            }}
                        />
                    <DefaultButton
                        text="Last"
                        iconProps={{ iconName: 'Back' }}
                        onClick={() => {
                            setNearIndex((v) => (v - 1 + nearFields.length) % nearFields.length);
                        }}
                    />
                    <DefaultButton
                        text="Next"
                        iconProps={{ iconName: 'Forward' }}
                        onClick={() => {
                            setNearIndex((v) => (v + 1) % nearFields.length);
                        }}
                    />
                </Stack>
                {nearSpec && <ReactVega spec={nearSpec} dataSource={dataSource} />}
            </div>
    );
};

export default observer(NeighborAutoLink);
