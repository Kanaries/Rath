from crypt import methods
import json
from database import init_db, db_session
from flask import Flask, request
from flask_cors import CORS
from sqlalchemy import create_engine, MetaData, inspect
from sqlalchemy import types
from models.connection import Connection
# from sqlalchemy.orm import scoped_session, sessionmaker
# from sqlalchemy.ext.declarative import declarative_base

from clickhouse_sqlalchemy import (
    Table, make_session, get_declarative_base, make_session, types, engines
)

app = Flask(__name__)
CORS(app, supports_credentials=True)

@app.route("/api/schema_list", methods=['GET'])
def schema_list():
    engine = create_engine('clickhouse+native://localhost/default')
    inspector = inspect(engine)
    schemas = inspector.get_schema_names()
    return {
        "success": True,
        "data": schemas
    }

@app.route("/api/table_list", methods=['GET'])
def table_list():
    props = json.loads(request.data)
    print(props)
    engine = create_engine('clickhouse+native://localhost/default')
    inspector = inspect(engine)
    # schemas = inspector.get_schema_names()
    tables = inspector.get_table_names(schema=props["schema"])
    return {
        "success": True,
        "data": tables
    }

@app.route("/api/column_list", methods=['POST'])
def column_list():
    props = json.loads(request.data)
    print(props)
    engine = create_engine('clickhouse+native://localhost/default')
    inspector = inspect(engine)
    columns = inspector.get_columns(props["table"], schema=props["schema"])
    # print(columns, type(columns[0]['type']))
    # print(vars(columns[0]['type']))
    # print(columns[0]['type'].Unicode())
    # tt = columns[0]['type'].copy()
    print('!!', str(columns[0]['type']), type(columns[0]['type'].copy()))
    ser_columns = []
    for col in columns:
        ser_col = col.copy()
        ser_col['type'] = str(ser_col['type'])
        ser_columns.append(ser_col)

    return {
        "success": True,
        "data": ser_columns
    }

@app.route("/api/preview", methods=['POST'])
def preview_data():
    props = json.loads(request.data)
    print(props)
    engine = create_engine('clickhouse+native://localhost/default')
    with engine.connect() as con:
        res = con.execute('SELECT * from ' + props['schema'] + '.' + props['table'])
        ans = []
        for row in res:
            ans.append(row.values())
        return {
            "success": True,
            "data": ans
        }

@app.route("/api/connection_list", methods=['GET'])
def get_connection_list():
    connection_list = Connection.query.all()
    # print(help(connection_list))
    print(dict(connection_list[0]))
    return ""

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

@app.route("/ping")
def ping():
    return {
        "success": True
    }

@app.teardown_appcontext
def shutdown_session(exception=None):
    db_session.remove()

if __name__ == '__main__':
    # init_db()
    init_db()
    connection_list = Connection.query.all()
    print(connection_list)
    # from database import db_session
    # from models.connection import Connection
    # u = Connection('admin', '')
    # db_session.add(u)
    # db_session.commit()
    app.run(host='127.0.0.1',port=8000)