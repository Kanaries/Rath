import intl from 'react-intl-universal';
import { PrimaryButton } from '@fluentui/react';
import { FC, memo, CSSProperties, Fragment } from 'react';
import styled from 'styled-components';
import type { TableData } from './index';


interface TablePreviewProps {
    name: string;
    data: TableData;
    submit?: (name: string, value: TableData) => void;
}

const styles: Record<string, CSSProperties> & Record<string, any> = {
    Int64: {
        color: 'rgb(38, 139, 210)',
    },
};

const Container = styled.div`
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: repeat(calc(var(--n-cols) + 1), max-content);
    grid-template-rows: repeat(calc(var(--n-rows) + 1), max-content);
    gap: 2px;
    padding: 0 4px 50%;
    position: relative;
    overflow: auto;
`;

const Corner = styled.span`
    position: sticky;
    top: 0;
    padding-top: 4px;
    font-weight: 600;
    background-color: #fff;
`;

const TableHeader = styled.label`
    position: sticky;
    top: 0;
    padding-top: 4px;
    font-weight: 600;
    background-color: #fff;
    padding-inline: 0.8em;
`;

const TableCell = styled.div`
    background-color: #f8f8f8;
    min-width: 2em;
    padding-inline: 0.8em;
    line-height: 1.5em;
    min-height: 1.5em;
`;

const TableCellEmpty = styled.span`
    color: rgb(133, 133, 133);
    font-style: italic;
`;

const TableEmptyMsg = styled.span`
    margin-top: 1.4em;
    color: rgb(133, 133, 133);
    font-style: italic;
`;

const ButtonContainer = styled.div`
    position: absolute;
    bottom: 0;
    right: 0;
    margin: 0.5em;
    padding: 1em;
    opacity: 0.1;
    transition: opacity 100ms;
    :hover {
        opacity: 1;
    }
`;

const RowIndex = styled.span`
    color: rgb(108, 113, 196);
    letter-spacing: 0.5px;
    background-color: #fff;
    padding-inline: 0.8em;
    text-align: end;
`;

const TablePreview: FC<TablePreviewProps> = memo(function TablePreview ({ name, data, submit }) {
    const columns = data.columns.map(key => {
        const col = data.meta.find(which => which.key === key)!;
        return col!;
    }).filter(Boolean);

    return (<>
        {/* @ts-expect-error css variable */}
        <Container style={{ '--n-cols': columns.length || 1, '--n-rows': data.rows.length || 1 }}>
            <Corner />
            {columns.map((col, i) => <TableHeader key={i}>{col.key}</TableHeader>)}
            {
                data.rows.map((d, i) => (
                    <Fragment key={i}>
                        <RowIndex>{i + 1}</RowIndex>
                        {
                            columns.map((_, j) => (
                                j in d ? (
                                    <TableCell
                                        key={j}
                                        style={{ ...styles[columns?.[j]?.dataType ?? ''] }}
                                    >
                                        {d[j]}
                                    </TableCell>
                                ) : (
                                    <TableCellEmpty key={j}>
                                        {'(empty)'}
                                    </TableCellEmpty>
                                )
                            ))
                        }
                    </Fragment>
                ))
            }
            {
                data.rows.length === 0 && (
                    <TableEmptyMsg>
                        {'(empty)'}
                    </TableEmptyMsg>
                )
            }
        </Container>
        {submit && (
            <ButtonContainer>
                <PrimaryButton
                    text={intl.get('dataSource.btn.use_table')}
                    onClick={() => submit(name, data)}
                />
            </ButtonContainer>
        )}
    </>);
});


export default TablePreview;
