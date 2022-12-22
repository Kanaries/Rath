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
from .. import common as c

class DECIIParams(c.OptionalParams):
    confidence_threshold: Optional[float] = Field(
        title='置信度阈值(推断用)', default=0.11)
        # ge=0.0, le=1.0, multiple_of=1e-5)
    weight_threshold: Optional[float] = Field(
        title='权重阈值(推断用)', default=1e-3)
        # ge=0.0, le=1.0, multiple_of=1e-5)

class DECII(c.AlgInterface):
    ParamType = DECIIParams
    pass