import { observer } from 'mobx-react-lite';
import { FC, useCallback, useState } from 'react';
import styled from 'styled-components';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Textarea } from '../../components/ui/textarea';
import { RathIcon } from '../../components/icons';
import { DashboardCardAppearance, DashboardCardState, DashboardDocument, DashboardDocumentOperators } from '../../store/dashboardStore';
import { useGlobalStore } from '../../store';
import SourcePanel from './source-panel';
import FilterList from './filter-list';
import EditPanel from './edit-panel';

const Panel = styled.div`
    position: relative;
    width: 33%;
    min-width: 360px;
    background-color: var(--card);
    border-radius: 2px;
    margin-block: 10px;
    padding: 1em;
    overflow: auto;
    box-shadow: -9px 1.6px 6.4px 0 rgb(0 0 0 / 1.5%), -1px 0.7px 0.9px 0 rgb(0 0 0 / 5%), -9px -1.6px 6.4px 0 rgb(0 0 0 / 1.5%),
        -1px -0.7px 0.9px 0 rgb(0 0 0 / 5%);
    z-index: 100;

    & *[role='tabpanel'] {
        flex-grow: 1;
        flex-shrink: 1;
        margin-top: 1em;
        overflow: hidden;
        width: 100%;
        display: flex;
        flex-direction: column;
    }
`;

const OptionContainer = styled.div`
    > button {
        position: absolute;
        top: 0;
        right: 0;
        margin-inline: 1em;
        height: unset;
        font-size: 90%;
    }
`;

export interface DashboardPanelProps {
    page: DashboardDocument;
    operators: DashboardDocumentOperators;
    card: DashboardCardState | null;
    sampleSize: number;
}

const SupportedTabs = ['collection', 'editor' /*, 'loa' */] as const;

const CardThemes: readonly DashboardCardAppearance[] = [
    DashboardCardAppearance.Transparent,
    DashboardCardAppearance.Outline,
    DashboardCardAppearance.Dropping,
    DashboardCardAppearance.Neumorphism,
];

// const CardAlignTypes: readonly DashboardCardInsetLayout[] = [
//     DashboardCardInsetLayout.Auto,
//     DashboardCardInsetLayout.Column,
//     DashboardCardInsetLayout.Row,
// ];

// const CardAlignName: Readonly<Record<DashboardCardInsetLayout, string>> = {
//     [DashboardCardInsetLayout.Auto]: 'Auto',
//     [DashboardCardInsetLayout.Column]: 'Column',
//     [DashboardCardInsetLayout.Row]: 'Row',
// };

const DashboardPanel: FC<DashboardPanelProps> = ({ page, card, operators, sampleSize }) => {
    const { dashboardStore } = useGlobalStore();
    const [tab, setTab] = useState<typeof SupportedTabs[number]>('collection');

    const applyThemeToAll = useCallback(
        (key: DashboardCardAppearance) => {
            dashboardStore.runInAction(() => {
                page.cards.forEach((c) => (c.config.appearance = key));
            });
        },
        [page, dashboardStore]
    );

    return (
        <Panel onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <div className="grid gap-3">
                {card ? (
                    <>
                        <h2 style={{ margin: '0 0 0.5em' }}>Common</h2>
                        <div className="grid gap-2">
                            <Label>Title</Label>
                            <Input
                                value={card.content.title ?? ''}
                                onChange={(e) =>
                                    dashboardStore.runInAction(() => {
                                        card.content.title = e.target.value || undefined;
                                    })
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Description</Label>
                            <Textarea
                                value={card.content.text ?? ''}
                                onChange={(e) =>
                                    dashboardStore.runInAction(() => {
                                        card.content.text = e.target.value || undefined;
                                    })
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Theme</Label>
                            <RadioGroup
                                value={card.config.appearance}
                                onValueChange={(key) =>
                                    dashboardStore.runInAction(() => {
                                        if ((CardThemes as string[]).includes(key)) {
                                            card.config.appearance = key as DashboardCardAppearance;
                                        }
                                    })
                                }
                            >
                                {CardThemes.map((theme) => (
                                    <OptionContainer key={theme}>
                                        <div className="flex items-center gap-2">
                                            <RadioGroupItem id={`dashboard-card-theme-${theme}`} value={theme} />
                                            <Label htmlFor={`dashboard-card-theme-${theme}`}>{theme}</Label>
                                        </div>
                                        <Button variant="ghost" onClick={() => applyThemeToAll(theme)}>
                                            Apply to all
                                        </Button>
                                    </OptionContainer>
                                ))}
                            </RadioGroup>
                        </div>
                        <h2 style={{ margin: '1.5em 0 0.5em' }}>Chart</h2>
                        <Button
                            variant="outline"
                            size="icon"
                            aria-label="Delete chart"
                            onClick={() =>
                                dashboardStore.runInAction(() => {
                                    card.content.chart = undefined;
                                })
                            }
                        >
                            <RathIcon name="Delete" />
                        </Button>
                        <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
                            <TabsList>
                                {SupportedTabs.map((key) => (
                                    <TabsTrigger key={key} value={key}>
                                        {key}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                        <div role="tabpanel">
                            {
                                (
                                    {
                                        collection: <SourcePanel page={page} card={card} operators={operators} sampleSize={sampleSize} />,
                                        editor: <EditPanel page={page} card={card} operators={operators} sampleSize={sampleSize} />,
                                        loa: null, // TODO: [fix] LOA panel
                                        // kyusho, 4 weeks ago   (November 3rd, 2022 3:15 PM
                                    } as const
                                )[tab]
                            }
                        </div>
                    </>
                ) : (
                    <>
                        <h2 style={{ margin: '0 0 0.5em' }}>Global</h2>
                        <div className="grid gap-2">
                            <Label>Theme</Label>
                            <div className="flex flex-wrap gap-2">
                                {CardThemes.map((theme) => (
                                    <Button key={theme} variant="ghost" style={{ height: 'unset' }} onClick={() => applyThemeToAll(theme)}>
                                        {theme}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <h2 style={{ margin: '1.5em 0 0.5em' }}>Filters</h2>
                        <FilterList page={page} operators={operators} />
                    </>
                )}
            </div>
        </Panel>
    );
};

export default observer(DashboardPanel);
