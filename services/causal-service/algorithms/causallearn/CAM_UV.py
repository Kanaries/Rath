from typing import Dict, List, Tuple, Optional, Union, Literal
import traceback
from pydantic import Field

from algorithms.common import getOpts, IDepTestItems, ICatEncodeType, IQuantEncodeType, UCPriorityItems, UCRuleItems, AlgoInterface, IRow, IDataSource, IFieldMeta, IFields
from algorithms.common import transDataSource, OptionalParams, ScoreFunctions
import algorithms.common as common

from causallearn.search.FCMBased.lingam import CAMUV
from causallearn.graph.GeneralGraph import GeneralGraph
from causallearn.graph.Node import Node

class CAM_UVParams(OptionalParams, title="CAM-UV Algorithm(暂不支持背景知识)"):
    alpha: Optional[float] = Field(
        default=0.05, title="显著性阈值", # "Alpha",
        description="desired significance level (float) in (0, 1). Default: 0.05.",
        gt=0.0, le=1.0
    )
    num_explanatory_vals: Optional[int] = Field(
        default=0, title="推导因果关系的最大变量数",
        description="the maximum number of variables to infer causal relationships. This is equivalent to d in the paper.",
        ge=0, le=0, multiple_of=1
    )

class CAM_UV(AlgoInterface):
    ParamType = CAM_UVParams
    def __init__(self, dataSource: List[IRow], fields: List[IFieldMeta], params: Optional[ParamType] = ParamType()):
        super(CAM_UV, self).__init__(dataSource=dataSource, fields=fields, params=params)
        
    def constructBgKnowledge(self, bgKnowledgesPag: Optional[List[common.BgKnowledgePag]] = [], f_ind: Dict[str, int] = {}):
        import causallearn.graph.GraphNode as GraphNode
        node = [GraphNode(f"X{i+1}") for i in range(len(self.fields))]
        # self.bk = BackgroundKnowledge()
        # for k in bgKnowledges:
        #     if k.type > common.bgKnowledge_threshold[1]:
        #         self.bk.add_required_by_node(node[f_ind[k.src]], node[f_ind[k.tar]])
        #     elif k.type < common.bgKnowledge_threshold[0]:
        #         self.bk.add_forbidden_by_node(node[f_ind[k.src]], node[f_ind[k.tar]])
        # return self.bk
        
    def calc(self, params: Optional[ParamType] = ParamType(), focusedFields: List[str] = [], bgKnowledgesPag: Optional[List[common.BgKnowledgePag]] = [], **kwargs):
        array = self.selectArray(focusedFields=focusedFields, params=params)
        # common.checkLinearCorr(array)
        params.__dict__['cache_path'] = None # '/tmp/causal/pc.json'
        
        if params.num_explanatory_vals == 0:
            params.num_explanatory_vals = array.shape[1]
        
        P, U = CAMUV.execute(array, params.alpha, params.num_explanatory_vals)
        import numpy as np
        d = len(self.focusedFields)
        dag = np.zeros((d, d), dtype=int)
        pag = np.zeros((d, d), dtype=int)
        for i, ps in enumerate(P):
            for p in ps:
                dag[p, i] = 1
                pag[p, i] = -1
                pag[i, p] = 1
        return {
            'data': dag.tolist(),
            'matrix': pag.tolist(),
            'unobserved': U,
            'fields': self.safeFieldMeta(self.focusedFields),
        }
        