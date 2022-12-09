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
    lifeSpan = session.initSession(sessionId)
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
    data = DiscoverResp.Data(taskId=taskId)
    return DiscoverResp(data=data)

@Discovery.delete('/task/{taskId}', response_model=c.IRestfulResp)
def killTask(sessionId: str, taskId: str):
    return {
        'success': True,
    }
    pass

@Discovery.get('/task/{taskId}', response_model=TaskStatusResp)
def getTaskStatus(sessionId: str, taskId: str):
    Result = TaskStatusResp
    Data = Result.Data
    data = Data(taskType='discovery', taskOpt='', status='PENDING', progress=0)
    data = Data(taskType='discovery', taskOpt='', status='FAILED', progress=0)
    msg = 'Not Implemented'
    return TaskStatusResp(data=data, message=msg)


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
    base = {}
    new = {}
    return InterveneResp(data=Data(base=base, new=new))

v0_1.include_router(Sessions)
v0_1.include_router(Discovery)
v0_1.include_router(Estimation)
v0_1.include_router(Intervention)
