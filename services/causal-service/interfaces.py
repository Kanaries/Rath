import os, sys, json, time, argparse
import numpy as np, pandas as pd
from typing import Dict, List, Tuple, Optional, Union, Literal, Generic, TypeVar
from enum import Enum
import typing as tp
import traceback
from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field, Extra

if False:
    class ServiceSchemaRequest(BaseModel):
        noting: Optional[str] = ""

    class DataTypeEnum(Enum):
        _number = 'number'
        _string = 'string'
        _time = 'time'
        _boolean = 'boolean'
        
    class RenderTypeEnum(Enum):
        _dropdown = 'dropdown'
        _slider = 'slider'
        _text = 'text'
        _toggle = 'toggle'
        _radio = 'radio'
        _checkbox = 'checkbox'

class ServiceSchemaItemOption(BaseModel):
    text: str
    key: Union[int, str]

class ServiceSchemaItem(BaseModel):
    title: str
    key: str
    dataType: str
    renderType: str
    description: Optional[str]
    defaultValue: Optional[tp.Any]
    
    range: Optional[Union[Tuple[float, float], Tuple[int, int]]]
    step: Optional[Union[float, int]]
    options: Optional[List[ServiceSchemaItemOption]]

class ServiceSchemaResponse(BaseModel):
    title: str
    items: List[ServiceSchemaItem]
    description: Optional[tp.Any]
    message: Optional[tp.Any]
    
IRow = Dict[str, Union[int, float, str]]
IFieldMeta = Dict[str, object]


class IFieldMeta(BaseModel):
    fid: str
    name: Optional[str]
    semanticType: str
    ''' 'quantitative' | 'nominal' | 'ordinal' | 'temporal' '''

from algorithms.common import OptionalParams, AlgoInterface, getCausalRequest, CausalAlgorithmResponse, CausalAlgorithmData


# class CausalRequest(Generic[T], BaseModel):
#     dataSource: List[IRow]
#     fields: List[IFieldMeta]
#     params: getParamType(T) # OptionalParams
    