# 2022/9/9
# 14:43
import json
from flask import Blueprint, request
from models.connection import Connection
from database import db_session
from bp.basefunc import basefunc

bp = Blueprint('database', __name__, url_prefix='/api')


@bp.route('/upsert', methods=['POST'])
def upsert_uri():
    try:
        props = json.loads(request.data)
        # connect_id = props['connect_id']
        uri = props['uri']
        source_type = props['sourceType']

        # if getUri(connect_id):
        #     Connection.query.filter(Connection.connect_id == connect_id).delete()
        #     db_session.commit()

        connection = Connection(uri=uri, source_type=source_type)
        db_session.add(connection)
        db_session.commit()

        # item_new = Connection.query.filter(Connection.connect_id == connect_id).first()
        res = Connection.query.filter(Connection.uri == uri).first()
        connectId = res.connect_id
    except Exception as e:
        return {
            'success': False,
            'message': repr(e)
        }
    else:
        return {
            'success': True,
            'data': connectId
        }


@bp.route('/database_list', methods=['POST'])
def get_databases_list():
    try:
        props = json.loads(request.data)
        connect_id = props['sourceId']
        schema = props.get('schema', None)
        uri = get_uri(connect_id)
        source_type = get_source_type(connect_id)
        dict__ = basefunc.__dict__
        db_list = dict__['{0}_getdb'.format(source_type)](uri=uri, schema=schema)
    except Exception as e:
        return {
            'success': False,
            'message': repr(e)
        }
    else:
        return {
            'success': True,
            'data': db_list
        }


@bp.route('/schema_list', methods=['POST'])
def get_schema_list():
    try:
        props = json.loads(request.data)
        connect_id = props['sourceId']
        database = props.get('db', None)
        uri = get_uri(connect_id)
        source_type = get_source_type(connect_id)
        dict__ = basefunc.__dict__
        schema_list = dict__['{0}_getschema'.format(source_type)](uri=uri, db=database)
    except Exception as e:
        return {
            'success': False,
            'message': repr(e)
        }
    else:
        return {
            'success': True,
            'data': schema_list
        }


@bp.route('/table_list', methods=['POST'])
def get_table_list():
    try:
        props: dict = json.loads(request.data)
        database = props.get('db', None)
        schema = props.get('schema', None)
        connect_id = props['sourceId']
        uri = get_uri(connect_id)
        source_type = get_source_type(connect_id)
        dict__ = basefunc.__dict__
        table_list = dict__['{0}_gettable'.format(source_type)](uri=uri, database=database, schema=schema)
    except Exception as e:
        return {
            'success': False,
            'message': repr(e)
        }
    else:
        return {
            'success': True,
            'data': table_list
        }


@bp.route('/table_detail', methods=['POST'])
def get_table_detail():
    try:
        props = json.loads(request.data)
        database = props.get('db', None)
        schema = props.get('schema', None)
        table = props['table']
        connect_id = props['sourceId']
        uri = get_uri(connect_id)
        source_type = get_source_type(connect_id)
        dict__ = basefunc.__dict__
        meta = dict__['{0}_getmeta'.format(source_type)](uri=uri, database=database, table=table, schema=schema)
        data = dict__['{0}_getdata'.format(source_type)](uri=uri, database=database, table=table, schema=schema)
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


@bp.route('/execute', methods=['POST'])
def execute_sql():
    try:
        props = json.loads(request.data)
        sql = props['query']
        connect_id = props['sourceId']
        uri = get_uri(connect_id)
        source_type = get_source_type(connect_id)
        dict__ = basefunc.__dict__
        sql_result = dict__['{0}_getresult'.format(source_type)](uri=uri, sql=sql)
    except Exception as e:
        return {
            'success': False,
            'message': repr(e)
        }
    else:
        return {
            'success': True,
            'data': {
                "rows": sql_result
            }
        }


def get_uri(connect_id):
    res = Connection.query.filter(Connection.connect_id == connect_id).first()
    return res.uri


def get_source_type(connect_id):
    res = Connection.query.filter(Connection.connect_id == connect_id).first()
    return res.source_type
