from sqlalchemy import create_engine


class basefunc:
    # oracle
    @staticmethod
    def oracle_gettable(uri, database, schema):
        engine = create_engine(uri, echo=True)
        res = engine.execute('select tname from tab').fetchall()
        table_list = []
        for row in res:
            for item in row:
                meta = basefunc.oracle_getmeta(engine=engine, database=database, schema=schema, table=item)
                scores = {"name": item, "meta": meta}
                table_list.append(scores)
        return table_list

    @staticmethod
    def oracle_getmeta(database, table, schema, engine=None):
        meta_res = engine.execute(
            '''
                select t.table_name,
                       t.column_name,
                       t.data_type,
                       t.data_length,
                       t.nullable,
                       t.column_id,
                       c.comments,
                       (SELECT CASE WHEN t.column_name = m.column_name THEN 1 ELSE 0 END FROM DUAL) iskey
                FROM user_tab_cols t,
                     user_col_comments c,
                     (select m.column_name
                      from user_constraints s,
                           user_cons_columns m
                      where lower(m.table_name) = '{0}'
                        and m.table_name = s.table_name
                        and m.constraint_name = s.constraint_name
                        and s.constraint_type = 'P') m
                WHERE lower(t.table_name) = '{1}'
                  and c.table_name = t.table_name
                  and c.column_name = t.column_name
                  and t.hidden_column = 'NO'
                order by t.column_id
            '''.format(table, table)
        ).fetchall()
        meta = []
        i = 0
        for colData in meta_res:
            scores = {"key": colData.column_name, "colIndex": i, "dataType": colData.data_type}
            meta.append(scores)
            i += 1
        return meta

    @staticmethod
    def oracle_getdata(uri, database, table, rows_num):
        engine = create_engine(uri, echo=True)
        data_res = engine.execute('select * from ' + table + ' where rownum <= ' + rows_num).fetchall()
        data = []
        for row in data_res:
            rows = []
            for item in row:
                rows.append(item)
            data.append(rows)
        return data

    @staticmethod
    def oracle_getdetail(uri, database, table, schema, rows_num):
        engine = create_engine(uri, echo=True)
        meta = basefunc.oracle_getmeta(database=database, schema=schema, table=table, engine=engine)
        sql = f'select * from {table} where rownum <= {rows_num}'
        res_list = basefunc.oracle_getresult(sql=sql, engine=engine)
        return [meta, res_list[0], res_list[1]]

    @staticmethod
    def oracle_getresult(sql, uri=None, engine=None):
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
