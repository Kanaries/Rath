import React, { useRef, useEffect, useState } from 'react';
import embed, { vega, Result } from 'vega-embed';
import { Spec } from 'vega';
// import { Result } from 'vega-embed';

interface GenVegaProps {
  dataSource: any[];
  spec: Spec;
  signalHandler?: {
    [key: string]: (name: any, value: any) => void;
  };
}
const GenVega: React.FC<GenVegaProps> = (props) => {
  const { spec, dataSource, signalHandler = {} } = props;
  const container = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<Result['view']>();
  useEffect(() => {
    if (container.current) {
      embed(container.current, spec).then((res) => {
        setView(res.view);
      });
    }
  }, [spec]);
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
    };
  }, [view, signalHandler]);
  useEffect(() => {
    view &&
      view.change(
        'dataSource',
        vega
          .changeset()
          .remove(() => true)
          .insert(dataSource)
      );
    view && view.resize();
    view && view.runAsync();
  }, [view, dataSource]);
  return <div ref={container} />;
};

export default GenVega;
