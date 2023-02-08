import json
from sqlalchemy import create_engine
import base64


class basefunc:
    # bigquery
    @staticmethod
    def bigquery_getdb(uri, schema, credentials):
        project_id = uri.split(r'//')[1]
        engine = create_engine(uri, credentials_base64=credentials, echo=True)
        res = engine.execute('SELECT schema_name FROM {0}.INFORMATION_SCHEMA.SCHEMATA'.format(project_id)).fetchall()
        db_list = []
        for row in res:
            for item in row:
                db_list.append(item)
        return db_list

    @staticmethod
    def bigquery_gettable(uri, database, schema, credentials):
        engine = create_engine(uri, credentials_base64=credentials, echo=True)
        res = engine.execute('SELECT table_name FROM {0}.INFORMATION_SCHEMA.TABLES'.format(database)).fetchall()
        table_list = []
        for row in res:
            for item in row:
                meta = basefunc.bigquery_getmeta(uri=uri, database=database, schema=schema, table=item,
                                                 credentials=credentials)
                scores = {"name": item, "meta": meta}
                table_list.append(scores)
        return table_list

    @staticmethod
    def bigquery_getmeta(uri, database, table, schema, credentials):
        engine = create_engine(uri, credentials_base64=credentials, echo=True)
        metaRes = engine.execute('''
        SELECT
          * 
        FROM
          {0}.INFORMATION_SCHEMA.COLUMNS
        WHERE
          table_name = "{1}"'''.format(database, table)).fetchall()
        meta = []
        i = 0
        for colData in metaRes:
            scores = {"key": colData.column_name, "colIndex": i, "dataType": colData.data_type}
            meta.append(scores)
            i += 1
        return meta

    @staticmethod
    def bigquery_getdata(uri, database, table, schema, rows_num, credentials):
        engine = create_engine(uri, credentials_base64=credentials, echo=True)
        dataRes = engine.execute('select * from ' + database + '.' + table + ' limit ' + rows_num).fetchall()
        data = []
        for row in dataRes:
            rows = []
            for item in row:
                rows.append(item)
            data.append(rows)
        return data

    @staticmethod
    def bigquery_getresult(uri, sql, credentials):
        engine = create_engine(uri, credentials_base64=credentials, echo=True)
        res = engine.execute(sql).fetchall()
        sql_result = []
        for row in res:
            rows = []
            for item in row:
                rows.append(item)
            sql_result.append(rows)
        return sql_result


def lambda_handler(event, context):
    uri = event['uri']
    source_type = event['sourceType']
    func = event['func']
    database = event['db']
    table = event['table']
    schema = event['schema']
    rows_num = event['rowsNum']
    sql = event['query']
    credentials = json.dumps(event['credentials'])
    credentials_64 = base64.b64encode(credentials.encode('utf-8'))
    dict_func = basefunc.__dict__
    if func == 'getDatabases':
        db_list = dict_func['{0}_getdb'.format(source_type)].__func__(uri=uri, schema=schema,
                                                                      credentials=credentials_64)
        return db_list
    elif func == 'getSchemas':
        schema_list = dict_func['{0}_getschema'.format(source_type)].__func__(uri=uri, db=database,
                                                                              credentials=credentials_64)
        return schema_list
    elif func == 'getTables':
        table_list = dict_func['{0}_gettable'.format(source_type)].__func__(uri=uri, database=database, schema=schema,
                                                                            credentials=credentials_64)
        return table_list
    elif func == 'getTableDetail':
        meta = dict_func['{0}_getmeta'.format(source_type)].__func__(uri=uri, database=database, table=table,
                                                                     schema=schema, credentials=credentials_64)
        data = dict_func['{0}_getdata'.format(source_type)].__func__(uri=uri, database=database, table=table,
                                                                     schema=schema, rows_num=rows_num,
                                                                     credentials=credentials_64)
        return {
            "columns": meta,
            "rows": data
        }
    elif func == 'getResult':
        sql_result = dict_func['{0}_getresult'.format(source_type)].__func__(uri=uri, sql=sql,
                                                                             credentials=credentials_64)
        return {
            "rows": sql_result
        }
    else:
        return 'The wrong func was entered'
