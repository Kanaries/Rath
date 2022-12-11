import uuid, logging
from fastapi import APIRouter
from fastapi.encoders import jsonable_encoder

from api.interface import *
import interfaces as I
import algorithms as alg
from .discovery import discovery_alg
from .intervention import intervention_alg
from . import service as s
from . import session

v0_1 = APIRouter()
@v0_1.get('/initSession', response_model=InitSessionResp)
def initSession(sessionId: str = None):
    sessionId, lifeSpan = session.initSession(sessionId)
    Data = InitSessionResp.Data
    return InitSessionResp(data=Data(sessionId=str(sessionId), lifeSpan=lifeSpan))

Sessions = APIRouter(prefix='/s/{sessionId}', tags=['Session Operations'])

@Sessions.get('/ping', response_model=SessionPingResp)
def pingSession(sessionId: str, response: Response):
    try:
        lifeSpan = session.pingSession(sessionId)
        return SessionPingResp(data=SessionPingResp.Data(lifeSpan=lifeSpan))
    except:
        response.status_code = status.HTTP_400_BAD_REQUEST
        logging.warning(traceback.format_exc())
        return SessionPingResp(success=False, message=f'session {sessionId} already released')

@Sessions.get('/listTable', response_model=ListTableResp)
def listTable(sessionId: str, response: Response):
    ping_res = pingSession(sessionId, response=response)
    if ping_res.success == False:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return ListTableResp(success=False, message=ping_res.message)
    try:
        data = [
            ListTableResp.Data(
                tableId=meta['tableId'],
                tableName=meta['name'],
                fields=meta['fields'])
            for meta in session.listTable(sessionId) ]
        return ListTableResp(success=True, data=data)
    except Exception as e:
        msg = c.handleHttpException(e)
        return ListTableResp(success=False, message=msg)

@Sessions.post('/uploadTable', response_model=UploadTableResp)
def uploadTable(sessionId: str, data: UploadTableReq, response: Response):
    ping_res = pingSession(sessionId, response=response)
    if ping_res.success == False:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return UploadTableResp(success=False, message=ping_res.message)
    try:
        tableId = session.uploadTable(sessionId, **data.dict())
        return UploadTableResp(success=True, data=UploadTableResp.Data(tableId=tableId))
    except Exception as e:
        msg = c.handleHttpException(e)
        return UploadTableResp(success=False, message=msg)

@Sessions.delete('/table/{tableId}', response_model=DropTableResp)
def dropTable(sessionId: str, tableId: str, response: Response):
    ping_res = pingSession(sessionId, response=response)
    if ping_res.success == False:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return DropTableResp(success=False, message=ping_res.message)
    session.dropTable(sessionId, tableId)
    return DropTableResp(success=True, data=DropTableResp.Data(tableId=tableId))

# Discovery

@v0_1.get('/form/discovery', tags=['Discovery'], response_model=FormSchemaResp)
def getDiscoverySchema(response: Response):
    try:
        return FormSchemaResp(data={
            algoName: getAlgoSchema(algoName, algo)
            for algoName, algo in discovery_alg.items()
        })
    except Exception as e:
        msg = c.handleHttpException
        return FormSchemaResp(success=False, message=msg)
    
Discovery = APIRouter(prefix='/s/{sessionId}', tags=['Discovery'])
@Discovery.post('/discover', response_model=DiscoverResp)
def discover(sessionId: str, data: DiscoverReq):
    taskId = str(uuid.uuid4())
    res = s.runDiscover(sessionId, data)
    taskId = res
    session.setValue(sessionId, f"task-{taskId}/meta", json.dumps({'taskType': 'discovery', 'taskOpt': data.algoName}))
    session.setValue(sessionId, f"task-{taskId}/tableId", data.tableId)
    session.setValue(sessionId, f"task-{taskId}/request", data.json())
    res_data = DiscoverResp.Data(taskId=taskId)
    return DiscoverResp(data=res_data)

@Discovery.delete('/task/{taskId}', response_model=c.IRestfulResp)
def killTask(sessionId: str, taskId: str):
    res = s.killTask(sessionId, taskId)
    logging.debug(f"killTask: {res}")
    session.clearValue(sessionId, f"task-{taskId}/")
    return {
        'success': True,
    }

@Discovery.get('/listTask', response_model=ListTaskResp)
def listTask(sessionId: str, response: Response):
    data = {}
    lst = session.listItems(sessionId, f"task-*")
    for task in lst:
        taskId = task[5:]
        taskStatus = getTaskStatus(sessionId, taskId, response)
        data[taskId] = taskStatus.data
    response.status_code = status.HTTP_200_OK
    return ListTaskResp(data=data[taskId])

@Discovery.get('/task/{taskId}', response_model=TaskStatusResp)
def getTaskStatus(sessionId: str, taskId: str, response: Response, confidence_threshold: float=None):
    Data = TaskStatusResp.Data
    res = s.getTaskStatus(sessionId, taskId)
    res_st = res['status']
    task_status = 'PENDING' if res_st == 'PENDING' else \
        'DONE' if res_st == 'SUCCESS' else \
            'RUNNING' if res_st == 'STARTED' else 'FAILED'
    progress = res.get('progress', 1.)
    result = None
    
    request_json = session.getValue(sessionId, f"task-{taskId}/request")
    task_meta_json = session.getValue(sessionId, f"task-{taskId}/meta")
    req, task_meta = json.loads(request_json), json.loads(task_meta_json)
    task_params = DiscoverReq.parse_obj(req)
    
    res_result = res.get('result', None)
    if res_result is not None:
        if task_status == 'DONE':
            modelId = res_result['intervention_model_id']
            orig_matrix = res_result['confidence_matrix']
            matrix = [[0 for value in row] for row in orig_matrix]
            trans_matrix = [[0 for value in row] for row in orig_matrix]
            sorted_edges = sorted(res['result']['elements']['edges'], key=lambda x: -x['data']['confidence'])
            # for i in range(len(matrix)):
            #     for j in range(i):
            #         if orig_matrix[i][j] > .001:
            #             matrix[i][j], matrix[j][i] = -1, 1
            #         elif orig_matrix[j][i] > .001:
            #             matrix[i][j], matrix[j][i] = 1, -1
            #         elif orig_matrix[i][j] >= .0005 and orig_matrix[j][i] >= .0005:
            #             matrix[i][j], matrix[j][i] = 2, 2
            columns = res['result']['columns']
            columnIdx = {f: i for i, f in enumerate(columns)}
            if confidence_threshold is None:
                confidence_threshold = task_params.params.confidence_threshold
            for edge in sorted_edges:
                e = edge['data']
                if e['confidence'] < confidence_threshold:
                    break
                source, target = e['source'], e['target']
                s_i, t_i = columnIdx[source], columnIdx[target]
                if trans_matrix[s_i][t_i] != 1:
                    matrix[s_i][t_i], matrix[t_i][s_i] = -1, 1
                else: continue
                for i in range(len(columns)): # 传递闭包
                    if i != s_i and trans_matrix[i][s_i] != -1: continue
                    for j in range(len(columns)):
                        if t_i != j and trans_matrix[t_i][j] != -1: continue
                        trans_matrix[i][j], trans_matrix[j][i] = -1, 1
                    
            tableId = session.getValue(sessionId, f"task-{taskId}/tableId")
            meta = session.getMeta(sessionId, tableId)
            
            fields_map = {f['fid']: f for f in req['fields']}
            focusedFields = req['focusedFields']
            res_data = Data.Result.TaskResultData(orig_matrix=orig_matrix, matrix=matrix, fields=[fields_map[f] for f in focusedFields])

            # result = Data.Result(modelId=modelId, data=res_data, res=res)
            result = Data.Result(modelId=modelId, data=res_data, res=res, edges=sorted_edges)
        elif task_status == 'FAILED':
            response.status_code = status.HTTP_400_BAD_REQUEST
            data = Data(
                taskType=task_meta['taskType'],
                taskOpt=task_meta['taskOpt'],
                taskParams=task_params,
                status=task_status,
                progress=progress)
            return TaskStatusResp(data=data, message=res_result)
        
    data = Data(
        taskType=task_meta['taskType'],
        taskOpt=task_meta['taskOpt'],
        taskParams=task_params,
        status=task_status,
        progress=progress,
        result=result)
    return TaskStatusResp(data=data)


# Estimation
@v0_1.get('/form/estimation', tags=['Estimation'])
def getEstimationSchema():
    return { }
Estimation = APIRouter(prefix='/s/{sessionId}', tags=['Intervention'])


# Intervention
@v0_1.get('/form/intervention', tags=['Intervention'])
def getInterventionSchema():
    return {
        algoName: getAlgoSchema(algoName, algo)
        for algoName, algo in intervention_alg.items()
    }
Intervention = APIRouter(prefix='/s/{sessionId}', tags=['Intervention'])
@Intervention.post('/intervene', response_model=InterveneResp)
def intervene(sessionId: str, req: InterveneReq):
    Data = InterveneResp.Data
    algoName, modelId, do, params = req.algoName, req.modelId, req.do, req.params
    logging.debug(f'args = {req}')
    params = params.dict()
    res = s.runIntervention(
        sessionId, modelId, do,
        **params
    )
    logging.warning(f'res = {res}')
    return InterveneResp(data=Data(base=res['baseline'], new=res['intervention']))

v0_1.include_router(Sessions)
v0_1.include_router(Discovery)
v0_1.include_router(Estimation)
v0_1.include_router(Intervention)
