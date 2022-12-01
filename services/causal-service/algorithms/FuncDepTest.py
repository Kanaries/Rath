from . import common
from causallearn.search.Granger.Granger import Granger
from causallearn.search.FCMBased.ANM.ANM import ANM
from typing import List, Optional, Dict, Set
from pydantic import Field

import math
class FuncDepTestParams(common.OptionalParams, title="FuncDepTest Algorithm"):
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
        default='gsq', title="独立性检验", #"Independence Test",
        description="The independence test to use for causal discovery",
        options=common.getOpts(common.IDepTestItems),
    )
    alpha: Optional[float] = Field(
        default=-12, title="log10(显著性阈值)", # "Alpha",
        description="desired significance level (float) in (0, 1). Default: log10(0.005).",
        ge=-16, lt=0.0
    )
    orient: Optional[float] = Field(
        default='ANM', title="方向判断算法",
        options=common.getOpts({'ANM': "ANM"})
    )
    o_alpha: Optional[float] = Field(
        default=math.log10(1000.0), title="log_10(方向判断阈值)",
        description="对不同算法有不同阈值",
        gt=0.0, le=5
    )

class FuncDepTest(common.AlgoInterface):
    ParamType = FuncDepTestParams
    def __init__(self, dataSource: List[common.IRow], fields: List[common.IFieldMeta], params: Optional[ParamType] = ParamType(), **kwargs):
        print("FuncDepTest", fields, params)
        super(FuncDepTest, self).__init__(dataSource=dataSource, fields=fields, params=params)
        
    def calc(self, params: Optional[ParamType] = ParamType(), focusedFields: List[str] = [], bgKnowledgesPag: Optional[List[common.BgKnowledgePag]] = [], **kwargs):
        array = self.selectArray(focusedFields=focusedFields, params=params)
        d = len(focusedFields)
        import itertools, numpy as np
        res = np.zeros((d, d))
        o_test = None
        anm = ANM()
        G = Granger()
        if params.orient == 'ANM':
            o_test = lambda x, y: anm.cause_or_effect(x, y)
        # coef = np.corrcoef(array, rowvar=False)
        from causallearn.utils.cit import CIT
        # cit = CIT(array, 'fisherz')
        cit = CIT(array, params.indep_test)
        coeff_p = np.zeros((d, d))
        for i in range(d):
            for j in range(d):
                if i != j: coeff_p[i, j] = coeff_p[j, i] = cit(i, j, [])
        print(coeff_p)
        linear_threshold = 1e-18
        threshold = 10 ** params.o_alpha
        max_samples = 128
        array = array[np.random.choice(range(array.shape[0]), min(array.shape[0], max_samples), replace=False).tolist(),:]
        for i in range(d):
            for j in range(i):
                if coeff_p[i, j] < 10 ** params.alpha:
                    a, b = o_test(array[:, i:i+1], array[:, j:j+1])
                    print(f"indep: {i}, {j}, {coeff_p[i, j]}")
                    print("Orient model p:", a, b)
                    if a * threshold < b:
                        res[i, j], res[j, i] = -1, 1
                    elif a > b * threshold: 
                        res[i, j], res[j, i] = 1, -1
                    # else: res[i, j], res[j, i] = -1, -1
                # elif coeff_p[i, j] <= linear_threshold: # linear res[i, j], res[j, i] = 1, 1
                    
        # for i in range(d):
        #     for j in range(i):
        #         print(i, j)
        #         res[i, j], res[j, i] = anm.cause_or_effect(array[:, i:i+1], array[:, j:j+1])
        return {
            'data': res.tolist(),
            'matrix': res.tolist(),
            'indep': coeff_p.tolist(),
            'fields': self.safeFieldMeta(self.focusedFields),
        }