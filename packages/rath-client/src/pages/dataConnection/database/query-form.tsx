import type { FC } from 'react';
import { Label, PrimaryButton, Stack, TextField } from '@fluentui/react';
import intl from 'react-intl-universal';
import TablePreview from './table-preview';
import { StackTokens, TableData, TableLabels } from '.';

interface QueryFormProps {
    preview: TableData<TableLabels>;
    isQuerying: boolean;
    tableName: string | null | undefined;
    queryString: string | undefined;
    setQueryString: (sql: string) => void;
    query: () => void;
    disableQuery: boolean;
}

const QueryForm: FC<QueryFormProps> = ({ preview, isQuerying, tableName, queryString, setQueryString, query, disableQuery }) => {
    return (
        <Stack tokens={StackTokens} style={{ marginBlockStart: '0.35em' }}>
            <Label>{intl.get('dataSource.preview')}</Label>
            <TablePreview data={preview} />
            <Stack
                horizontal
                style={{
                    alignItems: 'flex-end',
                    marginBlockEnd: '10px',
                }}
            >
                <TextField
                    name="query_string"
                    label={intl.get('dataSource.query')}
                    required
                    readOnly={isQuerying}
                    placeholder={`select * from ${tableName || '<table_name>'}`}
                    value={queryString}
                    styles={{
                        root: {
                            flexGrow: 1,
                        },
                    }}
                    onChange={(_, sql) => {
                        setQueryString(sql ?? '');
                    }}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            query();
                        }
                    }}
                />
                <PrimaryButton
                    text={intl.get('dataSource.btn.query')}
                    disabled={isQuerying || disableQuery}
                    autoFocus
                    onClick={query}
                    style={{
                        marginInline: '10px',
                    }}
                />
            </Stack>
        </Stack>
    );
};

export default QueryForm;
