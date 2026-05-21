import os, sys, json, time, argparse, math
import numpy as np, pandas as pd
from typing import Dict, List, Tuple, Optional, Union, Literal, Generic
import traceback
from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field, Extra
import interfaces as I
import algorithms
import uuid
import threading

debug = os.environ.get('mode', 'prod') == 'dev'
print("Development Mode" if debug else 'Production Mode', file=sys.stderr)
app = FastAPI()
origins = [ "*" ]
cors_regex = \
    "^(https?\://)?(([\w\-_\.]*\.)?kanaries\.\w*|rath[\w\-_]*\-kanaries\.vercel.app)(\:\d{1,})?$" if not debug else \
    "^(https?\://)?(([\w\-_\.]*\.)?kanaries\.\w*|rath[\w\-_]*\-kanaries\.vercel.app|localhost|192\.168\.\d{1,3}\.\d{1,3}|127\.0\.0\.1)(\:\d{1,})?$"
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    # allow_origin_regex="^https?\://([\w\-_\.]*\.kanaries\.\w*|rath[\w\-_]*\-kanaries\.vercel.app)(\:\d{1,})?$",
    allow_origin_regex=cors_regex,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
# {
#     title: string;
#     key: string;
#     description?: string;
#     dataType: 'number' | 'string' | 'time' | 'boolean';
#     renderType: 'dropdown' | 'slider' | 'text' | 'toggle' | 'radio' | 'checkbox';
#     defaultValue?: any;
#     range?: [number, number]; //slider
#     step?: number; // slider
#     options?: {text: string; key: any}[] // dropdown or radio or checkbox
# }

class AlgoListRequest(BaseModel, extra=Extra.allow):
    fieldIds: Optional[List[str]] = Field(default=[], title="field Ids")
    fieldMetas: Optional[List[I.IFieldMeta]] = Field(default=[], title="field metas")
    
def _schema_type(p: Dict) -> str:
    """
    Best-effort extraction of JSON-schema type for pydantic v1/v2 outputs.
    """
    t = p.get('type')
    if isinstance(t, str):
        return t
    # Pydantic v2 often uses anyOf/oneOf for Optional/Union
    for k in ('anyOf', 'oneOf', 'allOf'):
        if k in p and isinstance(p[k], list):
            for sub in p[k]:
                if isinstance(sub, dict):
                    st = _schema_type(sub)
                    if st != 'null':
                        return st
    if '$ref' in p:
        return 'object'
    return 'string'

def inferRender(p: Dict, req: AlgoListRequest) -> Dict:
    res = {}
    t = _schema_type(p)
    opt = p.get('options', None)
    if t == 'boolean':
        res['renderType'] = 'toggle'
    elif opt is not None:
        res['renderType'] = 'dropdown'
        res_opt = []
        if t == 'integer':
            res['dataType'] = 'number'
        for o in opt:
            if o['key'] == '$fields':
                if req.fieldMetas and len(req.fieldMetas) > 0:
                    res_opt.extend([{
                        'key': meta.fid,
                        'text': meta.name if meta.name and len(meta.name) > 0 else meta.fid
                    } for meta in req.fieldMetas])
            else:
                res_opt.append(o)
        res['options'] = res_opt
    elif t == 'number' or t == 'integer':
        res['dataType'] = 'number'
        if p.keys().isdisjoint(['maximum', 'minimum', 'exclusiveMinimum', 'exclusiveMaximum']):
            res['renderType'] = 'text'
        else:
            # Avoid emitting +/-Infinity in JSON, which breaks JSON.parse in browsers.
            mn = p.get('minimum')
            if mn is None:
                ex_mn = p.get('exclusiveMinimum')
                mn = None if ex_mn is None else ex_mn + 1e-4
            mx = p.get('maximum')
            if mx is None:
                ex_mx = p.get('exclusiveMaximum')
                mx = None if ex_mx is None else ex_mx - 1e-4

            if mn is None or mx is None or (isinstance(mn, (int, float)) and not math.isfinite(mn)) or (isinstance(mx, (int, float)) and not math.isfinite(mx)):
                res['renderType'] = 'text'
                return res

            res['renderType'] = 'slider'
            res['range'] = [mn, mx]
            step = p.get('multipleOf')
            if step is not None:
                res['step'] = step
            else:
                res['step'] = 1e-4
    else:
        res['renderType'] = 'text'
        pass
    return res


@app.post('/algo/list', response_model=Dict[str, I.ServiceSchemaResponse])
async def algoList(req: AlgoListRequest, response: Response) -> Dict[str, I.ServiceSchemaResponse]:
    response.headers['content-type'] = 'application/json'
    # print("/algo/list", req)
    res: Dict[str, I.ServiceSchemaResponse] = {}
    for algoName, algo in algorithms.DICT.items():
        if algo.dev_only and not debug:
            continue
        try:
            res[algoName] = getAlgoSchema(algoName, req)
        except Exception as e:
            # Never return invalid JSON from /algo/list; this endpoint drives UI initialization.
            res[algoName] = I.ServiceSchemaResponse(
                title=algoName,
                items=[],
                description=str(e),
                message={"error": str(e)},
            )
    return res
    
@app.post('/algo/list/{algoName}', response_model=I.ServiceSchemaResponse)
async def algoListAlgo(algoName: str, req: AlgoListRequest, response: Response) -> I.ServiceSchemaResponse:
    try:
        response.headers['content-type'] = 'application/json'
        return getAlgoSchema(algoName, req)
    except Exception as e:
        response.status_code = status.HTTP_400_BAD_REQUEST
        # Keep the response shape stable for the frontend (it expects a schema object).
        return I.ServiceSchemaResponse(
            title=algoName,
            items=[],
            description=str(e),
            message={"error": str(e)},
        )


def getAlgoSchema(algoName: str, req: AlgoListRequest) -> I.ServiceSchemaResponse:
    algo: I.AlgoInterface = algorithms.__dict__.get(algoName, None)
    if algo is None:
        raise f"No such algorithm named {algoName}."
    schema = algo.ParamType.schema()
    items = []
    for key, p in schema['properties'].items():
        new_p = dict(p)
        new_p['key'] = key
        new_p['dataType'] = _schema_type(p)
        new_p['defaultValue'] = p.get('default', None)
        res = inferRender(new_p, req)
        new_p.update(res)
        # print('key =', key)
        # print('res =', res)
        items.append(
            I.ServiceSchemaItem(
                **new_p
            )
        )
    return I.ServiceSchemaResponse(
        title=schema['title'],
        description=schema['description'],
        items=items,
        message=schema
    )
    # return {
    #     "title":  # algo,
    #     "description": schema['description'],
    #     "items": items,
    #     "message": schema
    # }

@app.get('/algo/schema/{algoName}')
async def algoSchema(algoName: str, response: Response):
    response.headers['content-type'] = 'application/json'
    try:
        schema = getAlgoSchema(algoName=algoName, req=AlgoListRequest())
        return schema
    except Exception as e:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return I.ServiceSchemaResponse(
            title=algoName,
            items=[],
            description=str(e),
            message={"error": str(e)},
        )

from algorithms.causallearn.PC import PCParams
from algorithms.causallearn.FCI import FCIParams
import sys
import logging
from typing import Any

def _json_safe(obj: Any):
    """
    Best-effort conversion of arbitrary objects to JSON-serializable structures.
    This is used for debug payloads; correctness > completeness.
    """
    # Primitives
    if obj is None or isinstance(obj, (str, int, float, bool)):
        return obj
    # Numpy scalars / arrays
    try:
        import numpy as _np
        if isinstance(obj, _np.generic):
            return obj.item()
        if isinstance(obj, _np.ndarray):
            return obj.tolist()
    except Exception:
        pass
    # Pandas
    try:
        import pandas as _pd
        if isinstance(obj, _pd.DataFrame):
            return obj.to_dict(orient="list")
        if isinstance(obj, _pd.Series):
            return obj.to_list()
    except Exception:
        pass
    # Mappings / iterables
    if isinstance(obj, dict):
        return {str(k): _json_safe(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple, set)):
        return [_json_safe(v) for v in obj]
    # Pydantic models
    try:
        from pydantic import BaseModel as _BM
        if isinstance(obj, _BM):
            return _json_safe(obj.dict())
    except Exception:
        pass
    # Fallback: string representation
    try:
        return str(obj)
    except Exception:
        return repr(obj)

def causal(algoName: str, item: algorithms.CausalRequest, response: Response) -> I.CausalAlgorithmResponse:
    try:
        if len(item.dataSource) == 0 or len(item.focusedFields) == 0:
            raise Exception('Empty dataSource or focusedFields.')
        method: I.AlgoInterface = algorithms.DICT.get(algoName)(item.dataSource, item.fields, item.params)
        print("causal", item.params, item.focusedFields, item.bgKnowledgesPag)
        data = method.calc(item.params, item.focusedFields, bgKnowledgesPag=item.bgKnowledgesPag, funcDeps=item.funcDeps)
        debug_payload = _json_safe(data) if debug else ""
        response_data = I.CausalAlgorithmData(
            orig_matrix=data.get('data'),
            matrix=data.get('matrix', data.get('data')),
            fields=data.get('fields'),
            extra={ 'debug': debug_payload }
        )
        return I.CausalAlgorithmResponse(
            success=True,
            data=response_data
        )
    except Exception as e:
        msg = traceback.format_exc()
        print(msg, file=sys.stderr)
        response.status_code = status.HTTP_400_BAD_REQUEST
        return I.CausalAlgorithmResponse(
            success=False,
            message=str(e)
        )

# -----------------------
# Minimal background jobs
# -----------------------

_JOB_DIR = os.environ.get("RATH_JOB_DIR", "/tmp/rath-jobs")
os.makedirs(_JOB_DIR, exist_ok=True)

def _job_path(job_id: str) -> str:
    return os.path.join(_JOB_DIR, f"{job_id}.json")

def _write_job(job_id: str, payload: Dict[str, Any]) -> None:
    tmp = _job_path(job_id) + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)
    os.replace(tmp, _job_path(job_id))

def _read_job(job_id: str) -> Optional[Dict[str, Any]]:
    p = _job_path(job_id)
    if not os.path.exists(p):
        return None
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)

class JobCreateResponse(BaseModel):
    success: bool = True
    data: Dict[str, str]
    message: Optional[str] = None

@app.post("/jobs/causal/{algoName}", response_model=JobCreateResponse)
async def create_causal_job(algoName: str, item: algorithms.CausalRequest, response: Response) -> JobCreateResponse:
    response.headers["content-type"] = "application/json"
    job_id = uuid.uuid4().hex
    now = time.time()
    _write_job(job_id, {
        "jobId": job_id,
        "type": "causal",
        "algoName": algoName,
        "status": "queued",
        "createdAt": now,
        "updatedAt": now,
    })

    def run_job():
        try:
            _write_job(job_id, {**_read_job(job_id), "status": "running", "updatedAt": time.time()})
            # Reuse same logic as sync endpoint.
            if len(item.dataSource) == 0 or len(item.focusedFields) == 0:
                raise Exception("Empty dataSource or focusedFields.")
            method: I.AlgoInterface = algorithms.DICT.get(algoName)(item.dataSource, item.fields, item.params)
            data = method.calc(item.params, item.focusedFields, bgKnowledgesPag=item.bgKnowledgesPag, funcDeps=item.funcDeps)
            debug_payload = _json_safe(data) if debug else ""
            response_data = I.CausalAlgorithmData(
                orig_matrix=data.get("data"),
                matrix=data.get("matrix", data.get("data")),
                fields=data.get("fields"),
                extra={"debug": debug_payload},
            )
            result = I.CausalAlgorithmResponse(success=True, data=response_data).dict()
            _write_job(job_id, {
                "jobId": job_id,
                "type": "causal",
                "algoName": algoName,
                "status": "done",
                "createdAt": now,
                "updatedAt": time.time(),
                "result": result,
            })
        except Exception as e:
            _write_job(job_id, {
                "jobId": job_id,
                "type": "causal",
                "algoName": algoName,
                "status": "failed",
                "createdAt": now,
                "updatedAt": time.time(),
                "error": str(e),
                "traceback": traceback.format_exc(),
            })

    threading.Thread(target=run_job, daemon=True).start()
    return JobCreateResponse(success=True, data={"jobId": job_id})

@app.get("/jobs/{jobId}")
async def get_job(jobId: str, response: Response):
    response.headers["content-type"] = "application/json"
    job = _read_job(jobId)
    if job is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"success": False, "message": "Job not found"}
    return {"success": True, "data": job}

for algoName, algo in algorithms.DICT.items():
    algorithms.registerCausalRequest(app, algoName, algo, causal, Response)
#     cur_globals = {**globals(), 'algoName': algoName, 'algo': algo }
#     exec(f'''
# #@app.post('/causal/{algoName}')
# async def causal{algoName}(item: I.getCausalRequest(algorithms.DICT.get('{algoName}')), response: Response):
#     return causal('{algoName}', item, response)
# globals()['causal{algoName}'] = causal{algoName}
# globals()['causal{algoName}'] = app.post('/causal/{algoName}')(globals()['causal{algoName}'])
# ''', cur_globals)
#     globals()[f'causal{algoName}'] = cur_globals[f'causal{algoName}']

@app.get('/')
async def ping():
    return "pong"

from algorithms import dowhy
@app.post('/explain', response_model=dowhy.IRInsightExplainResponse)
async def explainData(item: dowhy.IRInsightExplainProps):
    data = dowhy.ExplainData(item)
    return dowhy.IRInsightExplainResponse(
        data=data,
        success=True,
        message={}
    )
