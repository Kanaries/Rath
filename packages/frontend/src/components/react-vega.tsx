import React, { useRef, useEffect, useState } from 'react';
import embed, { vega, Result } from 'vega-embed';
import { Spec } from 'vega';
import { EDITOR_URL } from '../constants';
// import { Result } from 'vega-embed';

interface ReactVegaProps {
  dataSource: any[];
  spec: Spec;
  actions?: boolean;
  signalHandler?: {
    [key: string]: (name: any, value: any) => void
  }
}
const ReactVega: React.FC<ReactVegaProps> = props => {
  const { spec, dataSource, signalHandler = {}, actions } = props
  const container = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<Result['view']>()
  useEffect(() => {
    if (container.current) {
      embed(container.current, spec, {
        editorUrl: EDITOR_URL,
        actions
      }).then(res => {
        setView(res.view);
        const view = res.view;
        try {
          view && view.change('dataSource', vega.changeset().remove(() => true).insert(dataSource))
          view && view.resize();
          view && view.runAsync(); 
        } catch (error) {
          console.error(error)
        }
      })
    }
  }, [spec, actions, dataSource])
  useEffect(() => {
    if (view && signalHandler) {
      for (let key in signalHandler) {
        view.addSignalListener('sl', signalHandler[key]);
      }
    }
    return () => {
      if (view && signalHandler) {
        for (let key in signalHandler) {
          view.removeSignalListener('sl', signalHandler[key]);
        }
      }
    }
  }, [view, signalHandler])
  // TODO：分析下面写法会产生抖动的原因
  // useEffect(() => {
  //   try {
  //     view && view.change('dataSource', vega.changeset().remove(() => true).insert(dataSource))
  //     view && view.resize();
  //     view && view.runAsync(); 
  //   } catch (error) {
  //     console.error(error)
  //   }
  // }, [view, dataSource])
  return <div ref={container} />
}

export default ReactVega;
