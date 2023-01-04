import json
from sqlalchemy import create_engine
from basefunc import basefunc

with open(rf"./env.json", 'rb') as env:
    json_load = json.load(env)
    connection_string = json_load['connection_string']
    database = json_load['database']
    table = json_load['table']


# connect_id = "7f852663-1393-44bb-b376-d77beee28b91"
def ping(event, context):
    print("Received event: " + json.dumps(event, indent=2))
    return {
        "success": True
    }


def upsert_uri(event, context):
    try:
        uri = event['uri']
        source_type = event['sourceType']
        engine = create_engine(connection_string, echo=True)
        engine.execute(
            "INSERT INTO {0}.{1} (id, uri, source_type) VALUES (generateUUIDv4(), '{2}', '{3}');".format(database, table, uri, source_type))
        res = engine.execute("select id from {0}.{1} where uri = '{2}'".format(database, table, uri)).fetchone()
        connect_id = res[0]
    except Exception as e:
        return {
            'success': False,
            'message': repr(e)
        }
    else:
        return {
            'success': True,
            'data': connect_id
        }


def get_databases_list(event, context):
    try:
        connect_id = event['sourceId']
        schema = event.get('schema', None)
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


def get_schema_list(event, context):
    try:
        connect_id = event['sourceId']
        database = event.get('db', None)
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


def get_table_list(event, context):
    try:
        database = event.get('db', None)
        schema = event.get('schema', None)
        connect_id = event['sourceId']
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


def get_table_detail(event, context):
    try:
        database = event.get('db', None)
        schema = event.get('schema', None)
        table = event['table']
        connect_id = event['sourceId']
        rows_num = event.get('rowsNum', 500)
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


def execute_sql(event, context):
    try:
        sql = event['query']
        connect_id = event['sourceId']
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
    engine = create_engine(connection_string, echo=True)
    res = engine.execute("select uri from {0}.{1} where id = '{2}'".format(database, table, connect_id)).fetchone()
    return res[0]


def get_source_type(connect_id):
    engine = create_engine(connection_string, echo=True)
    res = engine.execute("select source_type from {0}.{1} where id = '{2}'".format(database, table, connect_id)).fetchone()
    return res[0]
