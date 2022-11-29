from typing import Dict, List, Tuple, Optional, Union, Literal
import traceback
from pydantic import Field

from algorithms.common import getOpts, IDepTestItems, ICatEncodeType, IQuantEncodeType, UCPriorityItems, UCRuleItems, AlgoInterface, IRow, IDataSource, IFieldMeta, IFields
from algorithms.common import transDataSource, OptionalParams, ScoreFunctions
import algorithms.common as common
from causallearn.utils.PCUtils.BackgroundKnowledge import BackgroundKnowledge
from causallearn.search.PermutationBased.GRaSP import grasp

class GRaSPParams(OptionalParams, title="GRaSP Algorithm(暂不支持背景知识)"):
    """Greedy relaxation of the sparsest permutation (GRaSP) algorithm.
    G: PAG
    """
    score_func: Optional[str] = Field(
        default='local_score_BIC', title='Score Function', description=" The score function you would like to use, including (see score_functions.). Default: ‘local_score_BIC’.",
        options=getOpts(ScoreFunctions))
    depth: Optional[int] = Field(
        default=-1, title="邻接表搜索深度", # 'Depth',
        description="The depth for the fast adjacency search, or -1 if unlimited. Default: -1.",
        ge=-1, le=8, multiple_of=1
    )
    maxP: Optional[int] = Field(
        default=0, title='Max Number of Parents', description="Allowed maximum number of parents when searching the graph. Default: 0, which means not given",
        ge=0, le=32, multiple_of=1,
    )
    """
    parameters: Needed when using CV likelihood. Default: None.
        parameters[‘kfold’]: k-fold cross validation.
        parameters[‘lambda’]: regularization parameter.
        parameters[‘dlabel’]: for variables with multi-dimensions, indicate which dimensions belong to the i-th variable.  """

class GRaSP(AlgoInterface):
    ParamType = GRaSPParams
    def __init__(self, dataSource: List[IRow], fields: List[IFieldMeta], params: Optional[ParamType] = ParamType()):
        super(GRaSP, self).__init__(dataSource=dataSource, fields=fields, params=params)
        
    def constructBgKnowledge(self, bgKnowledgesPag: Optional[List[common.BgKnowledgePag]] = [], f_ind: Dict[str, int] = {}):
        node = self.cg.G.get_nodes()
        # self.bk = BackgroundKnowledge()
        # for k in bgKnowledges:
        #     if k.type > common.bgKnowledge_threshold[1]:
        #         self.bk.add_required_by_node(node[f_ind[k.src]], node[f_ind[k.tar]])
        #     elif k.type < common.bgKnowledge_threshold[0]:
        #         self.bk.add_forbidden_by_node(node[f_ind[k.src]], node[f_ind[k.tar]])
        # return self.bk
        
    def calc(self, params: Optional[ParamType] = ParamType(), focusedFields: List[str] = [], bgKnowledges: Optional[List[common.BgKnowledge]] = [], **kwargs):
        array = self.selectArray(focusedFields=focusedFields, params=params)
        # common.checkLinearCorr(array)
        params.__dict__['cache_path'] = None # '/tmp/causal/pc.json'
        
        G = grasp(array, params.score_func, params.depth, params.maxP, None)
    
        return {
            'data': G.graph.tolist(),
            'matrix': G.graph.tolist(),
            'fields': self.safeFieldMeta(self.focusedFields),
        }