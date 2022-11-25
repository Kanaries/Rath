import { memo, MouseEvent as RMouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { vega } from "vega-embed";
import ReactVega from "../react-vega";


const FloatingWindow = styled.div`
  position: fixed;
  z-index: 1048576;
  opacity: 0.33;
  transition: opacity 200ms;
  :hover {
    opacity: 0.9;
  }
  font-size: 10px;
  padding: 0.8em;
  background-color: #fff;
  width: 20em;
  > p {
    user-select: none;
    > span {
      font-weight: 550;
    }
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

const formatSize = (size: number): string => {
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
        return `${num.toFixed(2)} GB`;
      } else {
        return `${num.toFixed(1)} MB`;
      }
    } else {
      return `${num.toFixed(1)} KB`;
    }
  } else {
    return `${num} Bytes`;
  }
};

vega.expressionFunction(SizeFormatterName, formatSize);

const PerformanceWindow = memo<PerformanceWindowProps>(function PerformanceWindow ({ interval = 4_00, recordLength = 30_000 }) {
  const [data, setData] = useState<IPerformanceRecordItem[]>([]);
  const [max, setMax] = useState<number>(0);
  const [pos, setPos] = useState<[number, number]>([window.innerWidth - 230, 30]);
  const [border, setBorder] = useState<[number, number, number, number]>([0, window.innerWidth, window.innerHeight, 0]);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef<[number, number]>([0, 0]);
  const ref = useRef<HTMLDivElement>(null);
  const recentlyMaxRef = useRef(0);
  recentlyMaxRef.current = data.reduce<number>((m, d) => Math.max(m, d.memory?.totalJSHeapSize ?? 0), 0);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const update = () => {
      const time = Date.now();
      const memory = windowWithMemoryPerformance?.performance?.memory;
      setData(list => {
        return [
          ...list.filter(item => time - item.time <= recordLength),
          {
            time,
            memory: memory ? {
              jsHeapSizeLimit: memory.jsHeapSizeLimit,
              totalJSHeapSize: memory.totalJSHeapSize,
              usedJSHeapSize: memory.usedJSHeapSize,
            } : undefined,
          },
        ];
      });
      if (memory) {
        setMax(m => Math.max(m * 0.9 + recentlyMaxRef.current * 0.1, memory.totalJSHeapSize));
      }
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
  const domainMax = limitMemory ? max * 1.5 >= 0.9 * limitMemory ? limitMemory : max * 1.5 : max * 1.5;
  const scale = useMemo(() => ({ domain: [0, domainMax * 1.04] }), [domainMax]);

  const spec = useMemo(() => {
    return {
      width: 120,
      height: 80,
      data: {
        name: 'dataSource',
      },
      background: '#0000',
      layer: [
        {
          mark: {
            type: 'trail',
            tooltip: true,
            clip: true,
          },
          encoding: {
            x: { field: 'time', type: 'temporal', axis: null },
            y: {
              field: 'memory.jsHeapSizeLimit', type: 'quantitative', scale,
              axis: { formatType: SizeFormatterName, title: null, tickCount: 6 },
            },
            color: { value: 'rgb(255,0,0)' },
          },
        },
        {
          mark: {
            type: 'trail',
            tooltip: true,
            clip: true,
          },
          encoding: {
            x: { field: 'time', type: 'temporal', axis: null },
            y: { field: 'memory.totalJSHeapSize', type: 'quantitative' },
            color: { value: 'rgb(245,133,25)' },
          },
        },
        {
          mark: {
            type: 'trail',
            tooltip: true,
            clip: true,
          },
          encoding: {
            x: { field: 'time', type: 'temporal', axis: null },
            y: { field: 'memory.usedJSHeapSize', type: 'quantitative' },
            color: { value: 'rgb(251,207,150)' },
          },
        },
      ],
      config: { customFormatTypes: true },
    };
  }, [scale]);

  const current = data.at(-1);

  const handleMouseDown = useCallback((e: RMouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragOffsetRef.current = [e.clientX - pos[0], e.clientY - pos[1]];
  }, [pos]);

  useEffect(() => {
    if (isDragging) {
      const stopDragging = () => {
        setIsDragging(false);
      };
      const handleMouseMove = (e: MouseEvent) => {
        if (e.buttons !== 1) {
          setIsDragging(false);
        } else if (ref.current) {
          const { width, height } = ref.current.getBoundingClientRect();
          const x = Math.max(border[3] - width, Math.min(border[1], e.clientX - dragOffsetRef.current[0]));
          const y = Math.max(border[0] - height, Math.min(border[2], e.clientY - dragOffsetRef.current[1]));
          setPos([x, y]);
        }
      };
      document.addEventListener('visibilitychange', stopDragging);
      document.addEventListener('mouseup', stopDragging);
      document.addEventListener('mousemove', handleMouseMove);
      return () => {
        document.removeEventListener('visibilitychange', stopDragging);
        document.removeEventListener('mouseup', stopDragging);
        document.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, [isDragging, border]);

  useEffect(() => {
    const cb = () => {
      setBorder([0, window.innerWidth, window.innerHeight, 0]);
    };
    document.addEventListener('resize', cb);
    return () => {
      document.removeEventListener('resize', cb);
    };
  }, []);

  useEffect(() => {
    if (ref.current) {
      const { width, height } = ref.current.getBoundingClientRect();
      const x = Math.max(border[3] - width, Math.min(border[1], pos[0]));
      const y = Math.max(border[0] - height, Math.min(border[2], pos[1]));
      if (x !== pos[0] || y !== pos[1]) {
        setPos([x, y]);
      }
    }
  }, [border, pos]);

  return (
    <FloatingWindow
      ref={ref}
      onMouseDown={handleMouseDown}
      style={{
        left: pos[0],
        top: pos[1],
        cursor: isDragging ? 'grabbing' : 'grab',
        boxShadow: isDragging ? '0 0 16px #0004' : undefined,
      }}
    >
      <ReactVega
        dataSource={data}
        actions={false}
        spec={spec}
      />
      <p>
        Limit: <span style={{ color: 'inherit' }}>{formatSize(current?.memory?.jsHeapSizeLimit ?? NaN)}</span>
      </p>
      <p>
        Allocated: <span style={{ color: '#d86f0c' }}>{formatSize(current?.memory?.totalJSHeapSize ?? NaN)}</span>
        <span>({((current?.memory?.totalJSHeapSize ?? NaN) / (current?.memory?.jsHeapSizeLimit ?? NaN) * 100).toFixed(1)}%)</span>
      </p>
      <p>
        Used: <span style={{ color: '#c99615' }}>{formatSize(current?.memory?.usedJSHeapSize ?? NaN)}</span>
      </p>
    </FloatingWindow>
  );
});


export default PerformanceWindow;
