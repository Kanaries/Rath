from typing import Dict, List, Tuple, Optional, Union, Literal
import logging
import traceback
from pydantic import Field

from algorithms.common import getOpts, ISELFBooster, ISELFScoreType, ICatEncodeType, IQuantEncodeType, UCPriorityItems, UCRuleItems, \
    AlgoInterface, IRow, IDataSource, IFieldMeta, IFields
from algorithms.common import transDataSource, OptionalParams
import algorithms.common as common

from causallearn.search.ConstraintBased.PC import get_adjacancy_matrix, pc
from causallearn.utils.PCUtils import SkeletonDiscovery
from causallearn.utils.PCUtils.BackgroundKnowledge import BackgroundKnowledge
from causallearn.utils.PCUtils.BackgroundKnowledgeOrientUtils import orient_by_background_knowledge

import rpy2.robjects.packages as rpackages
from rpy2.robjects import r
from rpy2.robjects import pandas2ri
pandas2ri.activate()
rpackages.importr('SELF')

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
        default='gbtree', title="XGBoost-Boost",  # "Independence Test",
        description="XGBoost中的booster参数，可选项为gbtree, gblinear, lm",
        options=getOpts(ISELFBooster),
    )
    gamma: Optional[float] = Field(
        default=10, title="XGBoost-Gamma",  # "Independence Test",
        description="XGBoost中的gamma参数，用于控制树的生长",
        gt=0.0, le=20
    )
    nrounds: Optional[float] = Field(
        default=20, title="XGBoost-nrounds",  # "Alpha",
        description="XGBoost中的nrounds参数，最大迭代次数",
        gt=0.0, le=30
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

    def calc(self, params: Optional[ParamType] = ParamType(), focusedFields: List[str] = [],
             bgKnowledgesPag: Optional[List[common.BgKnowledgePag]] = [], **kwargs):
        array = self.selectArray(focusedFields=focusedFields, params=params)
        # common.checkLinearCorr(array)
        logging.info("fields={}, array={}", self.fields, array)

        params.__dict__['cache_path'] = None  # '/tmp/causal/pc.json'

        # self.cg = pc(array, params.alpha, params.indep_test, params.stable, params.uc_rule, params.uc_priority, params.mvpc, cache_path=self.__class__.cache_path)
        # self.cg = pc(array, **params.__dict__, background_knowledge=None, verbose=self.__class__.verbose)
        # if bgKnowledgesPag and len(bgKnowledgesPag) > 0:
        #     f_ind = {fid: i for i, fid in enumerate(focusedFields)}
        #     bk = self.constructBgKnowledgePag(bgKnowledgesPag=bgKnowledgesPag, f_ind=f_ind)
        #     self.cg = pc(array, **params.__dict__, background_knowledge=bk, verbose=self.__class__.verbose)
        #
        # l = self.cg.G.graph.tolist()
        print(f'Param boost: {params.booster}')
        fhc = r('fhc')
        G = fhc(array, boost=params.booster, gamma=params.gamma, nrounds=params.nrounds, score_type=params.score_type).tolist()
        l = G
        for i in range(len(l)):
            for j in range(len(l[i])):
                if l[j][i] != 0:
                    if l[i][j] == 0:
                        l[i][j] = -l[j][i]
                    else:
                        l[i][j] = l[j][i] = 2  # circle
        return {
            'data': l,
            'matrix': l,
            'fields': self.safeFieldMeta(self.focusedFields)
        }