from typing import Dict, List, Tuple, Optional, Union, Literal
import traceback
from pydantic import Field

from algorithms.common import getOpts, IDepTestItems, ICatEncodeType, IQuantEncodeType, UCPriorityItems, UCRuleItems, AlgoInterface, IRow, IDataSource, IFieldMeta, IFields
from algorithms.common import transDataSource, OptionalParams, ScoreFunctions, BandwidthMethods
import algorithms.common as common
from causallearn.utils.PCUtils.BackgroundKnowledge import BackgroundKnowledge

from causallearn.graph.GeneralGraph import GeneralGraph
from causallearn.graph.Node import Node

from causallearn.search.FCMBased import lingam

class RCDParams(OptionalParams, title="RCD Algorithm(暂不支持背景知识)"):
    max_explanatory_num: Optional[int] = Field(
        default=2, title="推导因果关系的最大变量数",
        description="Maximum number of explanatory variables.",
        ge=1, le=5, multiple_of=1
    )
    cor_alpha: Optional[float] = Field(
        default=0.01, title="Pearson系数的阈值",
        ge=0., le=1., multiple_of=0.002
    )
    ind_alpha: Optional[float] = Field(
        default=0.01, title="HSIC的阈值",
        ge=0., le=1., multiple_of=0.002
    )
    shapiro_alpha: Optional[float] = Field(
        default=0.01, title="Shapiro-Wilk测试的阈值",
        ge=0., le=1., multiple_of=0.002
    )
    MLHSICR: Optional[bool] = Field(
        default=False, title="是否使用MLHSICR进行多变量回归",
        description="If True, use MLHSICR for multiple regression, if False, use OLS for multiple regression.",
    )
    bw_method: Optional[str] = Field(
        default='mdbs', title="频宽算法",
        description="The method used to calculate the bandwidth of the HSIC.",
        options=getOpts(BandwidthMethods)
    )
    

class RCD(AlgoInterface):
    ParamType = RCDParams
    def __init__(self, dataSource: List[IRow], fields: List[IFieldMeta], params: Optional[ParamType] = ParamType()):
        super(RCD, self).__init__(dataSource=dataSource, fields=fields, params=params)
        
    def constructBgKnowledge(self, bgKnowledgesPag: Optional[List[common.BgKnowledgePag]] = [], f_ind: Dict[str, int] = {}):
        node = self.cg.G.get_nodes()
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
        
        model = lingam.RCD(params.max_explanatory_num, params.cor_alpha, params.ind_alpha, params.shapiro_alpha, params.MLHSICR, params.bw_method)
        model.fit(array)
        dag = model.adjacency_matrix_
        import numpy as np
        d = array.shape[1]
        pag = np.zeros((d, d), dtype=int)
        for i in range(d):
            for p in model.ancestors_list_[i]:
                pag[p, i] = -1
                pag[i, p] = 1
        
        return {
            'data': dag,
            'matrix': pag,
            'ancestors': model.ancestors_list_,
            'fields': self.safeFieldMeta(self.focusedFields),
        }
        