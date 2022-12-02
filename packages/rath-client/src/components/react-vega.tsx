import React, { useRef, useEffect } from 'react';
import { View } from 'vega';
import intl from 'react-intl-universal';
import embed, { vega } from 'vega-embed';
import { EDITOR_URL } from '../constants';
import { getVegaTimeFormatRules } from '../utils';

interface ReactVegaProps {
    dataSource: readonly any[];
    spec: any;
    actions?: boolean;
    signalHandler?: {
        [key: string]: (name: any, value: any, view: View) => void;
    };
}

const ReactVega: React.FC<ReactVegaProps> = (props) => {
    const { spec, dataSource, signalHandler = {}, actions } = props;
    const container = useRef<HTMLDivElement>(null);
    const viewRef = useRef<View>();
    useEffect(() => {
        if (container.current) {
            const sspec = {
                ...spec,
                data: {
                    ...spec.data,
                },
            };
            if (spec.data) {
                sspec.data = {
                    ...spec.data,
                };
            }
            sspec.data.values = dataSource;
            embed(container.current, sspec, {
                editorUrl: EDITOR_URL,
                timeFormatLocale: getVegaTimeFormatRules(intl.get('time_format.langKey')) as any,
                actions,
            }).then((res) => {
                const view = res.view;
                viewRef.current = view;
                for (let key in signalHandler) {
                    try {
                        view.addSignalListener(key, (n, v) => signalHandler[key](n, v, view));
                    } catch (error) {
                        console.warn(error);
                    }
                }
            });
        }
        return () => {
            if (viewRef.current) {
                viewRef.current.finalize();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [spec, actions]);

    useEffect(() => {
        if (viewRef.current && signalHandler) {
            for (let key in signalHandler) {
                try {
                    viewRef.current.addSignalListener(key, (n, v) => signalHandler[key](n, v, viewRef.current!));
                } catch (error) {
                    console.warn(error);
                }
            }
        }
        return () => {
            if (viewRef.current && signalHandler) {
                for (let key in signalHandler) {
                    try {
                        viewRef.current.removeSignalListener(key, (n, v) => signalHandler[key](n, v, viewRef.current!));
                    } catch (error) {
                        console.warn(error);
                    }
                }
            }
        };
    }, [signalHandler]);

    useEffect(() => {
        if (viewRef.current) {
            viewRef.current.change(
                'dataSource',
                vega
                    .changeset()
                    .remove(() => true)
                    .insert(dataSource)
            );
            viewRef.current.resize();
            viewRef.current.runAsync();
        }
    }, [dataSource]);
    return <div ref={container} />;
};

export default ReactVega;
