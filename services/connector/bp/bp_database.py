# 2022/9/9
# 14:43
import json
from flask import Blueprint, request
from models.connection import Connection
from database import db_session
from bp.basefunc import basefunc
import base64

bp = Blueprint('database', __name__, url_prefix='/api')


@bp.route('/get_connection', methods=['POST'])
def get_connection():
    props = json.loads(request.data)
    func = props['func']
    if func == 'ping':
        return {
            "success": True
        }
    source_type = props['sourceType']
    uri = props['uri']
    credentials = props.get('credentials', None)
    database = props.get('db', None)
    table = props.get('table', None)
    schema = props.get('schema', None)
    rows_num = props.get('rowsNum', 500)
    sql = props.get('query', None)
    res = invoke(uri=uri,
                 func=func,
                 source_type=source_type,
                 database=database,
                 schema=schema,
                 table=table,
                 rows_num=rows_num,
                 sql=sql,
                 credentials=credentials,
                 )
    if 'errorMessage' in res:
        return {
            'success': False,
            'message': res
        }
    else:
        return {
            'success': True,
            'data': res
        }


def invoke(uri, func, source_type, database, schema, table, rows_num, sql, credentials):
    credentials = json.dumps(credentials)
    credentials_64 = base64.b64encode(credentials.encode('utf-8'))
    dict_func = basefunc.__dict__
    if func == 'getDatabases':
        db_list = dict_func['{0}_getdb'.format(source_type)].__func__(uri=uri, schema=schema,
                                                                      credentials=credentials_64)
        return db_list
    elif func == 'getSchemas':
        schema_list = dict_func['{0}_getschema'.format(source_type)].__func__(uri=uri, db=database,
                                                                              credentials=credentials_64)
        return schema_list
    elif func == 'getTables':
        table_list = dict_func['{0}_gettable'.format(source_type)].__func__(uri=uri, database=database, schema=schema,
                                                                            credentials=credentials_64)
        return table_list
    elif func == 'getTableDetail':
        res_list = dict_func['{0}_getdetail'.format(source_type)].__func__(uri=uri, database=database, table=table,
                                                                           schema=schema, rows_num=rows_num,
                                                                           credentials=credentials_64)
        return {
            "meta": res_list[0],
            "columns": res_list[1],
            "rows": res_list[2]
        }
    elif func == 'getResult':
        res_list = dict_func['{0}_getresult'.format(source_type)].__func__(uri=uri, sql=sql,
                                                                           credentials=credentials_64)
        return {
            "columns": res_list[0],
            "rows": res_list[1]
        }
    else:
        return 'The wrong func was entered'


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
        db_list = dict__['{0}_getdb'.format(source_type)].__func__(uri=uri, schema=schema)
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
        schema_list = dict__['{0}_getschema'.format(source_type)].__func__(uri=uri, db=database)
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
        table_list = dict__['{0}_gettable'.format(source_type)].__func__(uri=uri, database=database, schema=schema)
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
        rows_num = props.get('rowsNum', 500)
        uri = get_uri(connect_id)
        source_type = get_source_type(connect_id)
        dict__ = basefunc.__dict__
        meta = dict__['{0}_getmeta'.format(source_type)].__func__(uri=uri, database=database, table=table,
                                                                  schema=schema)
        data = dict__['{0}_getdata'.format(source_type)].__func__(uri=uri, database=database, table=table,
                                                                  schema=schema, rows_num=rows_num)
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
        sql_result = dict__['{0}_getresult'.format(source_type)].__func__(uri=uri, sql=sql)
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
