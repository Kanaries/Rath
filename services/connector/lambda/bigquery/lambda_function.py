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
                meta = basefunc.bigquery_getmeta(database=database, schema=schema, table=item, engine=engine)
                scores = {"name": item, "meta": meta}
                table_list.append(scores)
        return table_list

    @staticmethod
    def bigquery_getmeta(database, table, schema, engine=None):
        meta_res = engine.execute('''
        SELECT
          * 
        FROM
          {0}.INFORMATION_SCHEMA.COLUMNS
        WHERE
          table_name = "{1}"'''.format(database, table)).fetchall()
        meta = []
        i = 0
        for col_data in meta_res:
            scores = {"key": col_data.column_name, "colIndex": i, "dataType": col_data.data_type}
            meta.append(scores)
            i += 1
        return meta

    @staticmethod
    def bigquery_getdata(uri, database, table, schema, rows_num, credentials):
        engine = create_engine(uri, credentials_base64=credentials, echo=True)
        data_res = engine.execute('select * from ' + database + '.' + table + ' limit ' + rows_num).fetchall()
        data = []
        for row in data_res:
            rows = []
            for item in row:
                rows.append(item)
            data.append(rows)
        return data

    @staticmethod
    def bigquery_getdetail(uri, database, table, schema, rows_num, credentials):
        engine = create_engine(uri, credentials_base64=credentials, echo=True)
        meta = basefunc.bigquery_getmeta(database=database, schema=schema, table=table, engine=engine)
        sql = f'select * from {database}.{table} limit {rows_num}'
        res_list = basefunc.bigquery_getresult(sql=sql, engine=engine)
        return [meta, res_list[0], res_list[1]]

    @staticmethod
    def bigquery_getresult(sql, credentials=None, uri=None, engine=None):
        if engine is None:
            engine = create_engine(uri, credentials_base64=credentials, echo=True)
        res = engine.execute(sql)
        data_res = res.fetchall()
        col_res = res.keys()
        sql_result = []
        for row in data_res:
            rows = []
            for item in row:
                rows.append(item)
            sql_result.append(rows)
        columns = []
        for col_data in col_res:
            columns.append(col_data)
        return [columns, sql_result]


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
        res_list = dict_func['{0}_getdetail'.format(source_type)].__func__(uri=uri, database=database, table=table,
                                                                           schema=schema, rows_num=rows_num,
                                                                           credentials=credentials_64)
        return {
            "meta": res_list[0],
            "columns": res_list[1],
            "rows": res_list[2]
        }
    elif func == 'getResult':
        res_list = dict_func['{0}_getresult'.format(source_type)].__func__(uri=uri, sql=sql,
                                                                           credentials=credentials_64)
        return {
            "columns": res_list[0],
            "rows": res_list[1]
        }
    else:
        return 'The wrong func was entered'



