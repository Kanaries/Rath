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
    > * {
        :not(:first-child):not(label) {
            background-color: #f8f8f8;
        }
        min-width: 2em;
        padding-inline: 0.8em;
        line-height: 1.5em;
        min-height: 1.5em;
    }
    > span:first-child, > label {
        position: sticky;
        top: 0;
        padding-top: 4px;
        font-weight: 600;
        background-color: #fff;
    }
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

const TablePreview: FC<TablePreviewProps> = memo(function TablePreview ({ name, data, submit }) {
    const columns = data.columns.map(key => {
        const col = data.meta.find(which => which.key === key)!;
        return col!;
    }).filter(Boolean);

    return (<>
        {/* @ts-expect-error css variable */}
        <Container style={{ '--n-cols': columns.length || 1, '--n-rows': data.rows.length || 1 }}>
            {/* corner */}
            <span />
            {
                columns.map((col, i) => (
                    <label key={i}>
                        {col.key}
                    </label>
                ))
            }
            {
                data.rows.map((d, i) => (
                    <Fragment key={i}>
                        <span
                            style={{
                                color: 'rgb(108, 113, 196)',
                                letterSpacing: '0.5px',
                                backgroundColor: '#fff',
                            }}
                        >
                            {i + 1}
                        </span>
                        {
                            columns.map((_, j) => (
                                j in d ? (
                                    <div
                                        key={j}
                                        style={{ ...styles[columns?.[j]?.dataType ?? ''] }}
                                    >
                                        {d[j]}
                                    </div>
                                ) : (
                                    <span
                                        key={j}
                                        style={{
                                            color: 'rgb(133, 133, 133)',
                                            fontStyle: 'italic',
                                        }}
                                    >
                                        (empty)
                                    </span>
                                )
                            ))
                        }
                    </Fragment>
                ))
            }
            {
                data.rows.length === 0 && (
                    <span
                        style={{
                            marginTop: '1.4em',
                            color: 'rgb(133, 133, 133)',
                            fontStyle: 'italic',
                        }}
                    >
                        (empty)
                    </span>
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
