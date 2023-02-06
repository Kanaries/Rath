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
                meta = basefunc.athena_getmeta(uri=uri, database=database, schema=schema, table=item)
                scores = {"name": item, "meta": meta}
                table_list.append(scores)
        return table_list

    @staticmethod
    def athena_getmeta(uri, database, table, schema):
        engine = create_engine(uri, echo=True)
        metaRes = engine.execute('select * from ' + database + '.' + table + ' limit 500').keys()
        meta = []
        i = 0
        for colData in metaRes:
            scores = {"key": colData, "colIndex": i, "dataType": None}
            meta.append(scores)
            i += 1
        return meta

    @staticmethod
    def athena_getdata(uri, database, table, schema, rows_num):
        engine = create_engine(uri, echo=True)
        dataRes = engine.execute('select * from ' + database + '.' + table + ' limit ' + rows_num).fetchall()
        data = []
        for row in dataRes:
            rows = []
            for item in row:
                rows.append(item)
            data.append(rows)
        return data

    @staticmethod
    def athena_getresult(uri, sql):
        engine = create_engine(uri, echo=True)
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
        meta = dict_func['{0}_getmeta'.format(source_type)].__func__(uri=uri, database=database, table=table,
                                                                     schema=schema)
        data = dict_func['{0}_getdata'.format(source_type)].__func__(uri=uri, database=database, table=table,
                                                                     schema=schema, rows_num=rows_num)
        return {
            "columns": meta,
            "rows": data
        }
    elif func == 'getResult':
        sql_result = dict_func['{0}_getresult'.format(source_type)].__func__(uri=uri, sql=sql)
        return {
            "rows": sql_result
        }
    else:
        return 'The wrong func was entered'
