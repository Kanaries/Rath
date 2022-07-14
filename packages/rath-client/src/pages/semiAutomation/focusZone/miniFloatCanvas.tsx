import { observer } from 'mobx-react-lite';
import { CommandBarButton, IconButton } from 'office-ui-fabric-react';
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';

import ReactVega from '../../../components/react-vega';
import { IPattern } from '../../../dev';
import { IRow } from '../../../interfaces';
import { distVis } from '../../../queries/distVis';
import { labDistVis } from '../../../queries/labdistVis';
import { useGlobalStore } from '../../../store';
import { applyFilter } from '../utils';

const FloatContainer = styled.div<{hide: boolean}>`
    position: fixed;
    right: 1px;
    top: 30%;
    z-index: 99;
    padding: ${props => props.hide ? '5px' : '1em'};
    background-color: #fff;
    box-shadow: 0 10px 8px rgba(0, 0, 0, 0.05), 0 4px 3px rgba(0, 0, 0, 0.01);
    .actions {
        margin-bottom: 6px;
    }
`

interface MiniFloatCanvasProps{
    pined: IPattern;
}
const MiniFloatCanvas: React.FC<MiniFloatCanvasProps> = props => {
    const { pined } = props;
    const { discoveryMainStore } = useGlobalStore()
    const { settings, mainVizSetting, dataSource } = discoveryMainStore;
    const { vizAlgo } = settings;
    const [hide, setHide] = useState<boolean>(false);

    const { debug } = mainVizSetting
    const mainViewData = useMemo<IRow[]>(() => {
        if (pined) return applyFilter(dataSource, pined.filters)
        return []
    }, [dataSource, pined])

    const spec = useMemo(() => {
        return vizAlgo === 'lite' ? distVis({ pattern: pined }) : labDistVis({
            pattern: pined,
            dataSource
        })
    }, [pined, vizAlgo, dataSource])

    return <FloatContainer hide={hide}>
        <div className="actions">
            {
                !hide && <CommandBarButton
                    iconProps={{ iconName: 'BackToWindow' }}
                    text="hide"
                    onClick={() => {
                        setHide(v => !v)
                    }}
                />
            }
            {
                hide && <IconButton
                    iconProps={{ iconName: 'ChevronLeft' }}
                    onClick={() => {
                        setHide(v => !v)
                    }}
                />
            }
        </div>
            {
                !hide && <ReactVega
                    actions={debug}
                    spec={spec}
                    dataSource={mainViewData}
                />
            }
    </FloatContainer>
}

export default observer(MiniFloatCanvas);
