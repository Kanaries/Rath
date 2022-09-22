# 2022/8/29
# 10:54
# 接口测试完成
import json
from flask import (
    Blueprint, request
)
from database import Base
from models.connection import Connection
from database import db_session

bp = Blueprint('sqlite', __name__, url_prefix='/sqlite')


@bp.route('/upsert', methods=['POST'])
def upsert_url():
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


@bp.route('/get_url', methods=['POST'])
def get_uri():
    try:
        props = json.loads(request.data)
        connect_id = props['connect_id']
        uri = getUri(connect_id)
        sourceType = getSourceType(connect_id)
    except Exception as e:
        return {
            'success': False,
            'message': repr(e)
        }
    else:
        return {
            "sourceType": sourceType,
            'data': uri
        }


def getUri(connect_id):
    res = Connection.query.filter(Connection.connect_id == connect_id).first()
    return res.uri


def getSourceType(connect_id):
    res = Connection.query.filter(Connection.connect_id == connect_id).first()
    return res.source_type
