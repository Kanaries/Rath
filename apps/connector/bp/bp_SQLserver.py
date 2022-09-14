# 2022/8/28
# 15:33
# 测试完成，这个数据库因为有三层，因此在方法中多加了一个schemas list，post的东西也要多一个

import json
from flask import (
    Blueprint, flash, g, redirect, render_template, request, session, url_for
)
from sqlalchemy import create_engine
from bp.bp_Sqlite import getUri

bp = Blueprint('sqlserver', __name__, url_prefix='/sqlserver')


@bp.route('/database_list', methods=['POST'])
def get_databases():
    try:
        props = json.loads(request.data)
        connect_id = props['sourceId']
        uri = getUri(connect_id)
        engine = create_engine(uri, echo=True)
        res = engine.execute('SELECT name FROM sys.databases').fetchall()
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


@bp.route('/schema_list', methods=['POST'])
def get_schemas():
    try:
        props = json.loads(request.data)
        connect_id = props['sourceId']
        db = props['db']
        uri = getUri(connect_id)
        engine = create_engine(uri, echo=True)
        res = engine.execute('SELECT name FROM {0}.sys.schemas'.format(db)).fetchall()
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
        schema = props['schema']
        connect_id = props['sourceId']
        uri = getUri(connect_id)
        engine = create_engine(uri, echo=True)
        res = engine.execute(
            '''
            SELECT t.name FROM {0}.sys.tables AS t INNER JOIN {1}.sys.schemas AS s ON s.schema_id = t.schema_id WHERE s.name = '{2}'
            '''.format(
                database, database, schema)).fetchall()
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
        database = props['database']
        table = props['table']
        connect_id = props['connect_id']
        uri = getUri(connect_id)
        engine = create_engine(uri, echo=True)
        res = engine.execute('''
            SELECT SC.name,
                   ST.name
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


@bp.route('/table_detail', methods=['POST'])
def get_detail():
    try:
        props = json.loads(request.data)
        database = props['db']
        schema = props['schema']
        table = props['table']
        connect_id = props['sourceId']
        uri = getUri(connect_id)
        engine = create_engine(uri, echo=True)
        dataRes = engine.execute('select top 500 * from ' + database + '.' + schema + '.' + table).fetchall()
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
        data = []
        for row in dataRes:
            rows = []
            for item in row:
                rows.append(item)
            data.append(rows)
        meta = []
        i = 1
        for colData in metaRes:
            scores = {"key": colData.table_name, "colIndex": i, "dataType": colData.table_column}
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
