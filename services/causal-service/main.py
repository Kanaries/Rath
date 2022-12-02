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
    
def inferRender(p: Dict, req: AlgoListRequest) -> Dict:
    res = {}
    t = p['type']
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
            res['renderType'] = 'slider'
            res['range'] = [
                p.get('minimum', p.get('exclusiveMinimum', -math.inf) + 1e-4),
                p.get('maximum', p.get('exclusiveMaximum', math.inf) - 1e-4)
            ]
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
    return {
        algoName: getAlgoSchema(algoName, req)
        for algoName, algo in algorithms.DICT.items() if algo.dev_only == False or debug == True
    }
    
@app.post('/algo/list/{algoName}', response_model=I.ServiceSchemaResponse)
async def algoListAlgo(algoName: str, req: AlgoListRequest, response: Response) -> I.ServiceSchemaResponse:
    try:
        response.headers['content-type'] = 'application/json'
        return getAlgoSchema(algoName, req)
    except Exception as e:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {
            "message": str(e)
        }


def getAlgoSchema(algoName: str, req: AlgoListRequest) -> I.ServiceSchemaResponse:
    algo: I.AlgoInterface = algorithms.__dict__.get(algoName, None)
    if algo is None:
        raise f"No such algorithm named {algoName}."
    schema = algo.ParamType.schema()
    items = []
    for key, p in schema['properties'].items():
        new_p = dict(p)
        new_p['key'] = key
        new_p['dataType'] = p['type']
        new_p['defaultValue'] = p.get('default', None)
        res = inferRender(new_p, req)
        new_p.update(res.items())
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
        schema = getAlgoSchema(algoName=algoName)
        return schema
    except Exception as e:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {
            "message": str(e)
        }

from algorithms.causallearn.PC import PCParams
from algorithms.causallearn.FCI import FCIParams
import sys
import logging

def causal(algoName: str, item: algorithms.CausalRequest, response: Response) -> I.CausalAlgorithmResponse:
    try:
        method: I.AlgoInterface = algorithms.DICT.get(algoName)(item.dataSource, item.fields, item.params)
        print("causal", item.params, item.focusedFields, item.bgKnowledgesPag)
        data = method.calc(item.params, item.focusedFields, bgKnowledgesPag=item.bgKnowledgesPag, funcDeps=item.funcDeps)
        response_data = I.CausalAlgorithmData(
            orig_matrix=data.get('data'),
            matrix=data.get('matrix', data.get('data')),
            fields=data.get('fields'),
            extra={ 'debug': data if debug else "" }
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
