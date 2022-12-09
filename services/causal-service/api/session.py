import os, sys, shutil, time, json
import uuid
import logging

import interfaces as I

from .interface import *

loc = '/var/tmp/___sessions___'

os.makedirs(f'{loc}/', exist_ok=True)
lifeSpan = 1200
def recycleSession():
    for dirname in os.listdir(loc):
        if not dirname.startswith('s-'):
            continue
        session = dirname[2:]
        try:
            f = open(f'{loc}/s-{session}/life', 'r')
            keep = False
            try:
                s = f.read()
                f.close()
                if time.time() < float(s): keep = True
            except: pass
            if keep == False:
                print(f"rm {loc}/s-{session}")
                shutil.rmtree(f'{loc}/s-{session}/', ignore_errors=False)
        except Exception as e:
            import traceback
            logging.warning(traceback.format_exc())
            continue
def initSession(sessionId: str = None):
    recycleSession()
    if sessionId is None:
        sessionId = uuid.uuid4()
    os.makedirs(f'{loc}/s-{sessionId}/tableMeta', exist_ok=True)
    os.makedirs(f'{loc}/s-{sessionId}/table', exist_ok=True)
    with open(f'{loc}/s-{sessionId}/life', 'w') as f:
        print(time.time() + lifeSpan, file=f)
    return lifeSpan

def pingSession(sessionId: str):
    recycleSession()
    with open(f'{loc}/s-{sessionId}/life', 'w') as f:
        print(time.time() + lifeSpan, file=f)

def listTable(sessionId: str):
    lst = os.listdir(f'{loc}/s-{sessionId}/tableMeta')
    data = []
    for tableId in lst:
        with open(f'{loc}/s-{sessionId}/tableMeta/{tableId}', 'r') as f:
            meta = json.load(f)
        data.append(meta)
    return data

def uploadTable(sessionId: str, tableId: str, tableName: str, data: List[I.IRow], fields: List[IField], format: str, **kwargs):
    if tableId == '':
        tableId = str(uuid.uuid4())
    with open(f'{loc}/s-{sessionId}/tableMeta/{tableId}', 'w') as f:
        json.dump({'tableId': tableId, 'tableName': tableName, 'fields': jsonable_encoder(fields)}, f)
    if format == 'dataSource':
        import pandas as pd
        df = pd.DataFrame(data)
        df.to_csv(f'{loc}/s-{sessionId}/table/{tableId}.csv')
    return tableId