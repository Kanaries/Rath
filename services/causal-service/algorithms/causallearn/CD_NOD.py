from typing import Dict, List, Tuple, Optional, Union, Literal, Any
import traceback
from pydantic import Field, Extra
import numpy as np

from algorithms.common import getOpts, IDepTestItems, ICatEncodeType, IQuantEncodeType, UCPriorityItems, UCRuleItems, AlgoInterface, IRow, IDataSource, IFieldMeta, IFields
from algorithms.common import transDataSource, OptionalParams
import algorithms.common as common

from causallearn.search.ConstraintBased.CDNOD import cdnod
from causallearn.utils.PCUtils import SkeletonDiscovery
from causallearn.utils.PCUtils.BackgroundKnowledge import BackgroundKnowledge
from causallearn.utils.PCUtils.BackgroundKnowledgeOrientUtils import orient_by_background_knowledge

class CD_NOD_Params(OptionalParams, extra=Extra.allow):
    """
    此处CD-NOD算法暂不支持设置\"一定不相连\"
    cg.G.graph[j,i]=1 and cg.G.graph[i,j]=-1 表示 i –> j;
    cg.G.graph[i,j] = cg.G.graph[j,i] = -1 表示 i — j;
    cg.G.graph[i,j] = cg.G.graph[j,i] = 1 表示 i <-> j.
    """
    # """CD-NOD Algorithm
    # Returns: cg : a CausalGraph object, where
    # cg.G.graph[j,i]=1 and cg.G.graph[i,j]=-1 indicate i –> j;
    # cg.G.graph[i,j] = cg.G.graph[j,i] = -1 indicates i — j;
    # cg.G.graph[i,j] = cg.G.graph[j,i] = 1 indicates i <-> j.
    
    # """
    c_indx: Optional[str] = Field(
        default='$id', title="包含潜在影响因子的索引字段", #"Condition Index",
        description="", # "time index or domain index that captures the unobserved changing factors.",
        options=getOpts({
            '$id': "使用原有的ID",  # "use original index as condition index",
            '$fields': "" # "use specified field",
        }),
        extra=Extra.allow
    )
    alpha: Optional[float] = Field(
        default=0.05, title="显著性阈值", # "Alpha",
        description="desired significance level (float) in (0, 1). Default: 0.05.",
        gt=0.0, lt=1.0
    )
    indep_test: Optional[str] = Field(
        default='fisherz', title="独立性检验", #"Independence Test",
        description="The independence test to use for causal discovery",
        options=getOpts(IDepTestItems),
    )
    stable: Optional[bool] = Field(
        default=True, title="使用稳定版本",
        description="run stabilized skeleton discovery if True. Default: True.",
    )
    uc_rule: Optional[int] = Field(
        default=0, title="无向边冲突处理规则", # "UC Rule",
        description="The rule to use for undirected colliders",
        options=getOpts(UCRuleItems)
    )
    uc_priority: Optional[int] = Field(
        default=-1, title="无向边冲突优先级", # "UC Priority",
        desciption="The priority to use for undirected colliders",
        options=getOpts(UCPriorityItems)
    )
    mvcdnod: Optional[bool] = Field(
        default=False, title="允许空值的CD-NOD算法", # "Missing-Value CD-NOD",
        description="use missing-value PC or not. Default (and suggested for CDNOD): False."
    )


class CD_NOD(AlgoInterface):
    ParamType = CD_NOD_Params
    def __init__(self, dataSource: List[IRow], fields: List[IFieldMeta], params: Optional[ParamType] = ParamType()):
        super(CD_NOD, self).__init__(dataSource, fields, params)
    
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
        # if params.c_indx == '$field':
        #     if params.c_indx_field not in focusedFields:
        #         raise f"$field {params.c_indx_field} not existed"
        #     params.c_indx = self.data[params.c_indx_field].to_numpy().reshape((-1, 1))
        args = { **params.__dict__ }
        c_indx_field = None
        if params.c_indx == '$id':
            args['c_indx'] = self.dataSource.index.to_numpy().reshape((-1, 1))
            # print(args['c_indx'].dtype)
            c_indx_field = IFieldMeta(fid='$id', name='ID', semanticType='ordinal')
        else:
            args['c_indx'] = self.data.loc[:, [params.c_indx]].to_numpy()
            c_indx_field = [f for f in self.fields if f.fid == params.c_indx][0]
        # print("==========================\nc_indx=", args['c_indx'])
        if params.c_indx in focusedFields:
            focusedFields = [ f for f in focusedFields if f != params.c_indx ]
        array = self.selectArray(focusedFields=focusedFields, params=params)
        
        common.checkLinearCorr(array)
        # self.__class__.cache_path = '/tmp/cd-nod.json'
        self.__class__.cache_path = None
        self.cg = cdnod(array, **args, background_knowledge=None, cache_path=self.__class__.cache_path, verbose=self.__class__.verbose)
        fields = [ *[f for f in self.focusedFields if f.fid != params.c_indx], c_indx_field ]
        
        if bgKnowledgesPag and len(bgKnowledgesPag) > 0:
            f_ind = {f.fid: i for (i, f) in enumerate(fields)}
            bk = self.constructBgKnowledgePag(bgKnowledgesPag=bgKnowledgesPag, f_ind=f_ind)
            self.cg = cdnod(array, **args, background_knowledge=bk, cache_path=self.__class__.cache_path, verbose=self.__class__.verbose)
        
        l = self.cg.G.graph.tolist()
        return {
            'data': l,
            'matrix': l,
            'fields': self.safeFieldMeta(fields),
        }