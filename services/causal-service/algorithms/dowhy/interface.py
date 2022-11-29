import pydantic as pyd
import os, sys, json, time, argparse
import numpy as np, pandas as pd
from typing import Dict, List, Tuple, Optional, Union, Literal, Any
import typing as tp
import traceback
from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field, Extra
import traceback

from algorithms import common
from algorithms.common import IFieldMeta, IRow, IDataSource, IFields

PagNode = {
    -1: 'BLANK',
    0: 'EMPTY',
    1: 'ARROW',
    2: 'CIRCLE'
}

class PagLink(BaseModel):
    src: str
    tar: str
    src_type: Optional[int] = Field(options=common.getOpts(PagNode))
    tar_type: Optional[int] = Field(options=common.getOpts(PagNode))

class IFilter(BaseModel):
    fid: str
    disable: Optional[str] = Field(default=None)
    type: Optional[str] = Field(default='set')
    values: Optional[List[Any]] = Field(default=None)
    range: Optional[List[int]] = Field(default=None)

class IRInsightExplainSubspace(BaseModel):
    predicates: List[IFilter]
    reverted: Optional[bool] = Field(default=False)

class ICausalModel(BaseModel):
    funcDeps: List[common.IFunctionalDep]
    edges: List[PagLink]
    
class IRInsightSubspaceGroup(BaseModel):
    current: IRInsightExplainSubspace
    other: IRInsightExplainSubspace

class IRMeasureSpec(BaseModel):
    fid: str
    op: Optional[str] = Field(include={'sum', 'mean', 'count'})
    
class IRViewSpec(BaseModel):
    dimensions: List[str]
    measures: List[IRMeasureSpec]
    
class IRInsightExplainProps(BaseModel):
    data: List[IRow]
    fields: List[common.IFieldMeta]
    causalModel: ICausalModel
    groups: IRInsightSubspaceGroup
    view: IRViewSpec

class LinkInfoDescription(BaseModel):
    key: str
    data: Optional[Dict[str, Any]]
    
class LinkInfo(PagLink):
    description: Optional[LinkInfoDescription]
    responsibility: Optional[float] = Field(ge=0, le=1)
    
class IRInsightExplainResult(BaseModel, extra=Extra.allow):
    causalEffects: List[LinkInfo]
    
class IRInsightExplainResponse(BaseModel):
    success: bool
    data: Optional[IRInsightExplainResult] = Field(default=None)
    message: Optional[Any] = Field(default=None)

    """
            Currently requires an explicit method name to be specified. Method names follow the convention of identification method followed by the specific estimation method: "[backdoor/iv].estimation_method_name". Following methods are supported.
            * Propensity Score Matching: "backdoor.propensity_score_matching"
            * Propensity Score Stratification: "backdoor.propensity_score_stratification"
            * Propensity Score-based Inverse Weighting: "backdoor.propensity_score_weighting"
            * Linear Regression: "backdoor.linear_regression"
            * Generalized Linear Models (e.g., logistic regression): "backdoor.generalized_linear_model"
            * Instrumental Variables: "iv.instrumental_variable"
            * Regression Discontinuity: "iv.regression_discontinuity"

        In addition, you can directly call any of the EconML estimation methods. The convention is "backdoor.econml.path-to-estimator-class". For example, for the double machine learning estimator ("DML" class) that is located inside "dml" module of EconML, you can use the method name, "backdoor.econml.dml.DML". CausalML estimators can also be called. See `this demo notebook <https://py-why.github.io/dowhy/example_notebooks/dowhy-conditional-treatment-effects.html>`_.
    """