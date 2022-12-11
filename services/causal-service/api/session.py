import os, sys, shutil, time, json
import uuid
import logging

import interfaces as I

from .interface import *

loc = '/var/tmp/___sessions___'

os.makedirs(f'{loc}/', exist_ok=True)
lifeSpan = 1200
def recycleSession():
    killedTask = []
    for dirname in os.listdir(loc):
        if not dirname.startswith('s-'):
            continue
        sessionId = dirname[2:]
        try:
            f = open(f'{loc}/s-{sessionId}/life', 'r')
            keep = False
            try:
                s = f.read()
                f.close()
                if time.time() < float(s) + lifeSpan: keep = True
            except: pass
            if keep == False:
                print(f"rm {loc}/s-{sessionId}")
                import glob
                for task in glob.glob(f'{loc}/s-{sessionId}/kv/task-*'):
                    taskId = task.replace(f'{loc}/s-{sessionId}/kv/task-', '')
                    logging.warning(f'taskId = {taskId}')
                    killedTask.append(taskId)
                shutil.rmtree(f'{loc}/s-{sessionId}/', ignore_errors=False)
        except Exception as e:
            logging.exception(e)
            continue
def initSession(sessionId: str = None):
    recycleSession()
    if sessionId is None:
        sessionId = uuid.uuid4()
    os.makedirs(f'{loc}/s-{sessionId}/tableMeta', exist_ok=True)
    os.makedirs(f'{loc}/s-{sessionId}/table', exist_ok=True)
    with open(f'{loc}/s-{sessionId}/life', 'w') as f:
        print(time.time(), file=f)
    return sessionId, lifeSpan

def pingSession(sessionId: str):
    recycleSession()
    with open(f'{loc}/s-{sessionId}/life', 'w') as f:
        print(time.time(), file=f)
    return lifeSpan

def listTable(sessionId: str):
    lst = os.listdir(f'{loc}/s-{sessionId}/tableMeta')
    data = []
    for tableId in lst:
        with open(f'{loc}/s-{sessionId}/tableMeta/{tableId}', 'r') as f:
            meta = json.load(f)
        data.append(meta)
    return data

def dropTable(sessionId: str, tableId: str):
    pathCsv = f'{loc}/s-{sessionId}/table/{tableId}.csv'
    pathMeta = f'{loc}/s-{sessionId}/tableMeta/{tableId}'
    try:
        os.remove(pathCsv)
        os.remove(pathMeta)
    except Exception as e:
        logging.exception(e)

def uploadTable(sessionId: str, tableId: str, tableName: str, data: List[I.IRow], fields: List[Dict[str, str]], format: str, **kwargs):
    if tableId == '':
        tableId = str(uuid.uuid4())
    with open(f'{loc}/s-{sessionId}/tableMeta/{tableId}', 'w') as f:
        json.dump({'tableId': tableId, 'tableName': tableName, 'fields': jsonable_encoder(fields)}, f)
    if format == 'dataSource':
        import pandas as pd
        df = pd.DataFrame(data)
        df.to_csv(f'{loc}/s-{sessionId}/table/{tableId}.csv')
    return tableId

def getCsv(sessionId: str, tableId: str):
    data = pd.read_csv(f'{loc}/s-{sessionId}/table/{tableId}.csv')
    return data

def getMeta(sessionId: str, tableId: str):
    with open(f'{loc}/s-{sessionId}/tableMeta/{tableId}', 'r') as f:
        meta = json.load(f)
    return meta

def readTable(sessionId: str, tableId: str):
    data, meta = getCsv(sessionId, tableId), getMeta(sessionId, tableId)
    return data, meta

def listItems(sessionId: str, key: str):
    path = f'{loc}/s-{sessionId}/kv/{key}'
    import glob
    lst = glob.glob(path)
    return [f.replace(f'{loc}/s-{sessionId}/kv/', '') for f in lst]

def setValue(sessionId: str, key: str, value: str):
    path = f'{loc}/s-{sessionId}/kv/{key}'
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(value)

def getValue(sessionId: str, key: str):
    path = f'{loc}/s-{sessionId}/kv/{key}'
    try:
        with open(path, 'r') as f:
            value = f.read()
        return value
    except:
        return None

def clearValue(sessionId: str, prefix: str):
    path = f'{loc}/s-{sessionId}/kv/{prefix}*'
    import glob
    try:
        lst = glob.glob(path, recursive=True)
        for fp in lst:
            try:
                os.remove(fp)
            except:
                continue
    except:
        logging.warning(traceback.extract_tb())
