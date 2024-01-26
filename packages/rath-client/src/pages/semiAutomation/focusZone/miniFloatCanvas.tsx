import { observer } from 'mobx-react-lite';
import { CommandBarButton, IconButton } from '@fluentui/react';
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { applyFilters, IPattern } from '@kanaries/loa';
import ReactVega from '../../../components/react-vega';
import type { IRow } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import { adviceVisSize } from '../../collection/utils';
import { useVisSpec } from '../predictZone/utils';

const FloatContainer = styled.div<{ hide: boolean }>`
    position: fixed;
    right: 1px;
    top: 30%;
    z-index: 999;
    padding: ${(props) => (props.hide ? '5px' : '1em')};
    background-color: #fff;
    box-shadow: 0 10px 8px rgba(0, 0, 0, 0.05), 0 4px 3px rgba(0, 0, 0, 0.01);
    .actions {
        margin-bottom: 6px;
    }
`;

interface MiniFloatCanvasProps {
    pined: IPattern;
}
const MiniFloatCanvas: React.FC<MiniFloatCanvasProps> = (props) => {
    const { pined } = props;
    const { semiAutoStore, commonStore } = useGlobalStore();
    const { mainVizSetting, dataSource, fieldMetas } = semiAutoStore;
    const [hide, setHide] = useState<boolean>(false);

    const { debug, excludeScaleZero } = mainVizSetting;
    const mainViewData = useMemo<IRow[]>(() => {
        if (pined) return applyFilters(dataSource, pined.filters);
        return [];
    }, [dataSource, pined]);

    const specOptions = useMemo(() => ({ pattern: pined, excludeScaleZero }), [pined, excludeScaleZero]);
    const simpleSpec = useVisSpec(specOptions, dataSource);

    const spec = useMemo(() => {
        return simpleSpec === null ? null : adviceVisSize(simpleSpec, fieldMetas);
    }, [simpleSpec, fieldMetas]);

    return spec && (
        <FloatContainer hide={hide}>
            <div className="actions">
                {!hide && (
                    <CommandBarButton
                        iconProps={{ iconName: 'BackToWindow' }}
                        text={intl.get('common.hide')}
                        onClick={() => {
                            setHide((v) => !v);
                        }}
                    />
                )}
                {hide && (
                    <IconButton
                        iconProps={{ iconName: 'ChevronLeft' }}
                        title={intl.get('common.expand')}
                        onClick={() => {
                            setHide((v) => !v);
                        }}
                    />
                )}
            </div>
            {!hide && <ReactVega actions={debug} spec={spec} dataSource={mainViewData} config={commonStore.themeConfig} />}
        </FloatContainer>
    );
};

export default observer(MiniFloatCanvas);
