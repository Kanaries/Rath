from sqlalchemy import create_engine


class basefunc:
    # sqlserver
    @staticmethod
    def sqlserver_getdb(uri, schema):
        engine = create_engine(uri, echo=True)
        res = engine.execute('SELECT name FROM sys.databases').fetchall()
        db_list = []
        for row in res:
            for item in row:
                db_list.append(item)
        return db_list

    @staticmethod
    def sqlserver_getschema(uri, db):
        engine = create_engine(uri, echo=True)
        res = engine.execute('SELECT name FROM {0}.sys.schemas'.format(db)).fetchall()
        schema_list = []
        for row in res:
            for item in row:
                schema_list.append(item)
        return schema_list

    @staticmethod
    def sqlserver_gettable(uri, database, schema):
        engine = create_engine(uri, echo=True)
        res = engine.execute(
            '''
            SELECT t.name FROM {0}.sys.tables AS t INNER JOIN {1}.sys.schemas AS s ON s.schema_id = t.schema_id WHERE s.name = '{2}'
            '''.format(
                database, database, schema)).fetchall()
        table_list = []
        for row in res:
            for item in row:
                meta = basefunc.sqlserver_getmeta(uri=uri, database=database, schema=schema, table=item)
                scores = {"name": item, "meta": meta}
                table_list.append(scores)
        return table_list

    @staticmethod
    def sqlserver_getmeta(uri, database, table, schema):
        engine = create_engine(uri, echo=True)
        metaRes = engine.execute('''
                SELECT SC.name as table_name,
                       ST.name as table_column
                FROM {0}.sys.sysobjects SO,
                     {1}.sys.syscolumns SC,
                     {2}.sys.systypes ST
                WHERE SO.id = SC.id
                  AND SO.xtype = 'U'
                  AND SO.status >= 0
                  AND SC.xtype = ST.xusertype
                  AND SO.name = '{3}'
                ORDER BY SO.name, SC.colorder
            '''.format(database, database, database, table)).fetchall()
        meta = []
        i = 0
        for colData in metaRes:
            scores = {"key": colData.table_name, "colIndex": i, "dataType": colData.table_column}
            meta.append(scores)
            i += 1
        return meta

    @staticmethod
    def sqlserver_getdata(uri, database, table, schema, rows_num):
        engine = create_engine(uri, echo=True)
        dataRes = engine.execute(
            'select top ' + rows_num + ' * from ' + database + '.' + schema + '.' + table).fetchall()
        data = []
        for row in dataRes:
            rows = []
            for item in row:
                rows.append(item)
            data.append(rows)
        return data

    @staticmethod
    def sqlserver_getresult(uri, sql):
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
