# 2022/8/28
# 15:33
# 测试完成，但是这个数据库真是不太会用，丢数据问题是因为没有commit，后面似乎没有这个问题了，但是仍然有搞不清楚表情况的问题
# 比如：for_test一开始丢数据，后来不丢了，但是desc的时候又找不到该表，fortest可以desc出来但是重启后会没数据
import json
from flask import (
    Blueprint, flash, g, redirect, render_template, request, session, url_for
)
from sqlalchemy import create_engine
from bp.bp_Sqlite import getUri

bp = Blueprint('oracle', __name__, url_prefix='/oracle')


# 由于oracle没有database，一个用户只有一个，因此在选择用户时以及定了数据库，因此没有该项
@bp.route('/database_list', methods=['POST'])
def get_databases():
    try:
        props = json.loads(request.data)
        connect_id = props['sourceId']
        uri = getUri(connect_id)
        engine = create_engine(uri, echo=True)
        res = engine.execute('SHOW DATABASES').fetchall()
        database = []
        for row in res:
            rows = []
            for item in row:
                rows.append(item)
            database.append(rows)
    except Exception as e:
        return {
            'success': False,
            'message': repr(e)
        }
    else:
        return {
            'success': True,
            'data': database
        }


@bp.route('/get_metadata', methods=['POST'])
def get_metadata():
    try:
        props = json.loads(request.data)
        database = props['schema']
        table = props['table']
        connect_id = props['connect_id']
        uri = getUri(connect_id)
        engine = create_engine(uri, echo=True)
        res = engine.execute(
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
        database = []
        for row in res:
            rows = []
            for item in row:
                rows.append(item)
            database.append(rows)
    except Exception as e:
        return {
            'success': False,
            'message': repr(e)
        }
    else:
        return {
            'success': True,
            'data': database
        }


# * -> tname
@bp.route('/table_list', methods=['POST'])
def get_table_list():
    try:
        props = json.loads(request.data)
        database = props['db']
        connect_id = props['sourceId']
        uri = getUri(connect_id)
        engine = create_engine(uri, echo=True)
        res = engine.execute('select tname from tab').fetchall()
        database = []
        for row in res:
            for item in row:
                database.append(item)
    except Exception as e:
        return {
            'success': False,
            'message': repr(e)
        }
    else:
        return {
            'success': True,
            'data': database
        }


@bp.route('/table_detail', methods=['POST'])
def get_detail():
    try:
        props = json.loads(request.data)
        database = props['db']
        table = props['table']
        connect_id = props['sourceId']
        uri = getUri(connect_id)
        engine = create_engine(uri, echo=True)
        dataRes = engine.execute('select * from ' + table + ' where rownum <= 500').fetchall()
        cmd = '''
                select t.table_name,
                       t.column_name as column_name,
                       t.data_type as data_type,
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
                      where m.table_name = '{0}'
                        and m.table_name = s.table_name
                        and m.constraint_name = s.constraint_name
                        and s.constraint_type = 'P') m
                WHERE t.table_name = '{1}'
                  and c.table_name = t.table_name
                  and c.column_name = t.column_name
                  and t.hidden_column = 'NO'
                order by t.column_id
            '''.format(table, table)
        print('>>>', [cmd])
        metaRes = engine.execute(
            cmd
        ).fetchall()
        data = []
        for row in dataRes:
            rows = []
            for item in row:
                rows.append(item)
            data.append(rows)
        meta = []
        i = 1
        for colData in metaRes:
            scores = {"key": colData.column_name, "colIndex": i, "dataType": colData.data_type}
            meta.append(scores)
            i += 1
    except Exception as e:
        return {
            'success': False,
            'message': repr(e)
        }
    else:
        return {
            'success': True,
            'data': {
                "columns": meta,
                "rows": data
            }
        }


# 执行任意sql
@bp.route('/execute', methods=['POST'])
def execute_sql():
    try:
        props = json.loads(request.data)
        sql = props['query']
        connect_id = props['sourceId']
        uri = getUri(connect_id)
        engine = create_engine(uri, echo=True)
        res = engine.execute(sql).fetchall()
        database = []
        for row in res:
            rows = []
            for item in row:
                rows.append(item)
            database.append(rows)
    except Exception as e:
        return {
            'success': False,
            'message': repr(e)
        }
    else:
        return {
            'success': True,
            'data': {
                "rows": database
            }
        }
