from sqlalchemy import create_engine


class basefunc:
    # postgres
    @staticmethod
    def postgres_getschema(uri, db):
        engine = create_engine(uri, echo=True)
        res = engine.execute('select nspname from pg_catalog.pg_namespace').fetchall()
        schema_list = []
        for row in res:
            for item in row:
                schema_list.append(item)
        return schema_list

    @staticmethod
    def postgres_gettable(uri, database, schema):
        engine = create_engine(uri, echo=True)
        res = engine.execute(
            'select tablename from pg_tables where schemaname=\'' + schema + '\'').fetchall()
        table_list = []
        for row in res:
            for item in row:
                meta = basefunc.postgres_getmeta(engine=engine, database=database, schema=schema, table=item)
                scores = {"name": item, "meta": meta}
                table_list.append(scores)
        return table_list

    @staticmethod
    def postgres_getmeta(database, table, schema, engine=None):
        meta_res = engine.execute(
            'select column_name, data_type from information_schema.columns where table_schema= \'' + schema + '\' and table_name= \'' + table + '\'').fetchall()
        meta = []
        i = 0
        for colData in meta_res:
            scores = {"key": colData.column_name, "colIndex": i, "dataType": colData.data_type}
            meta.append(scores)
            i += 1
        return meta

    @staticmethod
    def postgres_getdata(uri, database, table, schema, rows_num):
        engine = create_engine(uri, echo=True)
        data_res = engine.execute('select * from ' + schema + '.' + table + ' limit ' + rows_num).fetchall()
        data = []
        for row in data_res:
            rows = []
            for item in row:
                rows.append(item)
            data.append(rows)
        return data

    @staticmethod
    def postgres_getdetail(uri, database, table, schema, rows_num):
        engine = create_engine(uri, echo=True)
        meta = basefunc.postgres_getmeta(database=database, schema=schema, table=table, engine=engine)
        sql = f'select * from {schema}.{table} limit {rows_num}'
        res_list = basefunc.postgres_getresult(sql=sql, engine=engine)
        return [meta, res_list[0], res_list[1]]

    @staticmethod
    def postgres_getresult(sql, uri=None, engine=None):
        if engine is None:
            engine = create_engine(uri, echo=True)
        res = engine.execute(sql)
        data_res = res.fetchall()
        col_res = res.keys()
        columns = []
        for col_data in col_res:
            columns.append(col_data)
        sql_result = []
        for row in data_res:
            rows = []
            for item in row:
                rows.append(item)
            sql_result.append(rows)
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
