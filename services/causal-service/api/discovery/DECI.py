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
    default_link: Optional[str] = Field(
        default='train',
        options=alg.common.getOpts(list2dict(['empty', 'train', 'link']))
    )
    model_options: Optional[str] = '=============='
    # confidence_threshold: Optional[float] = Field(
    #     title='置信度阈值', default=0.11,
    #     ge=0.0, le=1.0, multiple_of=1e-5)
    base_distribution_type: Optional[str] = Field(
        default='gaussian',
        options=alg.common.getOpts(list2dict(['gaussian', 'spline']))) # Literal["gaussian", "spline"] = "gaussian"
    spline_bins: Optional[int] = Field(default=16, multiple_of=1)
    imputation: bool = False
    lambda_dag: float = 100.0
    lambda_sparse: Optional[float] = Field(
        default=0.5, title='稀疏性惩罚项权重')
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
    
    training_options: Optional[str] = '=============='
    learning_rate: Optional[float] = Field(
        default=1e-3, title='learning rate',
        gt=0.0, lt=1.0
    )
    batch_size: Optional[int] = Field(
        default=256, title='data items per batch',
        ge=1, le=1<<20, multiple_of=1
    )
    standardize_data_mean: bool = False
    standardize_data_std: bool = False
    rho: float = 1.0
    safety_rho: float = 1e13
    alpha: float = 0.0
    safety_alpha: float = 1e13
    tol_dag: float = 1e-3
    progress_rate: float = 0.25
    max_steps_auglag: int = 20
    max_auglag_inner_epochs: int = 1000
    max_p_train_dropout: float = 0.25
    reconstruction_loss_factor: float = 1.0
    anneal_entropy: Optional[str] = Field(
        default="noanneal",
        options=alg.common.getOpts(list2dict(["linear", "noanneal"]))
    )
    # Literal["linear", "noanneal"] = "noanneal"
    
    ate_options: Optional[str] = "===================================="
    Ngraphs: Optional[int] = 1
    Nsamples_per_graph: Optional[int] = 5000
    most_likely_graph: Optional[bool] = True

class DECI(c.AlgInterface):
    ParamType = DECIParams
    pass