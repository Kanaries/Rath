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

def list2dict(a: List):
    return {i: i for i in a}
class DECIParams(c.OptionalParams):
    # confidence_threshold: Optional[float] = Field(
    #     title='置信度阈值', default=0.11,
    #     ge=0.0, le=1.0, multiple_of=1e-5)
    base_distribution_type: Optional[str] = Field(
        default='gaussian',
        options=alg.common.getOpts(list2dict(['gaussian', 'spline']))) # Literal["gaussian", "spline"] = "gaussian"
    spline_bins: Optional[int] = Field(default=16, multiple_of=1)
    imputation: bool = False
    lambda_dag: float = 100.0
    lambda_sparse: float = 5.0
    tau_gumbel: float = 1.0
    var_dist_A_mode: Optional[str] = Field(
        default='three', options=alg.common.getOpts(list2dict(["simple", "enco", "true", "three"])))
    # imputer_layer_sizes: Optional[List[int]] = None
    mode_adjacency: Optional[str] = Field(
        default='learn',
        options=alg.common.getOpts(list2dict(["upper", "lower", "learn"])))
    # # TODO: Once pytorch implements opset 17 we can use nn.LayerNorm
    # norm_layers: bool = False
    norm_layers: bool = True
    res_connection: bool = True
    # encoder_layer_sizes: Optional[List[int]] = [32, 32]
    # decoder_layer_sizes: Optional[List[int]] = [32, 32]
    cate_rff_n_features: int = 3000
    # cate_rff_lengthscale: Union[int, float, List[float], Tuple[float, float]] = 1

class DECI(c.AlgInterface):
    ParamType = DECIParams
    pass