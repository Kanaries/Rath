import os, sys, json, time, argparse
import numpy as np, pandas as pd
from typing import Dict, List, Tuple, Optional, Union, Literal, Generic, TypeVar, Any
from enum import Enum
import typing as tp
import traceback
from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field, Extra

import algorithms as alg
import interfaces as I

from . import common as c

# Sessions

class InitSessionResp(c.IRestfulResp):
    class Data(BaseModel):
        sessionId: str
        lifeSpan: int
    data: Optional[Data]

class SessionPingResp(c.IRestfulResp):
    class Data(BaseModel):
        lifeSpan: int
    data: Optional[Data]

class IField(BaseModel):
    fid: str
    name: Optional[str]
    semanticType: str

class ListTableResp(c.IRestfulResp):
    class Data(BaseModel):
        tableId: str
        tableName: Optional[str]
        fields: List[IField]
    data: Optional[List[Data]]

class UploadTableReq(BaseModel):
    tableId: Optional[str] = ''
    tableName: Optional[str] = ''
    format: Optional[str] = Field(options=alg.common.getOpts({'dataSource': 'DataSource'}))
    data: List[I.IRow]
    fields: List[I.IFieldMeta]

class UploadTableResp(c.IRestfulResp):
    class Data(BaseModel): tableId: str
    data: Optional[Data]
    
class DropTableResp(c.IRestfulResp):
    class Data(BaseModel): tableId: str
    data: Optional[Data]

# Discovery

class ServiceSchemaResp(BaseModel):
    class Item(BaseModel):
        class Option(BaseModel):
            text: str
            key: Union[int, str]
        class Conditions(BaseModel):
            class Or(BaseModel):
                class Ans(BaseModel):
                    key: str
                    oneOf: List[Any]
                and_: Optional[List[Ans]] = Field(alias='and')
            or_: Optional[List[Or]] = Field(alias='or')
        title: str
        key: str
        dataType: str
        renderType: str
        description: Optional[str]
        defaultValue: Optional[tp.Any]
        
        range: Optional[Union[Tuple[float, float], Tuple[int, int]]]
        step: Optional[Union[float, int]]
        options: Optional[List[Option]]
        conditions: Optional[Conditions]
    title: str
    items: List[Item]
    description: Optional[tp.Any]
    message: Optional[tp.Any]
    
class FormSchemaResp(c.IRestfulResp):
    data: Optional[Dict[str, ServiceSchemaResp]]

    
def getAlgoSchema(algoName: str, algo: c.AlgInterface) -> ServiceSchemaResp:
    if algo is None:
        raise f"No such algorithm named {algoName}."
    schema = algo.ParamType.schema()
    items = []
    Conditions = ServiceSchemaResp.Item.Conditions
    for key, p in schema['properties'].items():
        new_p = dict(p)
        new_p['key'] = key
        new_p['dataType'] = p['type']
        new_p['defaultValue'] = p.get('default', None)
        #TODO: fix: Conditional Params
        res = c.inferRender(new_p)
        new_p.update(res.items())
        # print('key =', key)
        # print('res =', res)
        items.append(
            ServiceSchemaResp.Item(
                **new_p
            )
        )
    return ServiceSchemaResp(
        title=schema.get('title', algoName),
        description=schema.get('description', f'optional params of {algoName}'),
        items=items,
        message=schema
    )

class DiscoverReq(BaseModel):
    algoName: str
    tableId: str
    fields: List[c.IFieldMeta]
    focusedFields: List[str]
    bgKnowledgesPag: Optional[List[alg.common.BgKnowledgePag]]
    funcDeps: Optional[List[alg.common.IFunctionalDep]]
    params: c.OptionalParams

class DiscoverResp(c.IRestfulResp):
    class Data(BaseModel): taskId: str
    data: Optional[Data]

class TaskStatusItem(BaseModel, extra=Extra.allow):
    taskType: str
    taskOpt: str
    taskParams: Optional[Union[DiscoverReq, Any]]
    status: Optional[str] = Field(options=alg.common.getOpts({s: s for s in ['PENDING', 'RUNNING', 'DONE', 'FAILED']}))
    progress: float = Field(ge=0.0, le=1.0)

class ListTaskResp(c.IRestfulResp):
    data: Dict[str, TaskStatusItem]

class TaskStatusResp(c.IRestfulResp):
    class Data(TaskStatusItem):
        class Result(BaseModel, extra=Extra.allow):
            class TaskResultData(BaseModel):
                orig_matrix: Optional[List[List[float]]]
                matrix: List[List[int]]
                fields: List[c.IFieldMeta]
            modelId: str
            data: TaskResultData
        result: Optional[Result]
        # class TaskStatusResp.Data
    data: Optional[Data]
    

class InterveneReq(BaseModel):
    algoName: str
    modelId: str
    do: Dict[str, float]
    params: c.OptionalParams

class InterveneResp(c.IRestfulResp):
    class Data(BaseModel):
        base: Dict[str, float]
        new: Dict[str, float]
    data: Optional[Data]