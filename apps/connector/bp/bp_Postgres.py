# 2022/8/28
# 15:33
# 测试完成
import json
from flask import (
    Blueprint, flash, g, redirect, render_template, request, session, url_for
)
from sqlalchemy import create_engine
from bp.bp_Sqlite import getUri

bp = Blueprint('postgres', __name__, url_prefix='/postgres')


@bp.route('/database_list', methods=['POST'])
def get_databases():
    try:
        props = json.loads(request.data)
        connect_id = props['sourceId']
        uri = getUri(connect_id)
        engine = create_engine(uri, echo=True)
        res = engine.execute('select nspname from pg_catalog.pg_namespace').fetchall()
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
            'select column_name, data_type from information_schema.columns where table_schema= \'' + database + '\' and table_name= \'' + table + '\'').fetchall()
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


@bp.route('/table_list', methods=['POST'])
def get_table_list():
    try:
        props = json.loads(request.data)
        database = props['db']
        connect_id = props['sourceId']
        uri = getUri(connect_id)
        engine = create_engine(uri, echo=True)
        res = engine.execute(
            'select tablename from pg_tables where schemaname=\'' + database + '\'').fetchall()
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
        dataRes = engine.execute('select * from ' + database + '.' + table + ' limit 500').fetchall()
        metaRes = engine.execute(
            'select column_name, data_type from information_schema.columns where table_schema= \'' + database + '\' and table_name= \'' + table + '\'').fetchall()
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
            'success': True,
            'data': {
                "rows": database
            }
        }
