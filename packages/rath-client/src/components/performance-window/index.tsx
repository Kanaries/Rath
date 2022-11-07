import { memo, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { vega } from "vega-embed";
import ReactVega from "../react-vega";


const FloatingWindow = styled.div`
  position: fixed;
  z-index: 1048576;
  opacity: 0.5;
  left: 1em;
  top: 1em;
  transition: opacity 80ms;
  :hover {
    opacity: 0.95;
  }
  > * {
    pointer-events: none;
  }
`;

export interface PerformanceWindowProps {
  /** @default 200 */
  interval?: number;
  /** @default 8_000 */
  recordLength?: number;
}

interface IPerformanceMemory {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
}

const windowWithMemoryPerformance = window as Window & typeof globalThis & {
  performance: (Window['performance'] & {
    memory?: IPerformanceMemory;
  }) | undefined;
} | undefined;

interface IPerformanceRecordItem {
  time: number;
  memory?: IPerformanceMemory;
}

const SizeFormatterName = '__performance_window_size_formatter__';

vega.expressionFunction(SizeFormatterName, (size: number): string => {
  if (size === 0) {
    return '0';
  }
  let num = size;
  if (num > 1024 * 1.2) {
    num /= 1024;
    if (num > 1024 * 1.2) {
      num /= 1024;
      if (num > 1024 * 1.2) {
        num /= 1024;
        return `${num.toFixed(1)} GB`;
      } else {
        return `${num.toFixed(1)} MB`;
      }
    } else {
      return `${num.toFixed(1)} KB`;
    }
  } else {
    return `${num} Bytes`;
  }
});

const PerformanceWindow = memo<PerformanceWindowProps>(function PerformanceWindow ({ interval = 2_00, recordLength = 8_000 }) {
  const [data, setData] = useState<IPerformanceRecordItem[]>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const update = () => {
      const time = Date.now();
      const memory = windowWithMemoryPerformance?.performance?.memory;
      setData(list => {
        return [
          ...list.filter(item => time - item.time <= recordLength),
          { time, memory },
        ];
      });
      timer = setTimeout(update, interval);
    };

    update();

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [interval, recordLength]);

  const limitMemory = data.at(-1)?.memory?.jsHeapSizeLimit;
  const scale = limitMemory ? { domain: [0, limitMemory * 1.04] } : undefined;
  const ticks = useMemo(() => {
    if (limitMemory) {
      const values: number[] = [];
      for (let size = 0; size <= limitMemory; size += 1024 * 1024 * 1024) {
        values.push(size);
      }
      values.push(limitMemory);
      return values;
    }
    return undefined;
  }, [limitMemory]);

  const spec = useMemo(() => {
    return {
      width: 90,
      height: 90,
      data: {
        name: 'dataSource',
      },
      layer: [
        {
          mark: {
            type: 'trail',
            tooltip: true,
          },
          encoding: {
            x: { field: 'time', type: 'temporal', axis: null },
            y: {
              field: 'memory.jsHeapSizeLimit', type: 'quantitative', scale,
              axis: { formatType: SizeFormatterName, title: null, values: ticks, tickCount: ticks?.length },
            },
            color: { value: 'rgb(255,0,0)' },
          },
        },
        {
          mark: 'trail',
          encoding: {
            x: { field: 'time', type: 'temporal', axis: null },
            y: { field: 'memory.totalJSHeapSize', type: 'quantitative' },
            color: { value: 'rgb(245,133,25)' },
          },
        },
        {
          mark: 'trail',
          encoding: {
            x: { field: 'time', type: 'temporal', axis: null },
            y: { field: 'memory.usedJSHeapSize', type: 'quantitative' },
            color: { value: 'rgb(251,207,150)' },
          },
        },
      ],
      config: { customFormatTypes: true },
    };
  }, [ticks]);

  return (
    <FloatingWindow>
      <ReactVega
        dataSource={data}
        actions={false}
        spec={spec}
      />
      {/* <p>
        jsHeapSizeLimit: {info?.jsHeapSizeLimit}bytes
      </p>
      <p>
        totalJSHeapSize: {info?.totalJSHeapSize}bytes
      </p>
      <p>
        usedJSHeapSize: {info?.usedJSHeapSize}bytes
      </p> */}
    </FloatingWindow>
  );
});


export default PerformanceWindow;
