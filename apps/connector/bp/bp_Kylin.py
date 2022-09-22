# 2022/8/28
# 15:33
# kylin支持的sql中没有show databases,show tables,desc 等语句，
# 可能是因为kylin是一个用于做cube计算的工具，并且在预加载表的时候这些信息都可以看到，因此没有特意设置这几个sql
# 基本上都是一些计算的sql，如：
# 语法
# QUERY SYNTAX
# SELECT
# 　STATEMENT
# 　EXPRESSION
# SUBQUERY
# JOIN
# 　INNER JOIN
# 　LEFT JOIN
# UNION
# UNION ALL
#
# 函数
# COUNT
# 　COUNT(COLUMN)
# 　COUNT(*)
# COUNT_DISTINCT
# MAX
# MIN
# PERCENTILE
# SUM
# TOP_N
#
# WINDOW
# 　ROW_NUMBER
# 　AVG
# 　RANK
# 　DENSE_RANK
# 　FIRST_VALUE
# 　LAST_VALUE
# 　LAG
# 　LEAD
# 　NTILE
# 　CASE WHEN
# 　CAST
#
# SUSTRING
# COALESCE
# STDDEV_SUM
# INTERSECT_COUNT
# INTERSECT_VALUE

import json
from flask import (
    Blueprint, flash, g, redirect, render_template, request, session, url_for
)
from sqlalchemy import create_engine
from bp.bp_Sqlite import getUri

bp = Blueprint('kylin', __name__, url_prefix='/kylin')


# @bp.route('/database_list', methods=['POST'])
# def get_databases():
#     try:
#         props = json.loads(request.data)
#         connect_id = props['connect_id']
#         uri = getUri(connect_id)
#         engine = create_engine(uri, echo=True)
#         res = engine.execute('SHOW DATABASES').fetchall()
#         database = []
#         for row in res:
#             rows = []
#             for item in row:
#                 rows.append(item)
#             database.append(rows)
#     except Exception as e:
#         return {
#             'success': False,
#             'message': repr(e)
#         }
#     else:
#         return {
#             'success': True,
#             'data': database
#         }


# @bp.route('/get_metadata', methods=['POST'])
# def get_metadata():
#     try:
#         props = json.loads(request.data)
#         database = props['schema']
#         table = props['table']
#         connect_id = props['connect_id']
#         uri = getUri(connect_id)
#         engine = create_engine(uri, echo=True)
#         res = engine.execute('desc ' + database + '.' + table).fetchall()
#         database = []
#                 for row in res:
#                     rows = []
#                     for item in row:
#                         rows.append(item)
#                     database.append(rows)
#     except Exception as e:
#         return {
#             'success': False,
#             'message': repr(e)
#         }
#     else:
#         return {
#             'success': True,
#             'data': database
#         }


# @bp.route('/table_list', methods=['POST'])
# def get_table_list():
#     try:
#         props = json.loads(request.data)
#         database = props['schema']
#         connect_id = props['connect_id']
#         uri = getUri(connect_id)
#         engine = create_engine(uri, echo=True)
#         res = engine.execute('SHOW TABLES FROM ' + database).fetchall()
#         database = []
#         for row in res:
#             rows = []
#             for item in row:
#                 rows.append(item)
#             database.append(rows)
#     except Exception as e:
#         return {
#             'success': False,
#             'message': repr(e)
#         }
#     else:
#         return {
#             'success': True,
#             'data': database
#         }


@bp.route('/table_detail', methods=['POST'])
def get_detail():
    try:
        props = json.loads(request.data)
        database = props['db']
        table = props['table']
        connect_id = props['sourceId']
        uri = getUri(connect_id)
        engine = create_engine(uri, echo=True)
        dataRes = engine.execute('select * from ' + database + '.' + table + ' limit 500').fetchall()
        metaRes = engine.execute('select * from ' + database + '.' + table + ' limit 500').keys()
        data = []
        for row in dataRes:
            rows = []
            for item in row:
                rows.append(item)
            data.append(rows)
        meta = []
        i = 1
        for colData in metaRes:
            scores = {"key": colData, "colIndex": i, "dataType": None}
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
