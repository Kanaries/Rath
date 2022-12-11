import requests, logging, json

from . import session, common as c, interface as I

url = 'https://showwhy.gateway.kanaries.cn:3433'
# url = 'http://52.82.70.212:8081'

def inferDataNature(data, fields: c.IFieldMeta):
    import pandas as pd
    causal_variables = []
    for f in fields:
        nature = None
        fid = f['fid']
        s = f['semanticType']
        if s == 'nominal':
            if data[fid].unique().size == 2:
                data = data.assign(**{fid: pd.factorize(data[fid])[0]})
                nature = 'Binary'
            else: nature = 'Categorical Nominal'
        elif s == 'quantitative': nature = 'Continuous'
        elif s == 'temporal':
            logging.debug(pd.to_datetime(data[fid]).astype('int64'))
            data = data.assign(**{fid: pd.to_datetime(data[fid]).astype('int64')})
            logging.debug(f"temporal Series: {f}, {data[fid]}")
            nature = 'Continuous'
        elif s == 'ordinal':
            if data[fid].unique().size == 2: nature = 'Binary'
            else: nature = 'Categorical Ordinal'
        causal_variables.append({'name': fid, 'nature': nature})
    return data, causal_variables

def runDiscover(sessionId: str, req: I.DiscoverReq):
    dataset = None
    
    algoName, tableId, fields, focusedFields, bgKnowledgesPag, funcDeps, params = \
        req.algoName, req.tableId, req.fields, req.focusedFields, req.bgKnowledgesPag, req.funcDeps, req.params
    
    data, meta = session.readTable(sessionId, tableId)
    
    d = {f['fid']: f for f in fields}
    fields = [d[ff] for ff in focusedFields]
    
    data, causal_variables = inferDataNature(data, fields)
        
    causes, effects, forbiddenRelationships = [], [], []
    for bg in bgKnowledgesPag:
        src, tar, src_type, tar_type = bg.src, bg.tar, bg.src_type, bg.tar_type
        if src_type == 0:
            forbiddenRelationships.append([src, tar])
        elif tar_type == 0:
            forbiddenRelationships.append([tar, src])
        elif src_type == -1:
            forbiddenRelationships.append([tar, src])
        elif tar_type == -1:
            forbiddenRelationships.append([src, tar])
    
    dataset = {
        'data': data.loc[:, focusedFields].to_dict('list'),
        'schema': {
            'fields': [{'name': f} for f in focusedFields]
        }
    }
    data = {
        'dataset': dataset,
        'causal_variables': causal_variables,
        'constraints': {
            'causes': causes,
            'effects': effects,
            'forbiddenRelationships': forbiddenRelationships
        },
        'ate_options': {},
        'model_options': {}
    }
    resp = requests.post(f"{url}/api/discover/deci", json=data)
    
    if resp.status_code != 200:
        logging.debug(f"data = {json.dumps(data)}")
        logging.warning(resp.json())
        raise Exception(resp.json())
    taskId = resp.json()['id']
    return taskId

def killTask(sessionId: str, taskId: str):
    resp = requests.delete(f"{url}/api/discover/{taskId}")
    return resp.json()

def getTaskStatus(sessionId: str, taskId: str):
    resp = requests.get(f"{url}/api/discover/{taskId}")
    if resp.status_code != 200:
        raise f'getTaskStatus: {resp}'
    res = resp.json()
    res['progress'] = res.get('progress', 100) / 100.0
    return res

def runIntervention(sessionId, modelId, do, confidence_threshold=0.11, weight_threshold=0.0, **kwargs):
    data = {
        'intervention_model_id': modelId,
        'interventions': do,
        'confidence_threshold': confidence_threshold,
        'weight_threshold': weight_threshold
    }
    resp = requests.post(f"{url}/api/discover/deci/intervention", json=data)
    if resp.status_code != 200:
        logging.warning(f'resp = {resp.content}')
    res = resp.json()
    return res