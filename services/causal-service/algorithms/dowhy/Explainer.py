from algorithms import common
from typing import List, Optional, Dict, Set, Union
from pydantic import Field
import dowhy

import math
EstimateEffectItems = {
    'backdoor.linear_regression': 'Linear regression',
    'backdoor.distance_matching': 'Distance matching',
    'backdoor.propensity_score_stratification': 'Propensity Score Stratification',
    'backdoor.propensity_score_matching': 'Propensity Score Matching',
    'backdoor.propensity_score_weighting': 'Propensity Score Weighting',
    'iv.instrumental_variable': 'Instrumental Variable',
    'iv.regression_discontinuity': 'Regression Discontinuity'
}
class ExplainerParams(common.OptionalParams, title="Explainer Algorithm"):
    """
    """
    target: Optional[Union[int, str]] = Field(
        default=None,
        options=[{'key': '$fields', 'title': ''}],
        title="Outcome (target) field",
        description="Outcome variable to explain",
    )
    treatment: List[Union[int, str]] = Field(
        default=[],
        options=[{'key': '$fields', 'title': ''}],
        title="Treatments (interventions)",
        description="Intervenable variables",
    )
    estimate_effect_method: Optional[str] = Field(
        default=None,
        options=common.getOpts(EstimateEffectItems)
    )

import json

def _pag_edges_from_func_deps(funcDeps: Optional[List[common.IFunctionalDep]]) -> List[common.BgKnowledgePag]:
    edges: List[common.BgKnowledgePag] = []
    for dep in funcDeps or []:
        for param in dep.params:
            edges.append(common.BgKnowledgePag(src=param.fid, tar=dep.fid, src_type=-1, tar_type=1))
    return edges

class Explainer(common.AlgoInterface):
    ParamType = ExplainerParams
    def __init__(self, dataSource: List[common.IRow], fields: List[common.IFieldMeta], params: Optional[ParamType] = None):
        super(Explainer, self).__init__(dataSource=dataSource, fields=fields, params=params or self.ParamType())

    def calc(self, params: Optional[ParamType] = None, focusedFields: List[str] = [], bgKnowledgesPag: Optional[List[common.BgKnowledgePag]] = [], funcDeps: Optional[List[common.IFunctionalDep]] = [], **kwargs):
        params = params or self.ParamType()
        # array = self.selectArray(focusedFields=focusedFields, params=params)

        def resolve_field_id(v: Optional[Union[int, str]]) -> Optional[str]:
            if v is None:
                return None
            if isinstance(v, int):
                return focusedFields[v] if 0 <= v < len(focusedFields) else None
            s = str(v)
            return s if len(s) > 0 else None

        target_fid = resolve_field_id(params.target)
        treatment_fids = [fid for fid in (resolve_field_id(t) for t in (params.treatment or [])) if fid is not None]

        if not target_fid:
            raise Exception('Explainer requires a non-empty outcome (target) field.')
        if len(treatment_fids) == 0:
            raise Exception('Explainer requires at least one treatment (intervention) field.')
        if not params.estimate_effect_method:
            raise Exception('Explainer requires an estimate_effect_method.')

        # Keep node order stable (focusedFields first, then any missing treatment/target fields).
        model_fields: List[str] = []
        for fid in [*focusedFields, *treatment_fids, target_fid]:
            if fid not in model_fields:
                model_fields.append(fid)

        self.data = self.dataSource[model_fields].copy()
        print(self.data, model_fields, bgKnowledgesPag)

        g_gml = "graph[directed 1"
        for fid in model_fields:
            g_gml += f"node[id \"{fid}\" label \"{fid}\"]"
        pag_edges = [* (bgKnowledgesPag or []), *_pag_edges_from_func_deps(funcDeps)]
        for k in pag_edges:
            g_gml += f"edge[source \"{k.src}\" target \"{k.tar}\"]"
            # k.src_type, k.tar_type
        g_gml += "]"
        print(g_gml)
        import pandas as pd
        import numpy as np
        if params.estimate_effect_method == 'backdoor.distance_matching':
            import logging
            logger = logging.getLogger(__name__)
            for fid in treatment_fids:
                try:
                    if np.unique(self.data[fid].values).size == 2:
                        self.data = self.data.assign(**{fid: self.data[fid] != self.data[fid].values[0]})
                except (KeyError, TypeError, ValueError) as e:
                    logger.warning(
                        "Failed to binarize treatment column %s for distance matching: %s",
                        fid,
                        e,
                    )

        self.model = dowhy.CausalModel(
            data=self.data,
            treatment=treatment_fids,
            outcome=[target_fid],
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
            'fields': self.safeFieldMeta([f for f in self.fields if f.fid in model_fields]),
            'res': {k: str(v) for k, v in res.items()},
            # 'data': res.tolist(),
            # 'matrix': res.tolist(),
            # 'indep': coeff_p.tolist(),
        }