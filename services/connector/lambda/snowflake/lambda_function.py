from sqlalchemy import create_engine


class basefunc:
    # snowflake
    @staticmethod
    def snowflake_getdb(uri, schema):
        engine = create_engine(uri, echo=True)
        res = engine.execute('SHOW DATABASES').fetchall()
        db_list = []
        for row in res:
            db_list.append(row.name)
        return db_list

    @staticmethod
    def snowflake_getschema(uri, db):
        engine = create_engine(uri, echo=True)
        res = engine.execute('show schemas in database {0}'.format(db)).fetchall()
        schema_list = []
        for row in res:
            schema_list.append(row.name)
        return schema_list

    @staticmethod
    def snowflake_gettable(uri, database, schema):
        engine = create_engine(uri, echo=True)
        res = engine.execute('show tables in schema {0}.{1}'.format(database, schema)).fetchall()
        print('show tables in schema {0}.{1}'.format(database, schema))
        table_list = []
        for row in res:
            meta = basefunc.snowflake_getmeta(engine=engine, database=database, schema=schema, table=row.name)
            scores = {"name": row.name, "meta": meta}
            table_list.append(scores)
        return table_list

    @staticmethod
    def snowflake_getmeta(database, table, schema, engine=None):
        meta_res = engine.execute('desc table {0}.{1}.{2}'.format(database, schema, table)).fetchall()
        meta = []
        i = 0
        for colData in meta_res:
            scores = {"key": colData.name, "colIndex": i, "dataType": colData.type}
            meta.append(scores)
            i += 1
        return meta

    @staticmethod
    def snowflake_getdata(uri, database, table, schema, rows_num):
        engine = create_engine(uri, echo=True)
        data_res = engine.execute(
            'select * from {0}.{1}.{2} limit {3}'.format(database, schema, table, rows_num)).fetchall()
        data = []
        for row in data_res:
            rows = []
            for item in row:
                rows.append(item)
            data.append(rows)
        return data

    @staticmethod
    def snowflake_getdetail(uri, database, table, schema, rows_num):
        engine = create_engine(uri, echo=True)
        meta = basefunc.snowflake_getmeta(database=database, schema=schema, table=table, engine=engine)
        sql = f'select * from {database}.{schema}.{table} limit {rows_num}'
        res_list = basefunc.snowflake_getresult(sql=sql, engine=engine)
        return [meta, res_list[0], res_list[1]]

    @staticmethod
    def snowflake_getresult(sql, uri=None, engine=None):
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
