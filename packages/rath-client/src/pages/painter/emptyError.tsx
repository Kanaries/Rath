import React from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { useGlobalStore } from '../../store';
import { PIVOT_KEYS } from '../../constants';
import { RathIcon } from '../../components/icons';

const EmptyError: React.FC = () => {
    const { commonStore } = useGlobalStore();

    const sources = [
        {
            key: PIVOT_KEYS.semiAuto,
            icon: 'D365TalentInsight',
            title: intl.get('menu.semiAuto'),
            description: intl.get('painter.empty.semiAutoDesc'),
        },
        {
            key: PIVOT_KEYS.megaAuto,
            icon: 'UserEvent',
            title: intl.get('menu.megaAuto'),
            description: intl.get('painter.empty.megaAutoDesc'),
        },
    ];

    return (
        <div
            role="status"
            className="flex min-h-[min(70vh,640px)] w-full flex-col items-center justify-center px-6 py-12"
        >
            <div className="w-full max-w-lg rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-10 text-center shadow-xs sm:px-10">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/15">
                    <RathIcon name="Brush" size={28} aria-hidden />
                </div>

                <h1 className="text-lg font-semibold tracking-tight text-foreground">
                    {intl.get('painter.empty.title')}
                </h1>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                    {intl.get('painter.empty.description')}
                </p>

                <ol className="mx-auto mt-6 max-w-sm space-y-2.5 text-left text-sm text-muted-foreground">
                    <li className="flex gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-background text-[11px] font-semibold text-foreground ring-1 ring-border">
                            1
                        </span>
                        <span>{intl.get('painter.empty.step1')}</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-background text-[11px] font-semibold text-foreground ring-1 ring-border">
                            2
                        </span>
                        <span>{intl.get('painter.empty.step2')}</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-background text-[11px] font-semibold text-foreground ring-1 ring-border">
                            3
                        </span>
                        <span>{intl.get('painter.empty.step3')}</span>
                    </li>
                </ol>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    {sources.map((source) => (
                        <button
                            key={source.key}
                            type="button"
                            className="group flex flex-col items-start gap-2.5 rounded-lg border bg-background p-4 text-left shadow-xs transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                            onClick={() => commonStore.setAppKey(source.key)}
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                                <RathIcon name={source.icon} size={16} aria-hidden />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-foreground">{source.title}</div>
                                <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                                    {source.description}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default observer(EmptyError);
