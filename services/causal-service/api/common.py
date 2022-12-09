import os, sys, json, time, argparse
import numpy as np, pandas as pd
from typing import Dict, List, Tuple, Optional, Union, Literal, Generic, TypeVar, Any
from enum import Enum
import typing as tp
import traceback, logging
from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field, Extra

import algorithms as alg
import interfaces as I

class IRestfulResp(BaseModel, extra=Extra.allow):
    success: bool = True
    data: Optional[Any]
    message: Optional[str]

class OptionalParams(BaseModel, extra=Extra.allow):
    pass

IRow = Dict[str, Union[int, float, str]]
IFieldMeta = Dict[str, object]

class AlgInterface:
    ParamType = OptionalParams
    dev_only = True
    verbose = False

def inferRender(p: Dict) -> Dict:
    import math
    res = {}
    t = p['type']
    opt = p.get('options', None)
    if t == 'boolean':
        res['renderType'] = 'toggle'
    elif opt is not None:
        res['renderType'] = 'dropdown'
        if t == 'integer':
            res['dataType'] = 'number'
        res['options'] = opt
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

def handleHttpException(e, response: Response):
    logging.warning(traceback.format_exc())
    response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    return repr(e)