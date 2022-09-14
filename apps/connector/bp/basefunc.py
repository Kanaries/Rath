# 2022/9/13
# 9:13
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
                table_list.append(item)
        return table_list

    @staticmethod
    def athena_getmeta(uri, database, table, schema):
        engine = create_engine(uri, echo=True)
        metaRes = engine.execute('select * from ' + database + '.' + table + ' limit 500').keys()
        meta = []
        i = 1
        for colData in metaRes:
            scores = {"key": colData, "colIndex": i, "dataType": None}
            meta.append(scores)
            i += 1
        return meta

    @staticmethod
    def athena_getdata(uri, database, table, schema):
        engine = create_engine(uri, echo=True)
        dataRes = engine.execute('select * from ' + database + '.' + table + ' limit 500').fetchall()
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

    # clickhouse
    @staticmethod
    def clickhouse_getdb(uri, schema):
        engine = create_engine(uri, echo=True)
        res = engine.execute('SHOW DATABASES').fetchall()
        db_list = []
        for row in res:
            for item in row:
                db_list.append(item)
        return db_list

    @staticmethod
    def clickhouse_gettable(uri, database, schema):
        engine = create_engine(uri, echo=True)
        res = engine.execute('SHOW TABLES FROM ' + database).fetchall()
        table_list = []
        for row in res:
            for item in row:
                table_list.append(item)
        return table_list

    @staticmethod
    def clickhouse_getmeta(uri, database, table, schema):
        engine = create_engine(uri, echo=True)
        metaRes = engine.execute('desc ' + database + '.' + table).fetchall()
        meta = []
        i = 1
        for colData in metaRes:
            scores = {"key": colData.name, "colIndex": i, "dataType": colData.type}
            meta.append(scores)
            i += 1
        return meta

    @staticmethod
    def clickhouse_getdata(uri, database, table, schema):
        engine = create_engine(uri, echo=True)
        dataRes = engine.execute('select * from ' + database + '.' + table + ' limit 500').fetchall()
        data = []
        for row in dataRes:
            rows = []
            for item in row:
                rows.append(item)
            data.append(rows)
        return data

    @staticmethod
    def clickhouse_getresult(uri, sql):
        engine = create_engine(uri, echo=True)
        res = engine.execute(sql).fetchall()
        sql_result = []
        for row in res:
            rows = []
            for item in row:
                rows.append(item)
            sql_result.append(rows)
        return sql_result

    # doris
    @staticmethod
    def doris_getdb(uri, schema):
        engine = create_engine(uri, echo=True)
        res = engine.execute('SHOW DATABASES').fetchall()
        db_list = []
        for row in res:
            for item in row:
                db_list.append(item)
        return db_list

    @staticmethod
    def doris_gettable(uri, database, schema):
        engine = create_engine(uri, echo=True)
        res = engine.execute('SHOW TABLES FROM ' + database).fetchall()
        table_list = []
        for row in res:
            for item in row:
                table_list.append(item)
        return table_list

    @staticmethod
    def doris_getmeta(uri, database, table, schema):
        engine = create_engine(uri, echo=True)
        metaRes = engine.execute('show full columns from ' + database + '.' + table).fetchall()
        meta = []
        i = 1
        for colData in metaRes:
            scores = {"key": colData.name, "colIndex": i, "dataType": colData.type}
            meta.append(scores)
            i += 1
        return meta

    @staticmethod
    def doris_getdata(uri, database, table, schema):
        engine = create_engine(uri, echo=True)
        dataRes = engine.execute('select * from ' + database + '.' + table + ' limit 500').fetchall()
        data = []
        for row in dataRes:
            rows = []
            for item in row:
                rows.append(item)
            data.append(rows)
        return data

    @staticmethod
    def doris_getresult(uri, sql):
        engine = create_engine(uri, echo=True)
        res = engine.execute(sql).fetchall()
        sql_result = []
        for row in res:
            rows = []
            for item in row:
                rows.append(item)
            sql_result.append(rows)
        return sql_result

    # drill
    @staticmethod
    def drill_getdb(uri, schema):
        engine = create_engine(uri, echo=True)
        res = engine.execute('SHOW DATABASES').fetchall()
        db_list = []
        for row in res:
            for item in row:
                db_list.append(item)
        return db_list

    @staticmethod
    def drill_gettable(uri, database, schema):
        engine = create_engine(uri, echo=True)
        res = engine.execute('SHOW TABLES FROM ' + database).fetchall()
        table_list = []
        for row in res:
            table_list.append(row.TABLE_NAME)
        return table_list

    @staticmethod
    def drill_getmeta(uri, database, table, schema):
        engine = create_engine(uri, echo=True)
        metaRes = engine.execute('desc ' + database + '.' + table).fetchall()
        meta = []
        i = 1
        for colData in metaRes:
            scores = {"key": colData.COLUMN_NAME, "colIndex": i, "dataType": colData.DATA_TYPE}
            meta.append(scores)
            i += 1
        return meta

    @staticmethod
    def drill_getdata(uri, database, table, schema):
        engine = create_engine(uri, echo=True)
        dataRes = engine.execute('select * from ' + database + '.' + table + ' limit 500').fetchall()
        data = []
        for row in dataRes:
            rows = []
            for item in row:
                rows.append(item)
            data.append(rows)
        return data

    @staticmethod
    def drill_getresult(uri, sql):
        engine = create_engine(uri, echo=True)
        res = engine.execute(sql).fetchall()
        sql_result = []
        for row in res:
            rows = []
            for item in row:
                rows.append(item)
            sql_result.append(rows)
        return sql_result

    # druid
    @staticmethod
    def druid_getschema(uri, db):
        engine = create_engine(uri, echo=True)
        res = engine.execute('select SCHEMA_NAME from INFORMATION_SCHEMA.SCHEMATA ').fetchall()
        db_list = []
        for row in res:
            for item in row:
                db_list.append(item)
        return db_list

    @staticmethod
    def druid_gettable(uri, database, schema):
        engine = create_engine(uri, echo=True)
        res = engine.execute(
            'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = \'' + schema + '\'').fetchall()
        table_list = []
        for row in res:
            table_list.append(row.TABLE_NAME)
        return table_list

    @staticmethod
    def druid_getmeta(uri, database, table, schema):
        engine = create_engine(uri, echo=True)
        metaRes = engine.execute(
            'select COLUMN_NAME, DATA_TYPE from INFORMATION_SCHEMA.COLUMNS where TABLE_SCHEMA = \'' + schema + '\' and  TABLE_NAME = \'' + table + '\'').fetchall()
        meta = []
        i = 1
        for colData in metaRes:
            scores = {"key": colData.COLUMN_NAME, "colIndex": i, "dataType": colData.DATA_TYPE}
            meta.append(scores)
            i += 1
        return meta

    @staticmethod
    def druid_getdata(uri, database, table, schema):
        engine = create_engine(uri, echo=True)
        dataRes = engine.execute('select * from ' + schema + '.' + table + ' limit 500').fetchall()
        data = []
        for row in dataRes:
            rows = []
            for item in row:
                rows.append(item)
            data.append(rows)
        return data

    @staticmethod
    def druid_getresult(uri, sql):
        engine = create_engine(uri, echo=True)
        res = engine.execute(sql).fetchall()
        sql_result = []
        for row in res:
            rows = []
            for item in row:
                rows.append(item)
            sql_result.append(rows)
        return sql_result

    # impala
    @staticmethod
    def impala_getdb(uri, schema):
        engine = create_engine(uri, echo=True)
        res = engine.execute('SHOW DATABASES').fetchall()
        db_list = []
        for row in res:
            for item in row:
                db_list.append(item)
        return db_list

    @staticmethod
    def impala_gettable(uri, database, schema):
        engine = create_engine(uri, echo=True)
        res = engine.execute('SHOW TABLES FROM ' + database).fetchall()
        table_list = []
        for row in res:
            for item in row:
                table_list.append(item)
        return table_list

    @staticmethod
    def impala_getmeta(uri, database, table, schema):
        engine = create_engine(uri, echo=True)
        metaRes = engine.execute('desc ' + database + '.' + table).fetchall()
        meta = []
        i = 1
        for colData in metaRes:
            scores = {"key": colData.col_name, "colIndex": i, "dataType": colData.data_type}
            meta.append(scores)
            i += 1
        return meta

    @staticmethod
    def impala_getdata(uri, database, table, schema):
        engine = create_engine(uri, echo=True)
        dataRes = engine.execute('select * from ' + database + '.' + table + ' limit 500').fetchall()
        data = []
        for row in dataRes:
            rows = []
            for item in row:
                rows.append(item)
            data.append(rows)
        return data

    @staticmethod
    def impala_getresult(uri, sql):
        engine = create_engine(uri, echo=True)
        res = engine.execute(sql).fetchall()
        sql_result = []
        for row in res:
            rows = []
            for item in row:
                rows.append(item)
            sql_result.append(rows)
        return sql_result

    # kylin
    @staticmethod
    def kylin_getmeta(uri, database, table, schema):
        engine = create_engine(uri, echo=True)
        metaRes = engine.execute('select * from ' + schema + '.' + table + ' limit 500').keys()
        meta = []
        i = 1
        for colData in metaRes:
            scores = {"key": colData, "colIndex": i, "dataType": None}
            meta.append(scores)
            i += 1
        return meta

    @staticmethod
    def kylin_getdata(uri, database, table, schema):
        engine = create_engine(uri, echo=True)
        dataRes = engine.execute('select * from ' + schema + '.' + table + ' limit 500').fetchall()
        data = []
        for row in dataRes:
            rows = []
            for item in row:
                rows.append(item)
            data.append(rows)
        return data

    @staticmethod
    def kylin_getresult(uri, sql):
        engine = create_engine(uri, echo=True)
        res = engine.execute(sql).fetchall()
        sql_result = []
        for row in res:
            rows = []
            for item in row:
                rows.append(item)
            sql_result.append(rows)
        return sql_result

    # mysql
    @staticmethod
    def mysql_getdb(uri, schema):
        engine = create_engine(uri, echo=True)
        res = engine.execute('SHOW DATABASES').fetchall()
        db_list = []
        for row in res:
            for item in row:
                db_list.append(item)
        return db_list

    @staticmethod
    def mysql_gettable(uri, database, schema):
        engine = create_engine(uri, echo=True)
        res = engine.execute('SHOW TABLES FROM ' + database).fetchall()
        table_list = []
        for row in res:
            for item in row:
                table_list.append(item)
        return table_list

    @staticmethod
    def mysql_getmeta(uri, database, table, schema):
        engine = create_engine(uri, echo=True)
        metaRes = engine.execute('desc ' + database + '.' + table).fetchall()
        meta = []
        i = 1
        for colData in metaRes:
            scores = {"key": colData.Field, "colIndex": i, "dataType": colData.Type}
            meta.append(scores)
            i += 1
        return meta

    @staticmethod
    def mysql_getdata(uri, database, table, schema):
        engine = create_engine(uri, echo=True)
        dataRes = engine.execute('select * from ' + database + '.' + table + ' limit 500').fetchall()
        data = []
        for row in dataRes:
            rows = []
            for item in row:
                rows.append(item)
            data.append(rows)
        return data

    @staticmethod
    def mysql_getresult(uri, sql):
        engine = create_engine(uri, echo=True)
        res = engine.execute(sql).fetchall()
        sql_result = []
        for row in res:
            rows = []
            for item in row:
                rows.append(item)
            sql_result.append(rows)
        return sql_result

    # oracle
    @staticmethod
    def oracle_gettable(uri, database, schema):
        engine = create_engine(uri, echo=True)
        res = engine.execute('select tname from tab').fetchall()
        table_list = []
        for row in res:
            for item in row:
                table_list.append(item)
        return table_list

    @staticmethod
    def oracle_getmeta(uri, database, table, schema):
        engine = create_engine(uri, echo=True)
        metaRes = engine.execute(
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
        i = 1
        for colData in metaRes:
            scores = {"key": colData.column_name, "colIndex": i, "dataType": colData.data_type}
            meta.append(scores)
            i += 1
        return meta

    @staticmethod
    def oracle_getdata(uri, database, table):
        engine = create_engine(uri, echo=True)
        dataRes = engine.execute('select * from ' + table + ' where rownum <= 500').fetchall()
        data = []
        for row in dataRes:
            rows = []
            for item in row:
                rows.append(item)
            data.append(rows)
        return data

    @staticmethod
    def oracle_getresult(uri, sql):
        engine = create_engine(uri, echo=True)
        res = engine.execute(sql).fetchall()
        sql_result = []
        for row in res:
            rows = []
            for item in row:
                rows.append(item)
            sql_result.append(rows)
        return sql_result

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
                table_list.append(item)
        return table_list

    @staticmethod
    def postgres_getmeta(uri, database, table, schema):
        engine = create_engine(uri, echo=True)
        metaRes = engine.execute(
            'select column_name, data_type from information_schema.columns where table_schema= \'' + schema + '\' and table_name= \'' + table + '\'').fetchall()
        meta = []
        i = 1
        for colData in metaRes:
            scores = {"key": colData.column_name, "colIndex": i, "dataType": colData.data_type}
            meta.append(scores)
            i += 1
        return meta

    @staticmethod
    def postgres_getdata(uri, database, table, schema):
        engine = create_engine(uri, echo=True)
        dataRes = engine.execute('select * from ' + schema + '.' + table + ' limit 500').fetchall()
        data = []
        for row in dataRes:
            rows = []
            for item in row:
                rows.append(item)
            data.append(rows)
        return data

    @staticmethod
    def postgres_getresult(uri, sql):
        engine = create_engine(uri, echo=True)
        res = engine.execute(sql).fetchall()
        sql_result = []
        for row in res:
            rows = []
            for item in row:
                rows.append(item)
            sql_result.append(rows)
        return sql_result

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
                table_list.append(item)
        return table_list

    @staticmethod
    def redshift_getmeta(uri, database, table, schema):
        engine = create_engine(uri, echo=True)
        metaRes = engine.execute('''
            SELECT *
            FROM pg_table_def
            WHERE tablename = '{0}'
            AND schemaname = '{1}'
        '''.format(table, database)).fetchall()
        meta = []
        i = 1
        for colData in metaRes:
            scores = {"key": colData.column, "colIndex": i, "dataType": colData.type}
            meta.append(scores)
            i += 1
        return meta

    @staticmethod
    def redshift_getdata(uri, database, table, schema):
        engine = create_engine(uri, echo=True)
        dataRes = engine.execute('select * from ' + database + '.' + table + ' limit 500').fetchall()
        data = []
        for row in dataRes:
            rows = []
            for item in row:
                rows.append(item)
            data.append(rows)
        return data

    @staticmethod
    def redshift_getresult(uri, sql):
        engine = create_engine(uri, echo=True)
        res = engine.execute(sql).fetchall()
        sql_result = []
        for row in res:
            rows = []
            for item in row:
                rows.append(item)
            sql_result.append(rows)
        return sql_result

    # sparksql
    @staticmethod
    def sparksql_getdb(uri, schema):
        engine = create_engine(uri, echo=True)
        res = engine.execute('SHOW DATABASES').fetchall()
        db_list = []
        for row in res:
            for item in row:
                db_list.append(item)
        return db_list

    @staticmethod
    def sparksql_gettable(uri, database, schema):
        engine = create_engine(uri, echo=True)
        res = engine.execute('SHOW TABLES FROM ' + database).fetchall()
        table_list = []
        for row in res:
            for item in row:
                table_list.append(item)
        return table_list

    @staticmethod
    def sparksql_getmeta(uri, database, table, schema):
        engine = create_engine(uri, echo=True)
        metaRes = engine.execute('desc ' + database + '.' + table).fetchall()
        meta = []
        i = 1
        for colData in metaRes:
            scores = {"key": colData.col_name, "colIndex": i, "dataType": colData.data_type}
            meta.append(scores)
            i += 1
        return meta

    @staticmethod
    def sparksql_getdata(uri, database, table, schema):
        engine = create_engine(uri, echo=True)
        dataRes = engine.execute('select * from ' + database + '.' + table + ' limit 500').fetchall()
        data = []
        for row in dataRes:
            rows = []
            for item in row:
                rows.append(item)
            data.append(rows)
        return data

    @staticmethod
    def sparksql_getresult(uri, sql):
        engine = create_engine(uri, echo=True)
        res = engine.execute(sql).fetchall()
        sql_result = []
        for row in res:
            rows = []
            for item in row:
                rows.append(item)
            sql_result.append(rows)
        return sql_result

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
                table_list.append(item)
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
        i = 1
        for colData in metaRes:
            scores = {"key": colData.table_name, "colIndex": i, "dataType": colData.table_column}
            meta.append(scores)
            i += 1
        return meta

    @staticmethod
    def sqlserver_getdata(uri, database, table, schema):
        engine = create_engine(uri, echo=True)
        dataRes = engine.execute('select top 500 * from ' + database + '.' + schema + '.' + table).fetchall()
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

    # # x
    # @staticmethod
    # def x_getdb(uri, schema):
    #     engine = create_engine(uri, echo=True)
    #     res = engine.execute('SHOW DATABASES').fetchall()
    #     db_list = []
    #     for row in res:
    #         for item in row:
    #             db_list.append(item)
    #     return db_list
    #
    #
    # @staticmethod
    # def x_gettable(uri, database):
    #     engine = create_engine(uri, echo=True)
    #     res = engine.execute('SHOW TABLES FROM ' + database).fetchall()
    #     table_list = []
    #     for row in res:
    #         for item in row:
    #             table_list.append(item)
    #     return table_list
    #
    # @staticmethod
    # def x_getmeta(uri, database, table):
    #     engine = create_engine(uri, echo=True)
    #     metaRes = engine.execute('desc ' + database + '.' + table).fetchall()
    #     meta = []
    #     i = 1
    #     for colData in metaRes:
    #         scores = {"key": colData.col_name, "colIndex": i, "dataType": colData.data_type}
    #         meta.append(scores)
    #         i += 1
    #     return meta
    #
    # @staticmethod
    # def x_getdata(uri, database, table):
    #     engine = create_engine(uri, echo=True)
    #     dataRes = engine.execute('select * from ' + database + '.' + table + ' limit 500').fetchall()
    #     data = []
    #     for row in dataRes:
    #         rows = []
    #         for item in row:
    #             rows.append(item)
    #         data.append(rows)
    #     return data
    #
    # @staticmethod
    # def x_getresult(uri, sql):
    #     engine = create_engine(uri, echo=True)
    #     res = engine.execute(sql).fetchall()
    #     sql_result = []
    #     for row in res:
    #         rows = []
    #         for item in row:
    #             rows.append(item)
    #         sql_result.append(rows)
    #     return sql_result
