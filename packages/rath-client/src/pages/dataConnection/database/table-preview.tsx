import { FC, memo, CSSProperties, Fragment } from 'react';
import type { TableData } from '.';

interface TablePreviewProps {
    data: TableData;
}

const styles: Record<string, CSSProperties> & Record<string, any> = {
    Int64: {
        color: 'rgb(38, 139, 210)',
    },
};

const TablePreview: FC<TablePreviewProps> = memo(function TablePreview({ data }) {
    const columns =
        (data.columns ?? []).length === 0
            ? data.rows[0]?.map((_, i) => ({
                  key: `col_${i + 1}`,
                  colIndex: i,
                  dataType: null,
              }))
            : data.columns;

    return (
        <div
            style={{
                marginBlockStart: '4px',
                marginBlockEnd: '10px',
                maxHeight: '30vh',
                padding: '4px',
                display: 'inline-grid',
                gridTemplateColumns: `repeat(${columns.length + 1}, max-content)`,
                rowGap: '3px',
                columnGap: '0.5em',
                border: '1px solid rgb(235, 235, 235)',
                overflow: 'scroll',
            }}
        >
            {/* corner */}
            <span
                style={{
                    minWidth: '1em',
                    paddingInline: '0.6em',
                }}
            />
            {columns.map((col) => (
                <label
                    key={col.colIndex}
                    style={{
                        paddingInline: '0.6em',
                        fontWeight: 600,
                    }}
                >
                    {col.key}
                </label>
            ))}
            {data.rows.map((d, i) => (
                <Fragment key={i}>
                    <span
                        style={{
                            paddingInline: '0.6em',
                            color: 'rgb(108, 113, 196)',
                            letterSpacing: '0.5px',
                        }}
                    >
                        {i + 1}
                    </span>
                    {d.map((e, j) => (
                        <div
                            key={j}
                            style={{
                                paddingInline: '0.6em',
                                ...styles[data.columns?.[j]?.dataType ?? ''],
                            }}
                        >
                            {e}
                        </div>
                    ))}
                </Fragment>
            ))}
            {data.rows.length === 0 && (
                <span
                    style={{
                        paddingInline: '0.6em',
                        color: 'rgb(133, 133, 133)',
                        fontStyle: 'italic',
                    }}
                >
                    (empty)
                </span>
            )}
        </div>
    );
});

export default TablePreview;
