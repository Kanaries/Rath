import React, { useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { GraphicWalker } from '../../components/graphic-walker';
import { IMutField } from '@kanaries/graphic-walker/dist/interfaces';
import { useGlobalStore } from '../../store';
import '@kanaries/graphic-walker/dist/style.css';
import { Spinner } from '../../components/ui/spinner';

const VisualInterface: React.FC = (props) => {
    const { dataSourceStore, commonStore, langStore } = useGlobalStore();
    const { cleanedData, fields } = dataSourceStore;
    const { graphicWalkerSpec } = commonStore;
    const containerRef = useRef<HTMLDivElement>(null);
    const [walkerReady, setWalkerReady] = useState(false);
    const gwRawFields = useMemo<IMutField[]>(() => {
        return fields.map((f) => {
            return {
                fid: f.fid,
                name: f.name,
                semanticType: f.semanticType,
                dataType: '?',
                analyticType: f.analyticType,
            };
        });
    }, [fields]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        setWalkerReady(false);
        const containsWalkerControls = (root: ParentNode): boolean => {
            if (root.querySelector('[data-rbd-drag-handle-draggable-id], [data-rbd-droppable-id]')) return true;
            return Array.from(root.querySelectorAll('*')).some((element) => element.shadowRoot && containsWalkerControls(element.shadowRoot));
        };
        const checkReady = () => {
            const ready = containsWalkerControls(container);
            if (ready) setWalkerReady(true);
            return ready;
        };
        if (checkReady()) return;
        const interval = window.setInterval(() => {
            if (checkReady()) window.clearInterval(interval);
        }, 100);
        return () => window.clearInterval(interval);
    }, [cleanedData, gwRawFields]);

    return (
        <div ref={containerRef} className="relative min-h-[320px]">
            {!walkerReady && (
                <div role="status" className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-background/90">
                    <Spinner className="h-5 w-5" />
                    <span>Preparing Exploration...</span>
                </div>
            )}
            <GraphicWalker
                dataSource={cleanedData}
                rawFields={gwRawFields}
                spec={graphicWalkerSpec}
                i18nLang={langStore.lang}
                keepAlive
                dark="light"
                fieldKeyGuard={false}
                themeKey="g2"
            />
        </div>
    );
};

export default observer(VisualInterface);
