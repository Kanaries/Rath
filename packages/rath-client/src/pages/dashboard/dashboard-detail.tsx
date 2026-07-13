import { observer } from 'mobx-react-lite';
import { FC, useCallback, useState } from 'react';
import styled from 'styled-components';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Slider } from '../../components/ui/slider';
import { RathIcon } from '../../components/icons';
import DashboardDraft from './dashboard-draft';

const PageLayout = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    height: calc(100vh - 16px - 1em);
    display: flex;
    flex-direction: column;
    overflow: hidden;
`;

const Header = styled.div`
    flex-grow: 0;
    flex-shrink: 0;
    background-color: var(--card);
    border-radius: 2px;
    box-shadow: 0 1.6px 3.6px 0 rgb(0 0 0 / 13%), 0 0.3px 0.9px 0 rgb(0 0 0 / 11%);
    margin-bottom: 0.6em;
    margin-inline: 16px;
    display: flex;
    flex-direction: row;
    align-items: stretch;
`;

export interface DashboardDetailProps {
    cursor: number;
    /** back to dashboard list */
    goBack: () => void;
    ratio: number;
    sampleSize: number;
}

const viewScales = {
    [-7]: 0.2,
    [-6]: 0.38,
    [-5]: 0.5,
    [-4]: 0.6,
    [-3]: 0.7,
    [-2]: 0.8,
    [-1]: 0.9,
    0: 1,
    1: 1.1,
    2: 1.2,
    3: 1.3,
    4: 1.4,
    5: 1.5,
    6: 1.7,
    7: 2,
} as const;

const DashboardDetail: FC<DashboardDetailProps> = ({ cursor, goBack, ratio, sampleSize }) => {
    const [mode, setMode] = useState<'edit' | 'preview'>('edit');
    const [scaleIdx, setScaleIdx] = useState(0);

    const toggleMode = useCallback(() => {
        setMode(mode === 'edit' ? 'preview' : 'edit');
    }, [mode]);

    const scale = viewScales[scaleIdx as keyof typeof viewScales] ?? 1;

    return (
        <PageLayout>
            <Header>
                <Button variant="ghost" size="icon" aria-label="Back" onClick={goBack}>
                    <RathIcon name="Back" />
                </Button>
                <Button variant="ghost" size="icon" aria-label={mode === 'edit' ? 'Preview' : 'Edit'} onClick={toggleMode}>
                    <RathIcon name={mode === 'edit' ? 'AnalyticsView' : 'Edit'} />
                </Button>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5em', marginInline: '1em' }}>
                    <Label>Resize</Label>
                    <Slider
                        min={Math.min(...Object.keys(viewScales).map((d) => parseInt(d, 10)))}
                        max={Math.max(...Object.keys(viewScales).map((d) => parseInt(d, 10)))}
                        value={[scaleIdx]}
                        onValueChange={(idx) => setScaleIdx(idx[0])}
                        style={{ width: '12vw' }}
                    />
                    <span>{viewScales[scaleIdx as keyof typeof viewScales] ?? 1}</span>
                </div>
            </Header>
            <DashboardDraft sampleSize={sampleSize} cursor={cursor} mode={mode} ratio={ratio * scale} />
        </PageLayout>
    );
};

export default observer(DashboardDetail);
