import os, sys, json, time, argparse
import numpy as np, pandas as pd
from typing import Dict, List, Tuple, Optional, Union, Literal
import traceback
from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field

from algorithms.common import getOpts, IDepTestItems, ICatEncodeType, IQuantEncodeType, UCPriorityItems, UCRuleItems, AlgoInterface, IRow, IDataSource, IFieldMeta, IFields
from algorithms.common import transDataSource, OptionalParams
import algorithms.common as common

from causallearn.search.ConstraintBased.FCI import fci
from causallearn.utils.PCUtils import SkeletonDiscovery
from causallearn.utils.PCUtils.BackgroundKnowledge import BackgroundKnowledge
from causallearn.utils.PCUtils.BackgroundKnowledgeOrientUtils import orient_by_background_knowledge


class FCIParams(OptionalParams):
    """
    G:
    - G.graph[j,i] = 1 and G.graph[i,j] = -1 indicates i -> j
    - G.graph[i,j] = G.graph[j,i] = -1 indicates i -- j
    - G.graph[i,j] = G.graph[j,i] = 1 indicates i <-> j
    - G.graph[j,i] = 1 and G.graph[i,j] = 2 indicates i o-> j
    """
    # """
    # G: a CausalGraph object, where
    # G.graph[j,i]=1 and G.graph[i,j]=-1 indicates i –> j;
    # G.graph[i,j] = G.graph[j,i] = -1 indicates i — j;
    # G.graph[i,j] = G.graph[j,i] = 1 indicates i <-> j;
    # G.graph[j,i]=1 and G.graph[i,j]=2 indicates i o-> j.
    
    # edges: list. Contains graph’s edges properties. If edge.properties have the Property ‘dd’, then there is no latent confounder. Otherwise, there might be latent confounders. If edge.properties have the Property ‘nl’, then it is definitely direct. Otherwise, it is possibly direct.
    # """
    independence_test_method: Optional[str] = Field(
        default='fisherz', title="Independence test",
        description="Independence test method function.  Default: ‘fisherz’",
        options=getOpts(IDepTestItems),
    )
    alpha: Optional[float] = Field(
        default=0.05, title="Significance level (alpha)",
        description="Significance level of individual partial correlation tests. Default: 0.05.",
        gt=0.0, le=1.0
    )
    depth: Optional[int] = Field(
        default=-1, title="Adjacency search depth",
        description="The depth for the fast adjacency search, or -1 if unlimited. Default: -1.",
        ge=-1, le=8, multiple_of=1
    )
    max_path_length: Optional[int] = Field(
        default=-1, title="Max discriminating path length",
        description="The maximum length of any discriminating path, or -1 if unlimited. Default: -1",
        ge=-1, le=16, multiple_of=1
    )

class FCI(AlgoInterface):
    ParamType = FCIParams
    dev_only = False
    def __init__(self, dataSource: List[IRow], fields: List[IFieldMeta], params: Optional[ParamType] = ParamType()):
        super(FCI, self).__init__(dataSource, fields, params)
        
    def calc(self, params: Optional[ParamType] = ParamType(), focusedFields: List[str] = [], bgKnowledgesPag: Optional[List[common.BgKnowledgePag]] = [], **kwargs):
        array = self.selectArray(focusedFields=focusedFields, params=params)
        # common.checkLinearCorr(array)
        fci_kwargs = {**params.__dict__}
        # These are preprocessing options, not FCI parameters.
        fci_kwargs.pop('catEncodeType', None)
        fci_kwargs.pop('quantEncodeType', None)
        self.G, self.edges = fci(array, **fci_kwargs, background_knowledge=None, cache_path=self.__class__.cache_path, verbose=self.__class__.verbose)
        
        if bgKnowledgesPag and len(bgKnowledgesPag) > 0:
            f_ind = {fid: i for i, fid in enumerate(focusedFields)}
            bk = self.constructBgKnowledgePag(bgKnowledgesPag=bgKnowledgesPag, f_ind=f_ind)
            self.G, self.edges = fci(array, **fci_kwargs, background_knowledge=bk, cache_path=self.__class__.cache_path, verbose=self.__class__.verbose)
        l = self.G.graph.tolist()
        return {
            'data': l,
            'matrix': l,
            'fields': self.safeFieldMeta(self.focusedFields),
            'edges': self.edges
        }