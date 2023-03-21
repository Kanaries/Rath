from sqlalchemy import create_engine


class basefunc:
    # redshift
    @staticmethod
    def redshift_getdb(uri, schema):
        engine = create_engine(uri, echo=True)
        res = engine.execute('select nspname from pg_namespace').fetchall()
        db_list = []
        for row in res:
            for item in row:
                db_list.append(item)
        return db_list

    @staticmethod
    def redshift_gettable(uri, database, schema):
        engine = create_engine(uri, echo=True)
        res = engine.execute(
            '''select distinct(tablename) from pg_table_def where schemaname = '{0}' '''.format(database)).fetchall()
        table_list = []
        for row in res:
            for item in row:
                meta = basefunc.redshift_getmeta(engine=engine, database=database, schema=schema, table=item)
                scores = {"name": item, "meta": meta}
                table_list.append(scores)
        return table_list

    @staticmethod
    def redshift_getmeta(database, table, schema, engine=None):
        meta_res = engine.execute('''
                SELECT *
                FROM pg_table_def
                WHERE tablename = '{0}'
                AND schemaname = '{1}'
            '''.format(table, database)).fetchall()
        meta = []
        i = 0
        for colData in meta_res:
            scores = {"key": colData.column, "colIndex": i, "dataType": colData.type}
            meta.append(scores)
            i += 1
        return meta

    @staticmethod
    def redshift_getdata(uri, database, table, schema, rows_num):
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
    def redshift_getdetail(uri, database, table, schema, rows_num):
        engine = create_engine(uri, echo=True)
        meta = basefunc.redshift_getmeta(database=database, schema=schema, table=table, engine=engine)
        sql = f'select * from {database}.{table} limit {rows_num}'
        res_list = basefunc.redshift_getresult(sql=sql, engine=engine)
        return [meta, res_list[0], res_list[1]]

    @staticmethod
    def redshift_getresult(sql, uri=None, engine=None):
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
