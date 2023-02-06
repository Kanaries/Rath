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
            meta = basefunc.snowflake_getmeta(uri=uri, database=database, schema=schema, table=row.name)
            scores = {"name": row.name, "meta": meta}
            table_list.append(scores)
        return table_list

    @staticmethod
    def snowflake_getmeta(uri, database, table, schema):
        engine = create_engine(uri, echo=True)
        metaRes = engine.execute('desc table {0}.{1}.{2}'.format(database, schema, table)).fetchall()
        meta = []
        i = 0
        for colData in metaRes:
            scores = {"key": colData.name, "colIndex": i, "dataType": colData.type}
            meta.append(scores)
            i += 1
        return meta

    @staticmethod
    def snowflake_getdata(uri, database, table, schema, rows_num):
        engine = create_engine(uri, echo=True)
        dataRes = engine.execute(
            'select * from {0}.{1}.{2} limit {3}'.format(database, schema, table, rows_num)).fetchall()
        data = []
        for row in dataRes:
            rows = []
            for item in row:
                rows.append(item)
            data.append(rows)
        return data

    @staticmethod
    def snowflake_getresult(uri, sql):
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
