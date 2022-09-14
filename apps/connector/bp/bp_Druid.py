# 2022/8/28
# 15:33
# 接口测试完成
import json
from flask import (
    Blueprint, flash, g, redirect, render_template, request, session, url_for
)
from sqlalchemy import create_engine
from bp.bp_Sqlite import getUri

bp = Blueprint('druid', __name__, url_prefix='/druid')


@bp.route('/database_list', methods=['POST'])
def get_databases():
    try:
        props = json.loads(request.data)
        connect_id = props['sourceId']
        uri = getUri(connect_id)
        engine = create_engine(uri, echo=True)
        res = engine.execute('select SCHEMA_NAME from INFORMATION_SCHEMA.SCHEMATA ').fetchall()
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


@bp.route('/table_list', methods=['POST'])
def get_table_list():
    try:
        props = json.loads(request.data)
        database = props['db']
        connect_id = props['sourceId']
        uri = getUri(connect_id)
        engine = create_engine(uri, echo=True)
        res = engine.execute(
            'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = \'' + database + '\'').fetchall()
        database = []
        for row in res:
            database.append(row.TABLE_NAME)
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
        dataRes = engine.execute('select * from ' + database + '.' + table + ' limit 500').fetchall()
        metaRes = engine.execute(
            'select COLUMN_NAME, DATA_TYPE from INFORMATION_SCHEMA.COLUMNS where TABLE_SCHEMA = \'' + database + '\' and  TABLE_NAME = \'' + table + '\'').fetchall()
        data = []
        for row in dataRes:
            rows = []
            for item in row:
                rows.append(item)
            data.append(rows)
        meta = []
        i = 1
        for colData in metaRes:
            scores = {"key": colData.COLUMN_NAME, "colIndex": i, "dataType": colData.DATA_TYPE}
            meta.append(scores)
            i += 1
    except Exception as e:
        return {
            'success': False,
            'message': repr(e)
        }
    else:
        return {
            "success": True,
            "data": {
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
            "success": True,
            "data": {
                "rows": database
            }
        }
