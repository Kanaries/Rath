from typing import Dict, List, Tuple, Optional, Union, Literal
import traceback
from pydantic import Field
import numpy as np

from algorithms.common import getOpts, IDepTestItems, ICatEncodeType, IQuantEncodeType, UCPriorityItems, UCRuleItems, AlgoInterface, IRow, IDataSource, IFieldMeta, IFields
from algorithms.common import transDataSource, OptionalParams, ScoreFunctions, SearchMethods
import algorithms.common as common

from causallearn.search.ScoreBased.ExactSearch import bic_exact_search

class ESParams(OptionalParams, title="Exact Search Algorithm"):
    """
    返回DAG的邻接矩阵
    """
    # """
    # Search for the optimal graph using Dynamic Programming (DP 1) or A* search 2. 
    # Returns:
    #     dag_est: numpy.ndarray, shape=(d, d). Estimated DAG.
    #     search_stats: dict. Some statistics related to the seach procedure.
    # """
    search_method: Optional[str] = Field(
        default='astar', title="搜索方法", # 'Search Method',
        description="Method of exact search ([‘astar’, ‘dp’]). Default is astar.",
        options=getOpts(SearchMethods)
    )
    use_path_extension: Optional[bool] = Field(
        default=True, title="使用最优路径扩展", # 'Use optimal path extension',
        description="Whether to use optimal path extension for order graph. Note that this trick will not affect the correctness of search procedure. Default is True.")
    use_k_cycle_heuristic: Optional[bool] = Field(
        default=False, title="A*使用k-cycle冲突启发算法", # 'Use k-cycle conflict heuristic for A*',
        description="Whether to use k-cycle conflict heuristic for astar. Default is False.")
    k: Optional[int] = Field(
        default=3, title="k-cycle启发中的k值", # 'k-cycle conflict heuristic',
        description="Parameter used by k-cycle conflict heuristic for astar. Default is 3.")
    maxP: Optional[int] = Field(
        default=0, title="最大的依赖组大小", # 'Max Number of Parents',
        description="The maximum number of parents a node can have. If used, this means using the k-learn procedure. Can drastically speed up algorithms. If None, no max on parents. Default is 0, which means no restriction.",
        ge=0, le=8, multiple_of=1,
    )

class ExactSearch(AlgoInterface):
    ParamType = ESParams
    def __init__(self, dataSource: List[IRow], fields: List[IFieldMeta], params: Optional[ParamType] = ParamType()):
        super(ExactSearch, self).__init__(dataSource=dataSource, fields=fields, params=params)
        
    def constructGraph(self, bgKnowledges: Optional[List[common.BgKnowledge]] = [], f_ind: Dict[str, int] = {}, focusedFields: List[str] = []):
        d = len(focusedFields)
        if bgKnowledges is None or len(bgKnowledges) == 0:
            return None, None
        super_graph, include_graph = np.ones((d, d), dtype=np.bool8), np.zeros((d, d), dtype=np.bool8)
        for i in range(d):
            super_graph[i, i] = 0
        for bg in bgKnowledges:
            if bg.type < common.bgKnowledge_threshold[0]:
                super_graph[f_ind[bg.src], f_ind[bg.tar]] = False
            elif bg.type > common.bgKnowledge_threshold[1]:
                include_graph[f_ind[bg.src], f_ind[bg.tar]] = True
        return super_graph, include_graph
    def calc(self, params: Optional[ParamType] = ParamType(), focusedFields: List[str] = [], bgKnowledges: Optional[List[common.BgKnowledge]] = [], **kwargs):
        array = self.selectArray(focusedFields=focusedFields, params=params)
        # common.checkLinearCorr(array)
        f_ind = {f: i for i, f in enumerate(focusedFields)}
        super_graph, include_graph = self.constructGraph(bgKnowledges=bgKnowledges, f_ind=f_ind, focusedFields=focusedFields)
        self.dag_est, self.search_stats = bic_exact_search(
            array,
            super_graph=super_graph,
            include_graph=include_graph,
            search_method=params.search_method,
            use_path_extension=params.use_path_extension,
            use_k_cycle_heuristic=params.use_k_cycle_heuristic,
            k=params.k,
            verbose=self.__class__.verbose,
            max_parents=params.maxP if params.maxP else None,
        )
        self.pag = np.zeros_like(self.dag_est)
        n = self.dag_est.shape[0]
        for i in range(n):
            for j in range(n):
                if self.dag_est[i, j]:
                    self.pag[i, j] = -1
                    self.pag[j, i] = 1
    
        l = self.dag_est.tolist()
        pag = self.pag.tolist()
        return {
            'data': l,
            'matrix': pag,
            'fields': self.safeFieldMeta(self.focusedFields),
            'stats': self.search_stats
        }