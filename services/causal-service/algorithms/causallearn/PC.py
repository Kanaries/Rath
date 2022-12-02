from typing import Dict, List, Tuple, Optional, Union, Literal
import traceback
from pydantic import Field

from algorithms.common import getOpts, IDepTestItems, ICatEncodeType, IQuantEncodeType, UCPriorityItems, UCRuleItems, AlgoInterface, IRow, IDataSource, IFieldMeta, IFields
from algorithms.common import transDataSource, OptionalParams
import algorithms.common as common

from causallearn.search.ConstraintBased.PC import get_adjacancy_matrix, pc
from causallearn.utils.PCUtils import SkeletonDiscovery
from causallearn.utils.PCUtils.BackgroundKnowledge import BackgroundKnowledge
from causallearn.utils.PCUtils.BackgroundKnowledgeOrientUtils import orient_by_background_knowledge

class PCParams(OptionalParams, title="PC Algorithm"):
    """
    cg : 
    cg.G.graph[j,i]=1 and cg.G.graph[i,j]=-1 表示 i –> j;
    cg.G.graph[i,j] = cg.G.graph[j,i] = -1 表示 i — j;
    cg.G.graph[i,j] = cg.G.graph[j,i] = 1 表示 i <-> j. 
    """
    # cg : a CausalGraph object, where
    # cg.G.graph[j,i]=1 and cg.G.graph[i,j]=-1 indicate i –> j;
    # cg.G.graph[i,j] = cg.G.graph[j,i] = -1 indicate i — j;
    # cg.G.graph[i,j] = cg.G.graph[j,i] = 1 indicates i <-> j. 
    # """
    indep_test: Optional[str] = Field(
        default='chisq', title="独立性检验", #"Independence Test",
        description="The independence test to use for causal discovery",
        options=getOpts(IDepTestItems),
    )
    alpha: Optional[float] = Field(
        default=0.05, title="显著性阈值", # "Alpha",
        description="desired significance level (float) in (0, 1). Default: 0.05.",
        gt=0.0, le=1.0
    )
    stable: Optional[bool] = Field(
        default=True, title="稳定版", #"Stable",
        description="Whether to use the stable version of PC",
    )
    uc_rule: Optional[int] = Field(
        default=0, title="无向冲突的处理规则", #"UC Rule",
        description="The rule to use for undirected colliders",
        options=getOpts(UCRuleItems)
    )
    uc_priority: Optional[int] = Field(
        default=-1, title="无向冲突优先级", # "UC Priority",
        desciption="The priority to use for undirected colliders",
        options=getOpts(UCPriorityItems)
    )
    mvpc: Optional[bool] = Field(
        default=0, title="使用支持空值的PC算法", # "Missing-Value PC",
        description="Whether to use MVPC"
    )

class PC(AlgoInterface):
    ParamType = PCParams
    dev_only = False
    def __init__(self, dataSource: List[IRow], fields: List[IFieldMeta], params: Optional[ParamType] = ParamType()):
        super(PC, self).__init__(dataSource=dataSource, fields=fields, params=params)
        
    def constructBgKnowledge(self, bgKnowledges: Optional[List[common.BgKnowledge]] = [], f_ind: Dict[str, int] = {}):
        node = self.cg.G.get_nodes()
        self.bk = BackgroundKnowledge()
        for k in bgKnowledges:
            if k.type > common.bgKnowledge_threshold[1]:
                self.bk.add_required_by_node(node[f_ind[k.src]], node[f_ind[k.tar]])
            elif k.type < common.bgKnowledge_threshold[0]:
                self.bk.add_forbidden_by_node(node[f_ind[k.src]], node[f_ind[k.tar]])
        return self.bk
        
    def calc(self, params: Optional[ParamType] = ParamType(), focusedFields: List[str] = [], bgKnowledgesPag: Optional[List[common.BgKnowledgePag]] = [], **kwargs):
        array = self.selectArray(focusedFields=focusedFields, params=params)
        # common.checkLinearCorr(array)
        print("fields=", self.fields)
        print("array=", array)
        
        params.__dict__['cache_path'] = None # '/tmp/causal/pc.json'
        
        # self.cg = pc(array, params.alpha, params.indep_test, params.stable, params.uc_rule, params.uc_priority, params.mvpc, cache_path=self.__class__.cache_path)
        self.cg = pc(array, **params.__dict__, background_knowledge=None, verbose=self.__class__.verbose)
        
        if bgKnowledgesPag and len(bgKnowledgesPag) > 0:
            f_ind = {fid: i for i, fid in enumerate(focusedFields)}
            bk = self.constructBgKnowledgePag(bgKnowledgesPag=bgKnowledgesPag, f_ind=f_ind)
            self.cg = pc(array, **params.__dict__, background_knowledge=bk, verbose=self.__class__.verbose)
    
        l = self.cg.G.graph.tolist()
        return {
            'data': l,
            'matrix': l,
            'fields': self.safeFieldMeta(self.focusedFields)
        }