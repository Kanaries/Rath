# 2022/9/13
# 9:13
from sqlalchemy import create_engine
import numbers
import json
from urllib.parse import parse_qs, urlparse


def _rows_from_result(res):
    col_res = res.keys()
    columns = [column for column in col_res]
    sql_result = []
    for row in res.fetchall():
        rows = []
        for item in row:
            if isinstance(item, numbers.Number):
                rows.append(item)
            else:
                rows.append(str(item))
        sql_result.append(rows)
    return columns, sql_result


def _mongo_flatten_doc(doc, prefix=''):
    items = {}
    if not isinstance(doc, dict):
        return {prefix or 'value': doc}
    for key, value in doc.items():
        field = f'{prefix}.{key}' if prefix else key
        if isinstance(value, dict):
            items.update(_mongo_flatten_doc(value, field))
        elif isinstance(value, list):
            items[field] = json.dumps(value, default=str)
        else:
            items[field] = value
    return items


def _clickzetta_schema_from_uri(uri):
    query = parse_qs(urlparse(uri).query)
    schema_values = query.get('schema') or query.get('Schema')
    if schema_values:
        return schema_values[0]
    return None


def _mongo_collect_field_order(docs):
    field_order = []
    for doc in docs:
        for key in _mongo_flatten_doc(doc).keys():
            if key not in field_order:
                field_order.append(key)
    if not field_order:
        field_order = ['_id']
    return field_order


class basefunc:
    # athena
    @staticmethod
    def athena_getdb(uri, schema,**kwargs):
        engine = create_engine(uri, echo=True)
        res = engine.execute('SHOW DATABASES').fetchall()
        db_list = []
        for row in res:
            for item in row:
                db_list.append(item)
        return db_list

    @staticmethod
    def athena_gettable(uri, database, schema,**kwargs):
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
    def athena_getmeta(database, table, schema, engine=None,**kwargs):
        meta_res = engine.execute('select * from ' + database + '.' + table + ' limit 500').keys()
        meta = []
        i = 0
        for col_data in meta_res:
            scores = {"key": col_data, "colIndex": i, "dataType": None}
            meta.append(scores)
            i += 1
        return meta

    @staticmethod
    def athena_getdata(uri, database, table, schema, rows_num,**kwargs):
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
    def athena_getdetail(uri, database, table, schema, rows_num,**kwargs):
        engine = create_engine(uri, echo=True)
        meta = basefunc.athena_getmeta(database=database, schema=schema, table=table, engine=engine)
        sql = f'select * from {database}.{table} limit {rows_num}'
        res_list = basefunc.athena_getresult(sql=sql, engine=engine)
        return [meta, res_list[0], res_list[1]]

    @staticmethod
    def athena_getresult(sql, uri=None, engine=None,**kwargs):
        if engine is None:
            engine = create_engine(uri, echo=True)
        res = engine.execute(sql)
        data_res = res.fetchall()
        col_res = res.keys()
        sql_result = []
        for row in data_res:
            rows = []
            for item in row:
                if isinstance(item, numbers.Number):
                    rows.append(item)
                else:
                    rows.append(str(item))
            sql_result.append(rows)
        columns = []
        for column in col_res:
            columns.append(column)
        return [columns, sql_result]

    # bigquery
    @staticmethod
    def bigquery_getdb(uri, schema, credentials,**kwargs):
        project_id = uri.split(r'//')[1]
        engine = create_engine(uri, credentials_base64=credentials, echo=True)
        res = engine.execute('SELECT schema_name FROM {0}.INFORMATION_SCHEMA.SCHEMATA'.format(project_id)).fetchall()
        db_list = []
        for row in res:
            for item in row:
                db_list.append(item)
        return db_list

    @staticmethod
    def bigquery_gettable(uri, database, schema, credentials,**kwargs):
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
    def bigquery_getmeta(database, table, schema, engine=None,**kwargs):
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
    def bigquery_getdata(uri, database, table, schema, rows_num, credentials,**kwargs):
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
    def bigquery_getdetail(uri, database, table, schema, rows_num, credentials,**kwargs):
        engine = create_engine(uri, credentials_base64=credentials, echo=True)
        meta = basefunc.bigquery_getmeta(database=database, schema=schema, table=table, engine=engine)
        sql = f'select * from {database}.{table} limit {rows_num}'
        res_list = basefunc.bigquery_getresult(sql=sql, engine=engine)
        return [meta, res_list[0], res_list[1]]

    @staticmethod
    def bigquery_getresult(sql, credentials=None, uri=None, engine=None,**kwargs):
        if engine is None:
            engine = create_engine(uri, credentials_base64=credentials, echo=True)
        res = engine.execute(sql)
        data_res = res.fetchall()
        col_res = res.keys()
        sql_result = []
        for row in data_res:
            rows = []
            for item in row:
                if isinstance(item, numbers.Number):
                    rows.append(item)
                else:
                    rows.append(str(item))
            sql_result.append(rows)
        columns = []
        for col_data in col_res:
            columns.append(col_data)
        return [columns, sql_result]

    # clickhouse
    @staticmethod
    def clickhouse_getdb(uri, schema,**kwargs):
        engine = create_engine(uri, echo=True)
        res = engine.execute('SHOW DATABASES').fetchall()
        db_list = []
        for row in res:
            for item in row:
                db_list.append(item)
        return db_list

    @staticmethod
    def clickhouse_gettable(uri, database, schema,**kwargs):
        engine = create_engine(uri, echo=True)
        res = engine.execute(r'SHOW TABLES FROM `{0}`'.format(database)).fetchall()
        table_list = []
        for row in res:
            for item in row:
                meta = basefunc.clickhouse_getmeta(database=database, schema=schema, table=item, engine=engine)
                scores = {"name": item, "meta": meta}
                table_list.append(scores)
        return table_list

    @staticmethod
    def clickhouse_getmeta(database, table, schema, engine=None,**kwargs):
        meta_res = engine.execute(r'desc `{0}`.`{1}`'.format(database, table)).fetchall()
        meta = []
        i = 0
        for col_data in meta_res:
            scores = {"key": col_data.name, "colIndex": i, "dataType": col_data.type}
            meta.append(scores)
            i += 1
        return meta

    @staticmethod
    def clickhouse_getdata(uri, database, table, schema, rows_num,**kwargs):
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
    def clickhouse_getdetail(uri, database, table, schema, rows_num,**kwargs):
        engine = create_engine(uri, echo=True)
        meta = basefunc.clickhouse_getmeta(database=database, schema=schema, table=table, engine=engine)
        sql = f'select * from `{database}`.`{table}` limit {rows_num}'
        res_list = basefunc.clickhouse_getresult(sql=sql, engine=engine)
        return [meta, res_list[0], res_list[1]]

    @staticmethod
    def clickhouse_getresult(sql, uri=None, engine=None,**kwargs):
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
                if isinstance(item, numbers.Number):
                    rows.append(item)
                else:
                    rows.append(str(item))
            sql_result.append(rows)
        return [columns, sql_result]

    # drill
    @staticmethod
    def drill_getdb(uri, schema,**kwargs):
        engine = create_engine(uri, echo=True)
        res = engine.execute('SHOW DATABASES').fetchall()
        db_list = []
        for row in res:
            for item in row:
                db_list.append(item)
        return db_list

    @staticmethod
    def drill_gettable(uri, database, schema,**kwargs):
        engine = create_engine(uri, echo=True)
        res = engine.execute('SHOW TABLES FROM ' + database).fetchall()
        table_list = []
        for row in res:
            meta = basefunc.drill_getmeta(database=database, schema=schema, table=row.TABLE_NAME, engine=engine)
            scores = {"name": row.TABLE_NAME, "meta": meta}
            table_list.append(scores)
        return table_list

    @staticmethod
    def drill_getmeta(database, table, schema, engine=None,**kwargs):
        meta_res = engine.execute('desc ' + database + '.' + table).fetchall()
        meta = []
        i = 0
        for colData in meta_res:
            scores = {"key": colData.COLUMN_NAME, "colIndex": i, "dataType": colData.DATA_TYPE}
            meta.append(scores)
            i += 1
        return meta

    @staticmethod
    def drill_getdata(uri, database, table, schema, rows_num,**kwargs):
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
    def drill_getdetail(uri, database, table, schema, rows_num,**kwargs):
        engine = create_engine(uri, echo=True)
        meta = basefunc.drill_getmeta(database=database, schema=schema, table=table, engine=engine)
        sql = f'select * from {database}.{table} limit {rows_num}'
        res_list = basefunc.drill_getresult(sql=sql, engine=engine)
        return [meta, res_list[0], res_list[1]]

    @staticmethod
    def drill_getresult(sql, uri=None, engine=None,**kwargs):
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
                if isinstance(item, numbers.Number):
                    rows.append(item)
                else:
                    rows.append(str(item))
            sql_result.append(rows)
        return [columns, sql_result]

    # druid
    @staticmethod
    def druid_getschema(uri, db,**kwargs):
        engine = create_engine(uri, echo=True)
        res = engine.execute('select SCHEMA_NAME from INFORMATION_SCHEMA.SCHEMATA ').fetchall()
        db_list = []
        for row in res:
            for item in row:
                db_list.append(item)
        return db_list

    @staticmethod
    def druid_gettable(uri, database, schema,**kwargs):
        engine = create_engine(uri, echo=True)
        res = engine.execute(
            'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = \'' + schema + '\'').fetchall()
        table_list = []
        for row in res:
            meta = basefunc.druid_getmeta(database=database, schema=schema, table=row.TABLE_NAME, engine=engine)
            scores = {"name": row.TABLE_NAME, "meta": meta}
            table_list.append(scores)
        return table_list

    @staticmethod
    def druid_getmeta(database, table, schema, engine=None,**kwargs):
        meta_res = engine.execute(
            'select COLUMN_NAME, DATA_TYPE from INFORMATION_SCHEMA.COLUMNS where TABLE_SCHEMA = \'' + schema + '\' and  TABLE_NAME = \'' + table + '\'').fetchall()
        meta = []
        i = 0
        for colData in meta_res:
            scores = {"key": colData.COLUMN_NAME, "colIndex": i, "dataType": colData.DATA_TYPE}
            meta.append(scores)
            i += 1
        return meta

    @staticmethod
    def druid_getdata(uri, database, table, schema, rows_num,**kwargs):
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
    def druid_getdetail(uri, database, table, schema, rows_num,**kwargs):
        engine = create_engine(uri, echo=True)
        meta = basefunc.druid_getmeta(database=database, schema=schema, table=table, engine=engine)
        sql = f'select * from {schema}.{table} limit {rows_num}'
        res_list = basefunc.druid_getresult(sql=sql, engine=engine)
        return [meta, res_list[0], res_list[1]]

    @staticmethod
    def druid_getresult(sql, uri=None, engine=None,**kwargs):
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
                if isinstance(item, numbers.Number):
                    rows.append(item)
                else:
                    rows.append(str(item))
            sql_result.append(rows)
        return [columns, sql_result]

    # impala
    @staticmethod
    def impala_getdb(uri, schema,**kwargs):
        engine = create_engine(uri, echo=True)
        res = engine.execute('SHOW DATABASES').fetchall()
        db_list = []
        for row in res:
            for item in row:
                db_list.append(item)
        return db_list

    @staticmethod
    def impala_gettable(uri, database, schema,**kwargs):
        engine = create_engine(uri, echo=True)
        res = engine.execute('SHOW TABLES FROM ' + database).fetchall()
        table_list = []
        for row in res:
            for item in row:
                meta = basefunc.impala_getmeta(engine=engine, database=database, schema=schema, table=item)
                scores = {"name": item, "meta": meta}
                table_list.append(scores)
        return table_list

    @staticmethod
    def impala_getmeta(database, table, schema, engine=None,**kwargs):
        meta_res = engine.execute('desc ' + database + '.' + table).fetchall()
        meta = []
        i = 0
        for colData in meta_res:
            scores = {"key": colData.col_name, "colIndex": i, "dataType": colData.data_type}
            meta.append(scores)
            i += 1
        return meta

    @staticmethod
    def impala_getdata(uri, database, table, schema, rows_num,**kwargs):
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
    def impala_getdetail(uri, database, table, schema, rows_num,**kwargs):
        engine = create_engine(uri, echo=True)
        meta = basefunc.impala_getmeta(database=database, schema=schema, table=table, engine=engine)
        sql = f'select * from {database}.{table} limit {rows_num}'
        res_list = basefunc.impala_getresult(sql=sql, engine=engine)
        return [meta, res_list[0], res_list[1]]

    @staticmethod
    def impala_getresult(sql, uri=None, engine=None,**kwargs):
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
                if isinstance(item, numbers.Number):
                    rows.append(item)
                else:
                    rows.append(str(item))
            sql_result.append(rows)
        return [columns, sql_result]

    # kylin
    @staticmethod
    def kylin_getmeta(database, table, schema, engine=None,**kwargs):
        meta_res = engine.execute('select * from ' + schema + '.' + table + ' limit 500').keys()
        meta = []
        i = 0
        for colData in meta_res:
            scores = {"key": colData, "colIndex": i, "dataType": None}
            meta.append(scores)
            i += 1
        return meta

    @staticmethod
    def kylin_getdata(uri, database, table, schema, rows_num,**kwargs):
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
    def kylin_getdetail(uri, database, table, schema, rows_num,**kwargs):
        engine = create_engine(uri, echo=True)
        meta = basefunc.kylin_getmeta(database=database, schema=schema, table=table, engine=engine)
        sql = f'select * from {schema}.{table} limit {rows_num}'
        res_list = basefunc.kylin_getresult(sql=sql, engine=engine)
        return [meta, res_list[0], res_list[1]]

    @staticmethod
    def kylin_getresult(sql, uri=None, engine=None,**kwargs):
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
                if isinstance(item, numbers.Number):
                    rows.append(item)
                else:
                    rows.append(str(item))
            sql_result.append(rows)
        return [columns, sql_result]

    # mysql
    @staticmethod
    def mysql_getdb(uri, schema,**kwargs):
        engine = create_engine(uri, echo=True)
        res = engine.execute('SHOW DATABASES').fetchall()
        db_list = []
        for row in res:
            for item in row:
                db_list.append(item)
        return db_list

    @staticmethod
    def mysql_gettable(uri, database, schema,**kwargs):
        engine = create_engine(uri, echo=True)
        res = engine.execute('SHOW TABLES FROM ' + database).fetchall()
        table_list = []
        for row in res:
            for item in row:
                meta = basefunc.mysql_getmeta(engine=engine, database=database, schema=schema, table=item)
                scores = {"name": item, "meta": meta}
                table_list.append(scores)
        return table_list

    @staticmethod
    def mysql_getmeta(database, table, schema, engine=None,**kwargs):
        meta_res = engine.execute('desc ' + database + '.' + table).fetchall()
        meta = []
        i = 0
        for col_data in meta_res:
            scores = {"key": col_data.Field, "colIndex": i, "dataType": col_data.Type}
            meta.append(scores)
            i += 1
        return meta

    @staticmethod
    def mysql_getdata(uri, database, table, schema, rows_num,**kwargs):
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
    def mysql_getdetail(uri, database, table, schema, rows_num,**kwargs):
        engine = create_engine(uri, echo=True)
        meta = basefunc.mysql_getmeta(database=database, schema=schema, table=table, engine=engine)
        sql = f'select * from {database}.{table} limit {rows_num}'
        res_list = basefunc.mysql_getresult(sql=sql, engine=engine)
        return [meta, res_list[0], res_list[1]]

    @staticmethod
    def mysql_getresult(sql, uri=None, engine=None,**kwargs):
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
                if isinstance(item, numbers.Number):
                    rows.append(item)
                else:
                    rows.append(str(item))
            sql_result.append(rows)
        return [columns, sql_result]

    # oracle
    @staticmethod
    def oracle_gettable(uri, database, schema,**kwargs):
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
    def oracle_getmeta(database, table, schema, engine=None,**kwargs):
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
    def oracle_getdata(uri, database, table, rows_num,**kwargs):
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
    def oracle_getdetail(uri, database, table, schema, rows_num,**kwargs):
        engine = create_engine(uri, echo=True)
        meta = basefunc.oracle_getmeta(database=database, schema=schema, table=table, engine=engine)
        sql = f'select * from {table} where rownum <= {rows_num}'
        res_list = basefunc.oracle_getresult(sql=sql, engine=engine)
        return [meta, res_list[0], res_list[1]]

    @staticmethod
    def oracle_getresult(sql, uri=None, engine=None,**kwargs):
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
                if isinstance(item, numbers.Number):
                    rows.append(item)
                else:
                    rows.append(str(item))
            sql_result.append(rows)
        return [columns, sql_result]

    # postgres
    @staticmethod
    def postgres_getschema(uri, db,**kwargs):
        engine = create_engine(uri, echo=True)
        with engine.connect() as conn:
            res = engine.execute('select nspname from pg_catalog.pg_namespace').fetchall()
            schema_list = []
            for row in res:
                for item in row:
                    schema_list.append(item)
            return schema_list

    @staticmethod
    def postgres_gettable(uri, database, schema,**kwargs):
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
    def postgres_getmeta(database, table, schema, engine=None,**kwargs):
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
    def postgres_getdata(uri, database, table, schema, rows_num,**kwargs):
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
    def postgres_getdetail(uri, database, table, schema, rows_num,**kwargs):
        engine = create_engine(uri, echo=True)
        meta = basefunc.postgres_getmeta(database=database, schema=schema, table=table, engine=engine)
        sql = f'select * from {schema}.{table} limit {rows_num}'
        res_list = basefunc.postgres_getresult(sql=sql, engine=engine)
        return [meta, res_list[0], res_list[1]]

    @staticmethod
    def postgres_getresult(sql, uri=None, engine=None,**kwargs):
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
                if isinstance(item, numbers.Number):
                    rows.append(item)
                else:
                    rows.append(str(item))
            sql_result.append(rows)
        return [columns, sql_result]

    # redshift
    @staticmethod
    def redshift_getdb(uri, schema,**kwargs):
        engine = create_engine(uri, echo=True)
        res = engine.execute('select nspname from pg_namespace').fetchall()
        db_list = []
        for row in res:
            for item in row:
                db_list.append(item)
        return db_list

    @staticmethod
    def redshift_gettable(uri, database, schema,**kwargs):
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
    def redshift_getmeta(database, table, schema, engine=None,**kwargs):
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
    def redshift_getdata(uri, database, table, schema, rows_num,**kwargs):
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
    def redshift_getdetail(uri, database, table, schema, rows_num,**kwargs):
        engine = create_engine(uri, echo=True)
        meta = basefunc.redshift_getmeta(database=database, schema=schema, table=table, engine=engine)
        sql = f'select * from {database}.{table} limit {rows_num}'
        res_list = basefunc.redshift_getresult(sql=sql, engine=engine)
        return [meta, res_list[0], res_list[1]]

    @staticmethod
    def redshift_getresult(sql, uri=None, engine=None,**kwargs):
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
                if isinstance(item, numbers.Number):
                    rows.append(item)
                else:
                    rows.append(str(item))
            sql_result.append(rows)
        return [columns, sql_result]

    # snowflake
    @staticmethod
    def snowflake_getdb(uri, schema,**kwargs):
        engine = create_engine(uri, echo=True)
        res = engine.execute('SHOW DATABASES').fetchall()
        db_list = []
        for row in res:
            db_list.append(row.name)
        return db_list

    @staticmethod
    def snowflake_getschema(uri, db,**kwargs):
        engine = create_engine(uri, echo=True)
        res = engine.execute('show schemas in database {0}'.format(db)).fetchall()
        schema_list = []
        for row in res:
            schema_list.append(row.name)
        return schema_list

    @staticmethod
    def snowflake_gettable(uri, database, schema,**kwargs):
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
    def snowflake_getmeta(database, table, schema, engine=None,**kwargs):
        meta_res = engine.execute('desc table {0}.{1}.{2}'.format(database, schema, table)).fetchall()
        meta = []
        i = 0
        for colData in meta_res:
            scores = {"key": colData.name, "colIndex": i, "dataType": colData.type}
            meta.append(scores)
            i += 1
        return meta

    @staticmethod
    def snowflake_getdata(uri, database, table, schema, rows_num,**kwargs):
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
    def snowflake_getdetail(uri, database, table, schema, rows_num,**kwargs):
        engine = create_engine(uri, echo=True)
        meta = basefunc.snowflake_getmeta(database=database, schema=schema, table=table, engine=engine)
        sql = f'select * from {database}.{schema}.{table} limit {rows_num}'
        res_list = basefunc.snowflake_getresult(sql=sql, engine=engine)
        return [meta, res_list[0], res_list[1]]

    @staticmethod
    def snowflake_getresult(sql, uri=None, engine=None,**kwargs):
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
                if isinstance(item, numbers.Number):
                    rows.append(item)
                else:
                    rows.append(str(item))
            sql_result.append(rows)
        return [columns, sql_result]

    # sparksql
    @staticmethod
    def sparksql_getdb(uri, schema,**kwargs):
        engine = create_engine(uri, echo=True)
        res = engine.execute('SHOW DATABASES').fetchall()
        db_list = []
        for row in res:
            for item in row:
                db_list.append(item)
        return db_list

    @staticmethod
    def sparksql_gettable(uri, database, schema,**kwargs):
        engine = create_engine(uri, echo=True)
        res = engine.execute('SHOW TABLES FROM ' + database).fetchall()
        table_list = []
        for row in res:
            for item in row:
                meta = basefunc.sparksql_getmeta(engine=engine, database=database, schema=schema, table=item)
                scores = {"name": item, "meta": meta}
                table_list.append(scores)
        return table_list

    @staticmethod
    def sparksql_getmeta(database, table, schema, engine=None,**kwargs):
        meta_res = engine.execute('desc ' + database + '.' + table).fetchall()
        meta = []
        i = 0
        for colData in meta_res:
            scores = {"key": colData.col_name, "colIndex": i, "dataType": colData.data_type}
            meta.append(scores)
            i += 1
        return meta

    @staticmethod
    def sparksql_getdata(uri, database, table, schema, rows_num,**kwargs):
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
    def sparksql_getdetail(uri, database, table, schema, rows_num,**kwargs):
        engine = create_engine(uri, echo=True)
        meta = basefunc.sparksql_getmeta(database=database, schema=schema, table=table, engine=engine)
        sql = f'select * from {database}.{table} limit {rows_num}'
        res_list = basefunc.sparksql_getresult(sql=sql, engine=engine)
        return [meta, res_list[0], res_list[1]]

    @staticmethod
    def sparksql_getresult(sql, uri=None, engine=None,**kwargs):
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
                if isinstance(item, numbers.Number):
                    rows.append(item)
                else:
                    rows.append(str(item))
            sql_result.append(rows)
        return [columns, sql_result]

    # sqlserver
    @staticmethod
    def sqlserver_getdb(uri, schema,**kwargs):
        engine = create_engine(uri, echo=True)
        res = engine.execute('SELECT name FROM sys.databases').fetchall()
        db_list = []
        for row in res:
            for item in row:
                db_list.append(item)
        return db_list

    @staticmethod
    def sqlserver_getschema(uri, db,**kwargs):
        engine = create_engine(uri, echo=True)
        res = engine.execute('SELECT name FROM {0}.sys.schemas'.format(db)).fetchall()
        schema_list = []
        for row in res:
            for item in row:
                schema_list.append(item)
        return schema_list

    @staticmethod
    def sqlserver_gettable(uri, database, schema,**kwargs):
        engine = create_engine(uri, echo=True)
        res = engine.execute(
            '''
            SELECT t.name FROM {0}.sys.tables AS t INNER JOIN {1}.sys.schemas AS s ON s.schema_id = t.schema_id WHERE s.name = '{2}'
            '''.format(
                database, database, schema)).fetchall()
        table_list = []
        for row in res:
            for item in row:
                meta = basefunc.sqlserver_getmeta(engine=engine, database=database, schema=schema, table=item)
                scores = {"name": item, "meta": meta}
                table_list.append(scores)
        return table_list

    @staticmethod
    def sqlserver_getmeta(database, table, schema, engine=None,**kwargs):
        meta_res = engine.execute('''
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
        for colData in meta_res:
            scores = {"key": colData.table_name, "colIndex": i, "dataType": colData.table_column}
            meta.append(scores)
            i += 1
        return meta

    @staticmethod
    def sqlserver_getdata(uri, database, table, schema, rows_num,**kwargs):
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
    def sqlserver_getdetail(uri, database, table, schema, rows_num,**kwargs):
        engine = create_engine(uri, echo=True)
        meta = basefunc.sqlserver_getmeta(database=database, schema=schema, table=table, engine=engine)
        sql = f'select top {rows_num} * from {database}.{schema}.{table}'
        res_list = basefunc.sqlserver_getresult(sql=sql, engine=engine)
        return [meta, res_list[0], res_list[1]]

    @staticmethod
    def sqlserver_getresult(sql, uri=None, engine=None,**kwargs):
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
                if isinstance(item, numbers.Number):
                    rows.append(item)
                else:
                    rows.append(str(item))
            sql_result.append(rows)
        return [columns, sql_result]

    # sqlite
    @staticmethod
    def sqlite_gettable(uri, database, schema,**kwargs):
        engine = create_engine(uri, echo=True)
        res = engine.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        ).fetchall()
        table_list = []
        for row in res:
            for item in row:
                meta = basefunc.sqlite_getmeta(database=database, schema=schema, table=item, engine=engine)
                table_list.append({"name": item, "meta": meta})
        return table_list

    @staticmethod
    def sqlite_getmeta(database, table, schema, engine=None,**kwargs):
        meta_res = engine.execute(f'PRAGMA table_info("{table}")').fetchall()
        meta = []
        for i, col_data in enumerate(meta_res):
            meta.append({"key": col_data.name, "colIndex": i, "dataType": col_data.type})
        return meta

    @staticmethod
    def sqlite_getdata(uri, database, table, schema, rows_num,**kwargs):
        engine = create_engine(uri, echo=True)
        data_res = engine.execute(f'SELECT * FROM "{table}" LIMIT {rows_num}').fetchall()
        return [list(row) for row in data_res]

    @staticmethod
    def sqlite_getdetail(uri, database, table, schema, rows_num,**kwargs):
        engine = create_engine(uri, echo=True)
        meta = basefunc.sqlite_getmeta(database=database, schema=schema, table=table, engine=engine)
        sql = f'SELECT * FROM "{table}" LIMIT {rows_num}'
        res_list = basefunc.sqlite_getresult(sql=sql, engine=engine)
        return [meta, res_list[0], res_list[1]]

    @staticmethod
    def sqlite_getresult(sql, uri=None, engine=None,**kwargs):
        if engine is None:
            engine = create_engine(uri, echo=True)
        res = engine.execute(sql)
        columns, sql_result = _rows_from_result(res)
        return [columns, sql_result]

    # duckdb
    @staticmethod
    def duckdb_getschema(uri, db,**kwargs):
        engine = create_engine(uri, echo=True)
        res = engine.execute(
            "SELECT schema_name FROM information_schema.schemata ORDER BY schema_name"
        ).fetchall()
        schema_list = []
        for row in res:
            for item in row:
                if item not in ('information_schema', 'pg_catalog'):
                    schema_list.append(item)
        return schema_list or ['main']

    @staticmethod
    def duckdb_gettable(uri, database, schema,**kwargs):
        engine = create_engine(uri, echo=True)
        schema_name = schema or 'main'
        res = engine.execute(
            "SELECT table_name FROM information_schema.tables "
            f"WHERE table_schema = '{schema_name}' AND table_type = 'BASE TABLE' ORDER BY table_name"
        ).fetchall()
        table_list = []
        for row in res:
            for item in row:
                meta = basefunc.duckdb_getmeta(database=database, schema=schema_name, table=item, engine=engine)
                table_list.append({"name": item, "meta": meta})
        return table_list

    @staticmethod
    def duckdb_getmeta(database, table, schema, engine=None,**kwargs):
        schema_name = schema or 'main'
        meta_res = engine.execute(
            "SELECT column_name, data_type FROM information_schema.columns "
            f"WHERE table_schema = '{schema_name}' AND table_name = '{table}' ORDER BY ordinal_position"
        ).fetchall()
        meta = []
        for i, col_data in enumerate(meta_res):
            meta.append({"key": col_data.column_name, "colIndex": i, "dataType": col_data.data_type})
        return meta

    @staticmethod
    def duckdb_getdata(uri, database, table, schema, rows_num,**kwargs):
        engine = create_engine(uri, echo=True)
        schema_name = schema or 'main'
        data_res = engine.execute(
            f'SELECT * FROM "{schema_name}"."{table}" LIMIT {rows_num}'
        ).fetchall()
        return [list(row) for row in data_res]

    @staticmethod
    def duckdb_getdetail(uri, database, table, schema, rows_num,**kwargs):
        engine = create_engine(uri, echo=True)
        schema_name = schema or 'main'
        meta = basefunc.duckdb_getmeta(database=database, schema=schema_name, table=table, engine=engine)
        sql = f'SELECT * FROM "{schema_name}"."{table}" LIMIT {rows_num}'
        res_list = basefunc.duckdb_getresult(sql=sql, engine=engine)
        return [meta, res_list[0], res_list[1]]

    @staticmethod
    def duckdb_getresult(sql, uri=None, engine=None,**kwargs):
        if engine is None:
            engine = create_engine(uri, echo=True)
        res = engine.execute(sql)
        columns, sql_result = _rows_from_result(res)
        return [columns, sql_result]

    # clickzetta
    @staticmethod
    def clickzetta_getschema(uri, db,**kwargs):
        schema_from_uri = _clickzetta_schema_from_uri(uri)
        engine = create_engine(uri, echo=True)
        try:
            res = engine.execute('SHOW SCHEMAS').fetchall()
            schema_list = []
            for row in res:
                for item in row:
                    schema_list.append(item)
            if schema_list:
                return schema_list
        except Exception:
            pass
        try:
            res = engine.execute(
                "SELECT schema_name FROM information_schema.schemata ORDER BY schema_name"
            ).fetchall()
            schema_list = []
            for row in res:
                for item in row:
                    schema_list.append(item)
            if schema_list:
                return schema_list
        except Exception:
            pass
        if schema_from_uri:
            return [schema_from_uri]
        raise ValueError(
            'Could not list ClickZetta schemas. Include ?schema=your_schema in the connection URI.'
        )

    @staticmethod
    def clickzetta_gettable(uri, database, schema,**kwargs):
        engine = create_engine(uri, echo=True)
        schema_name = schema or _clickzetta_schema_from_uri(uri) or 'public'
        try:
            res = engine.execute(f'SHOW TABLES IN {schema_name}').fetchall()
        except Exception:
            res = engine.execute(
                "SELECT table_name FROM information_schema.tables "
                f"WHERE table_schema = '{schema_name}' ORDER BY table_name"
            ).fetchall()
        table_list = []
        for row in res:
            for item in row:
                meta = basefunc.clickzetta_getmeta(
                    database=database, schema=schema_name, table=item, engine=engine
                )
                table_list.append({"name": item, "meta": meta})
        return table_list

    @staticmethod
    def clickzetta_getmeta(database, table, schema, engine=None,**kwargs):
        schema_name = schema or 'public'
        meta_res = engine.execute(
            "SELECT column_name, data_type FROM information_schema.columns "
            f"WHERE table_schema = '{schema_name}' AND table_name = '{table}' ORDER BY ordinal_position"
        ).fetchall()
        meta = []
        for i, col_data in enumerate(meta_res):
            meta.append({"key": col_data.column_name, "colIndex": i, "dataType": col_data.data_type})
        return meta

    @staticmethod
    def clickzetta_getdata(uri, database, table, schema, rows_num,**kwargs):
        engine = create_engine(uri, echo=True)
        schema_name = schema or 'public'
        data_res = engine.execute(
            f'SELECT * FROM {schema_name}.{table} LIMIT {rows_num}'
        ).fetchall()
        return [list(row) for row in data_res]

    @staticmethod
    def clickzetta_getdetail(uri, database, table, schema, rows_num,**kwargs):
        engine = create_engine(uri, echo=True)
        schema_name = schema or 'public'
        meta = basefunc.clickzetta_getmeta(database=database, schema=schema_name, table=table, engine=engine)
        sql = f'SELECT * FROM {schema_name}.{table} LIMIT {rows_num}'
        res_list = basefunc.clickzetta_getresult(sql=sql, engine=engine)
        return [meta, res_list[0], res_list[1]]

    @staticmethod
    def clickzetta_getresult(sql, uri=None, engine=None,**kwargs):
        if engine is None:
            engine = create_engine(uri, echo=True)
        res = engine.execute(sql)
        columns, sql_result = _rows_from_result(res)
        return [columns, sql_result]

    # mongodb
    @staticmethod
    def _mongo_client(uri, **kwargs):
        from pymongo import MongoClient
        return MongoClient(uri, serverSelectionTimeoutMS=5000)

    @staticmethod
    def mongo_getdb(uri, schema,**kwargs):
        client = basefunc._mongo_client(uri)
        return sorted(client.list_database_names())

    @staticmethod
    def mongo_gettable(uri, database, schema,**kwargs):
        client = basefunc._mongo_client(uri)
        db = client[database]
        table_list = []
        for collection_name in sorted(db.list_collection_names()):
            sample = db[collection_name].find_one() or {'_id': None}
            flattened = _mongo_flatten_doc(sample)
            meta = [
                {"key": key, "colIndex": index, "dataType": type(value).__name__}
                for index, (key, value) in enumerate(flattened.items())
            ]
            table_list.append({"name": collection_name, "meta": meta})
        return table_list

    @staticmethod
    def mongo_getmeta(database, table, schema, engine=None, uri=None,**kwargs):
        client = basefunc._mongo_client(uri)
        sample = client[database][table].find_one() or {}
        flattened = _mongo_flatten_doc(sample)
        return [
            {"key": key, "colIndex": index, "dataType": type(value).__name__}
            for index, (key, value) in enumerate(flattened.items())
        ]

    @staticmethod
    def mongo_getdata(uri, database, table, schema, rows_num,**kwargs):
        client = basefunc._mongo_client(uri)
        docs = list(client[database][table].find().limit(int(rows_num)))
        field_order = _mongo_collect_field_order(docs)
        rows = []
        for doc in docs:
            flattened = _mongo_flatten_doc(doc)
            rows.append([flattened.get(key, None) for key in field_order])
        return rows

    @staticmethod
    def mongo_getdetail(uri, database, table, schema, rows_num,**kwargs):
        client = basefunc._mongo_client(uri)
        docs = list(client[database][table].find().limit(int(rows_num)))
        field_order = _mongo_collect_field_order(docs)
        meta = [
            {"key": key, "colIndex": index, "dataType": None}
            for index, key in enumerate(field_order)
        ]
        rows = []
        for doc in docs:
            flattened = _mongo_flatten_doc(doc)
            rows.append([flattened.get(key, None) for key in field_order])
        return [meta, field_order, rows]

    @staticmethod
    def mongo_getresult(sql, uri=None, engine=None,**kwargs):
        client = basefunc._mongo_client(uri)
        database = kwargs.get('database')
        if not database:
            raise ValueError(
                'MongoDB queries require a selected database. Browse to a database and collection first, '
                'or use the table browser to import data.'
            )
        db = client[database]
        query = (sql or '').strip()
        collection_name = kwargs.get('table')
        if query.startswith('['):
            if not collection_name:
                raise ValueError('MongoDB aggregation queries require a selected collection from the browser.')
            pipeline = json.loads(query)
            cursor = db[collection_name].aggregate(pipeline)
        elif query:
            cursor = db[query].find().limit(500)
            collection_name = query
        elif collection_name:
            cursor = db[collection_name].find().limit(500)
        else:
            raise ValueError(
                'Enter a collection name as the query, select a collection in the browser, '
                'or provide a JSON aggregation pipeline.'
            )
        docs = list(cursor)
        field_order = _mongo_collect_field_order(docs)
        rows = []
        for doc in docs:
            flattened = _mongo_flatten_doc(doc)
            row = []
            for key in field_order:
                value = flattened.get(key, None)
                if isinstance(value, numbers.Number):
                    row.append(value)
                else:
                    row.append(str(value) if value is not None else None)
            rows.append(row)
        return [field_order, rows]


for _name in ('getdb', 'gettable', 'getmeta', 'getdata', 'getdetail', 'getresult'):
    setattr(basefunc, f'mariadb_{_name}', getattr(basefunc, f'mysql_{_name}'))
