from algorithms import common
from typing import List, Optional, Dict, Set
from pydantic import Field
import dowhy

import math
EstimateEffectItems = {
    'backdoor.linear_regression': '线性回归',
    'backdoor.distance_matching': '距离匹配',
    'backdoor.propensity_score_stratification': 'Propensity Score Stratification',
    'backdoor.propensity_score_matching': 'Propensity Score Matching',
    'backdoor.propensity_score_weighting': 'Propensity Score Weighting',
    'iv.instrumental_variable': 'Instrumental Variable',
    'iv.regression_discontinuity': 'Regression Discontinuity'
}
class ExplainerParams(common.OptionalParams, title="Explainer Algorithm"):
    """
    """
    target: Optional[int] = Field(options=[{'key': '$fields', 'title': ''}], title="目标度量值字段", description="关注的度量值")
    treatment: Optional[List[int]] = Field(default=[], options=[{'key': '$fields', 'title': ''}], title="可干预变量字段", description="可干预变量")
    estimate_effect_method: Optional[str] = Field(
        default=None,
        options=common.getOpts(EstimateEffectItems)
    )

import json
class Explainer(common.AlgoInterface):
    ParamType = ExplainerParams
    def __init__(self, dataSource: List[common.IRow], fields: List[common.IFieldMeta], params: Optional[ParamType] = ParamType()):
        super(Explainer, self).__init__(dataSource=dataSource, fields=fields, params=params)
        
    def calc(self, params: Optional[ParamType] = ParamType(), focusedFields: List[str] = [], bgKnowledgesPag: Optional[List[common.BgKnowledgePag]] = []):
        # array = self.selectArray(focusedFields=focusedFields, params=params)
        self.data = self.dataSource[focusedFields]
        print(self.data, focusedFields, bgKnowledgesPag)
        d = len(focusedFields)
        g_gml = "graph[directed 1"
        for f in focusedFields:
            g_gml += f"node[id \"{f}\" label \"{f}\"]"
        for k in bgKnowledgesPag:
            g_gml += f"edge[source \"{k.src}\" target \"{k.tar}\"]"
            # k.src_type, k.tar_type
        g_gml += "]"
        print(g_gml)
        import pandas as pd
        import numpy as np
        for f in [params.treatment]:
            if params.estimate_effect_method == 'backdoor.distance_matching' and np.unique(self.data[f].values).size == 2:
                self.data = self.data.assign(**{f: self.data[f] != self.data[f].values[0]})
        print(self.data[f])
        
        self.model = dowhy.CausalModel(
            data=self.data,
            treatment=[params.treatment],
            outcome=[params.target],
            graph=g_gml
        )
        self.model.view_model()
        print(self.model)
        
        res = {}
        res['identified_estimand'] = self.model.identify_effect(proceed_when_unidentifiable=True)
        print(res['identified_estimand'], params.estimate_effect_method)
        res['causal_estimate'] = self.model.estimate_effect(res['identified_estimand'], method_name=params.estimate_effect_method, test_significance=True)
        # res['refute'] = self.model.refute_estimate(res['identified_estimand'], estimate=res['causal_estimate'], method_name="random_common_cause", show_progress_bar=True)
        print("res=")
        for k, v in res.items():
            print(k, v)
        
        return {
            'data': [[]],
            'matrix': [[]],
            'fields': self.safeFieldMeta(self.focusedFields),
            'res': {k: str(v) for k, v in res.items()},
            # 'data': res.tolist(),
            # 'matrix': res.tolist(),
            # 'indep': coeff_p.tolist(),
        }