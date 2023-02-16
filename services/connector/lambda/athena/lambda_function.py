from sqlalchemy import create_engine


class basefunc:
    # athena
    @staticmethod
    def athena_getdb(uri, schema):
        engine = create_engine(uri, echo=True)
        res = engine.execute('SHOW DATABASES').fetchall()
        db_list = []
        for row in res:
            for item in row:
                db_list.append(item)
        return db_list

    @staticmethod
    def athena_gettable(uri, database, schema):
        engine = create_engine(uri, echo=True)
        res = engine.execute('SHOW TABLES FROM ' + database).fetchall()
        table_list = []
        for row in res:
            for item in row:
                meta = basefunc.athena_getmeta(database=database, schema=schema, table=item, engine=engine)
                scores = {"name": item, "meta": meta}
                table_list.append(scores)
        return table_list

    @staticmethod
    def athena_getmeta(database, table, schema, engine=None):
        meta_res = engine.execute('select * from ' + database + '.' + table + ' limit 500').keys()
        meta = []
        i = 0
        for col_data in meta_res:
            scores = {"key": col_data, "colIndex": i, "dataType": None}
            meta.append(scores)
            i += 1
        return meta

    @staticmethod
    def athena_getdata(uri, database, table, schema, rows_num):
        engine = create_engine(uri, echo=True)
        data_res = engine.execute('select * from ' + database + '.' + table + ' limit ' + rows_num).fetchall()
        data = []
        for row in data_res:
            rows = []
            for item in row:
                rows.append(item)
            data.append(rows)
        return data

    @staticmethod
    def athena_getdetail(uri, database, table, schema, rows_num):
        engine = create_engine(uri, echo=True)
        meta = basefunc.athena_getmeta(database=database, schema=schema, table=table, engine=engine)
        sql = f'select * from {database}.{table} limit {rows_num}'
        res_list = basefunc.athena_getresult(sql=sql, engine=engine)
        return [meta, res_list[0], res_list[1]]

    @staticmethod
    def athena_getresult(sql, uri=None, engine=None):
        if engine is None:
            engine = create_engine(uri, echo=True)
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
        for column in col_res:
            columns.append(column)
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
    dict_func = basefunc.__dict__
    if func == 'getDatabases':
        db_list = dict_func['{0}_getdb'.format(source_type)].__func__(uri=uri, schema=schema)
        return db_list
    elif func == 'getSchemas':
        schema_list = dict_func['{0}_getschema'.format(source_type)].__func__(uri=uri, db=database)
        return schema_list
    elif func == 'getTables':
        table_list = dict_func['{0}_gettable'.format(source_type)].__func__(uri=uri, database=database, schema=schema)
        return table_list
    elif func == 'getTableDetail':
        res_list = dict_func['{0}_getdetail'.format(source_type)].__func__(uri=uri, database=database, table=table,
                                                                           schema=schema, rows_num=rows_num)
        return {
            "meta": res_list[0],
            "columns": res_list[1],
            "rows": res_list[2]
        }
    elif func == 'getResult':
        res_list = dict_func['{0}_getresult'.format(source_type)].__func__(uri=uri, sql=sql)
        return {
            "columns": res_list[0],
            "rows": res_list[1]
        }
    else:
        return 'The wrong func was entered'

