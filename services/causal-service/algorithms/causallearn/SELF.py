import time
from typing import Dict, List, Tuple, Optional, Union, Literal
import logging
import traceback

import xgboost
from pydantic import Field

from algorithms.common import getOpts, ISELFBooster, ISELFScoreType, ICatEncodeType, IQuantEncodeType, UCPriorityItems, UCRuleItems, \
    AlgoInterface, IRow, IDataSource, IFieldMeta, IFields
from algorithms.common import transDataSource, OptionalParams
import algorithms.common as common

from causallearn.search.ConstraintBased.PC import get_adjacancy_matrix, pc
from causallearn.utils.PCUtils import SkeletonDiscovery
from causallearn.utils.PCUtils.BackgroundKnowledge import BackgroundKnowledge
from causallearn.utils.PCUtils.BackgroundKnowledgeOrientUtils import orient_by_background_knowledge

import rpy2
import rpy2.robjects.packages as rpackages
from rpy2.robjects import r
from rpy2.robjects import pandas2ri
pandas2ri.activate()
rpackages.importr('SELF')
rpackages.importr('xgboost')
r('xgb.set.config')(verbosity=0)
rpy2.robjects.r("warnings('off')")

from algorithms.reproduction.SELF.SELF import FastHillClimb
import numpy as np


class SELFParams(OptionalParams, title="SELF"):
    """
    cg :
    cg.G.graph[j,i]=1 and cg.G.graph[i,j]=-1 表示 i –> j;
    cg.G.graph[i,j] = cg.G.graph[j,i] = -1 表示 i — j;
    cg.G.graph[i,j] = cg.G.graph[j,i] = 1 表示 i <-> j.
    参数：
    score_type: 模型复杂度正则化项['bic', 'aic', 'log'], default='bic'
    booster: ['gbtree', 'gblinear', 'lm'], default='gbtree'
    gamma: 叶节点进一步分区所需的最小损失减少, default=10
    nrounds: 最大迭代次数, default=20
    """
    # cg : a CausalGraph object, where
    # cg.G.graph[j,i]=1 and cg.G.graph[i,j]=-1 indicate i –> j;
    # cg.G.graph[i,j] = cg.G.graph[j,i] = -1 indicate i — j;
    # cg.G.graph[i,j] = cg.G.graph[j,i] = 1 indicates i <-> j.
    # """
    score_type: Optional[str] = Field(
        default='bic', title='score_type',
        description='模型复杂度正则化项',
        options=getOpts(ISELFScoreType)
    )
    booster: Optional[str] = Field(
        default='gblinear', title="XGBoost-Boost",  # "Independence Test",
        description="XGBoost中的booster参数，可选项为gbtree, gblinear, lm",
        options=getOpts(ISELFBooster),
    )
    gamma: Optional[float] = Field(
        default=10, title="XGBoost-Gamma",  # "Independence Test",
        description="XGBoost中的gamma参数，用于控制树的生长",
        gt=0.0, le=20
    )
    nrounds: Optional[int] = Field(
        default=20, title="XGBoost-nrounds",  # "Alpha",
        description="XGBoost中的nrounds参数，最大迭代次数",
        gt=0, le=30
    )
    use_R: Optional[bool] = Field(
        default=False, title="Use R language as lib",
        description="调用R语言",
    )
    use_py_package: Optional[bool] = Field(
        default=False, title="Use Python xgboost",
        description="调用Python xgboost",
    )


class SELF(AlgoInterface):
    ParamType = SELFParams
    dev_only = False

    def __init__(self, dataSource: List[IRow], fields: List[IFieldMeta], params: Optional[ParamType] = ParamType()):
        super(SELF, self).__init__(dataSource=dataSource, fields=fields, params=params)

    def constructBgKnowledge(self, bgKnowledges: Optional[List[common.BgKnowledge]] = [], f_ind: Dict[str, int] = {}):
        node = self.cg.G.get_nodes()
        self.bk = BackgroundKnowledge()
        for k in bgKnowledges:
            if k.type > common.bgKnowledge_threshold[1]:
                self.bk.add_required_by_node(node[f_ind[k.src]], node[f_ind[k.tar]])
            elif k.type < common.bgKnowledge_threshold[0]:
                self.bk.add_forbidden_by_node(node[f_ind[k.src]], node[f_ind[k.tar]])
        return self.bk

    def constructBkGraph(self, bgKnowledgesPag: Optional[List[common.BgKnowledgePag]] = [], f_ind: Dict[str, int] = {}):
        graph = np.zeros((len(f_ind), len(f_ind)))
        rules = graph.copy()
        for k in bgKnowledgesPag:
            if k.src_type == 1 and k.tar_type == -1:
                graph[f_ind[k.src], f_ind[k.tar]] = 1
                rules[f_ind[k.src], f_ind[k.tar]] = 1
                rules[f_ind[k.tar], f_ind[k.src]] = -1
            elif k.src_type == -1 and k.tar_type == 1:
                graph[f_ind[k.tar], f_ind[k.src]] = 1
                rules[f_ind[k.tar], f_ind[k.src]] = 1
                rules[f_ind[k.src], f_ind[k.tar]] = -1
            elif k.src_type == 0:
                rules[f_ind[k.src], f_ind[k.tar]] = -1
            elif k.tar_type == 0:
                rules[f_ind[k.tar], f_ind[k.src]] = -1
        return graph, rules

    def calc(self, params: Optional[ParamType] = ParamType(), focusedFields: List[str] = [],
             bgKnowledgesPag: Optional[List[common.BgKnowledgePag]] = [], **kwargs):
        array = self.selectArray(focusedFields=focusedFields, params=params)
        # common.checkLinearCorr(array)
        logging.info("fields={}, array={}", self.fields, array)

        params.__dict__['cache_path'] = None  # '/tmp/causal/pc.json'

        print(f"array: {array[:5]}")
        print(f"fields: {self.focusedFields}")
        t_s = time.time_ns()
        if bgKnowledgesPag and len(bgKnowledgesPag) > 0:
            f_ind = {fid: i for i, fid in enumerate(focusedFields)}
            print(f"f_ind: {f_ind}")
            init_graph, rules = self.constructBkGraph(bgKnowledgesPag=bgKnowledgesPag, f_ind=f_ind)
            if params.use_R:
                fhc = r('fhc')
                G = fhc(array, init_graph, boost=params.booster, gamma=params.gamma, nrounds=params.nrounds,
                        score_type=params.score_type).tolist()
            else:
                fasthillclimb = FastHillClimb(array, init_graph, rules, score_type=params.score_type,
                                              booster=params.booster, gamma=params.gamma, max_iter=params.nrounds,
                                              use_py_package=params.use_py_package)
                G = fasthillclimb.fit().tolist()
        else:
            if params.use_R:
                fhc = r('fhc')
                G = fhc(array, boost=params.booster, gamma=params.gamma, nrounds=params.nrounds,
                        score_type=params.score_type).tolist()
            else:
                fasthillclimb = FastHillClimb(array, score_type=params.score_type,
                                              booster=params.booster, gamma=params.gamma, max_iter=params.nrounds,
                                              use_py_package=params.use_py_package)
                G = fasthillclimb.fit().tolist()
        print(f"SELF time: {(time.time_ns() - t_s) / 1e6}ms")
        l = G
        for i in range(len(l)):
            for j in range(len(l[i])):
                if l[j][i] != 0:
                    if l[i][j] == 0:
                        l[i][j] = -l[j][i]
                if l[i][j] == l[j][i] == 1:
                    l[i][j] = l[j][i] = 2  # circle
        print(np.array(l))
        return {
            'data': l,
            'matrix': l,
            'fields': self.safeFieldMeta(self.focusedFields)
        }