import sys, os, math
import pandas as pd, numpy as np
from . import interface as IDoWhy
import typing as tp

import dowhy

class RathSession:
    def __init__(self, data: IDoWhy.IDataSource, fields: tp.List[IDoWhy.IFieldMeta]):
        self.dataSource = pd.DataFrame(data)
        self.fields = fields
    
    def __del__(self):
        pass

def satisfyFilter(df: pd.DataFrame, filter: IDoWhy.IFilter=None):
    if filter is None:
        return pd.Series(np.ones((df.shape[0],), dtype=bool))
    if filter.type == 'range':
        return ((df[filter.fid] > filter.range[0]) & (df[filter.fid] <= filter.range[1]))
    else:
        return df[filter.fid].isin(filter.values)
    
def satisfy(df: pd.DataFrame, subspace: IDoWhy.IRInsightExplainSubspace):
    res = pd.Series(np.ones((df.shape[0],), dtype=bool))
    for filter in subspace.predicates:
        res &= satisfyFilter(df, filter)
    if subspace.reverted:
        res ^= True
    return res

def inferDiff(s0, s1):
    if (s0 == s1).all():
        return s0
    join = s0 & s1
    if (join == s0).all(): return s0
    else: return s0 ^ s1
        

def compare(a: IDoWhy.IFilter, b: IDoWhy.IFilter):
    """@deprecated
    Not safe when IRInsightExplainSubspace.reverted is enabled, use filtered dataset instead"""
    if a is None and b is None: return True
    if a is None or b is None: return False
    if a.type != b.type: return False
    if a.type == 'range': return a.range == b.range
    else: return len(a.values) == len(b.values) and set(*a.values) == set(*b.values)

def constructPAG(fields, causal_model: IDoWhy.ICausalModel):
    g_gml = "graph[directed 1"
    for f in fields:
        g_gml += f"node[id \"{f.fid}\" label \"{f.fid}\"]"
    for e in causal_model.edges:
        if e.src_type == 1:
            e.src, e.tar = e.tar, e.src
            e.src_type, e.tar_type = e.tar_type, e.src_type
        if e.src_type == -1 and e.tar_type == 1:
            e.src, e.tar, e.src_type, e.tar_type
            g_gml += f"\nedge[source \"{e.src}\" target \"{e.tar}\"]"
        # k.src_type, k.tar_type
    g_gml += "]"
    print("gml=", g_gml)
    return g_gml

class ExplainDataSession(RathSession):
    def __init__(self, data: IDoWhy.IDataSource, fields: tp.List[IDoWhy.IFieldMeta]):
        super(ExplainDataSession, self).__init__(data, fields)
    
    def updateModel(self, dimensions: tp.List[str], measures: tp.List[IDoWhy.IRMeasureSpec], groups: IDoWhy.IRInsightSubspaceGroup):
        print("data:", self.dataSource)
        print("dim:", dimensions)
        print("meas:", measures[0].fid)
        import algorithms
        params = algorithms.common.OptionalParams(catEncodeType='topk-with-noise', quantEncodeType='none')
        self.data, self.fields = algorithms.common.trans(self.dataSource, self.fields, params)
        self.data = self.dataSource

        # current = {p.fid: p for p in groups.current.predicates}
        # other = {p.fid: p for p in groups.other.predicates}
        # flipped = groups.current.reverted != groups.other.reverted
        
        self.inCurrent, self.inOther = satisfy(self.dataSource, groups.current), satisfy(self.dataSource, groups.other)
        self.hasDiffGroups = (self.inCurrent != self.inOther).any()
        
        current, other = self.data[self.inCurrent], self.data[self.inOther]
        
        self.model = dowhy.CausalModel(
            data=self.data,
            # treatment=[d for d in dimensions if flipped or not compare(current.get(d, None), other.get(d, None))],
            treatment=[d for d in dimensions if (np.sort(current[d].unique(), 0).tolist() != np.sort(other[d].unique(), 0).tolist())] if self.hasDiffGroups else dimensions,
            outcome=[measures[0].fid],
            graph=self.g_gml,
            identify_vars=True
        )
        self.model.view_model()
    
    def identitifyEstimand(self):
        self.estimand = self.model.identify_effect(proceed_when_unidentifiable=True)
    
    def estimateEffect(self, groups: IDoWhy.IRInsightSubspaceGroup):
        methods = {
            'psm': 'backdoor.propensity_score_matching',
            'pss': 'backdoor.propensity_score_stratification',
            'psw': 'backdoor.propensity_score_weighting',
            'lr': 'backdoor.linear_regression',
            'glm': 'backdoor.generalized_linear_model',
            'iv': 'iv.instrumental_variable',
            'iv/rd': 'iv.regression_discontinuity'
        }
        tmp = lambda df: satisfy(df, groups.current)
        print("target_units=\n", self.dataSource[tmp(self.data)])
        satCurrent, satOther = satisfy(self.dataSource, groups.current), satisfy(self.dataSource, groups.other)
        method = 'lr'
        if methods[method].startswith('backdoor.propensity_score_'):
            for treat in self.model._treatment:
                filters = [f for f in groups.current.predicates if f.fid == treat]
                tmp = IDoWhy.IRInsightExplainSubspace(predicates=filters)
                self.model._data = self.model._data.assign(**{treat: satisfy(self.data, tmp) })
        self.estimate = self.model.estimate_effect(
            self.estimand,
            methods[method],
            # target_units=lambda df: inferDiff(satCurrent, satOther), # satisfy(self.dataSource, groups.current), satisfy(df, groups.other)),
            evaluate_effect_strength=True,
            )
        # TOBEDONE: param
        print(self.estimate)

def inferInfo(session: ExplainDataSession):
    self = session.estimate
    if self.target_estimand is None:
        return "Estimation failed! No relevant identified estimand available for this estimation method."
    s = ''
    s += "\n## Identified estimand\n{0}".format(self.target_estimand.__str__(only_target_estimand=True))
    s += "\n## Realized estimand\n{0}".format(self.realized_estimand_expr)
    if hasattr(self, "estimator"):
        s += "\nTarget units: {0}\n".format(self.estimator.target_units_tostr())
    s += "\n## Estimate\n"
    s += "Mean value: {0}\n".format(self.value)
    s += ""
    if hasattr(self, "cate_estimates"):
        s += "Effect estimates: {0}\n".format(self.cate_estimates)
    if hasattr(self, "estimator"):
        if self.estimator._significance_test:
            s += "p-value: {0}\n".format(self.estimator.signif_results_tostr(self.test_stat_significance()))
        if self.estimator._confidence_intervals:
            s += "{0}% confidence interval: {1}\n".format(100 * self.estimator.confidence_level,
                                                            self.get_confidence_intervals())
    if self.conditional_estimates is not None:
        s += "### Conditional Estimates\n"
        s += str(self.conditional_estimates)
    if self.effect_strength is not None:
        s += "\n## Effect Strength\n"
        s += "Change in outcome attributable to treatment: {}\n".format(self.effect_strength["fraction-effect"])
        # s += "Variance in outcome explained by treatment: {}\n".format(self.effect_strength["r-squared"])
    return s

import algorithms
def explainData(props: IDoWhy.IRInsightExplainProps) -> tp.List[IDoWhy.IRInsightExplainResult]:
    params = algorithms.common.OptionalParams(catEncodeType='topk-with-noise', quantEncodeType='none')
    dataSource, fields, causalModel, groups, view = props.data, props.fields, props.causalModel, props.groups, props.view
    dataSource = pd.DataFrame(dataSource)
    transData, transFields = algorithms.common.trans(dataSource, fields, params)
    # transData = dataSource
    current, other = groups.current, groups.other
    dimensions, measures = view.dimensions, view.measures
    
    print("transData =", transData)
    for dep in props.causalModel.funcDeps:
        pass
    f_ind = {f.fid: i for i, f in enumerate(fields)}
    adj = [[] for i in range(len(fields))]
    for e in props.causalModel.edges:
        u, v = f_ind[e.src], f_ind[e.tar]
        adj[u].append({'tar': v, 'src_type': e.src_type, 'tar_type': e.tar_type})
        adj[v].append({'tar': u, 'src_type': e.tar_type, 'tar_type': e.src_type})
    
    inCurrent, inOther = satisfy(dataSource, groups.current), satisfy(dataSource, groups.other)
    hasDiffGroups = (inCurrent != inOther).any()
    currentData, otherData = transData[inCurrent], transData[inOther]
    treatment = [d for d in dimensions if (np.sort(currentData[d].unique(), 0).tolist() != np.sort(otherData[d].unique(), 0).tolist())] if hasDiffGroups else dimensions
    graph = constructPAG(fields, causalModel)
    print('treat:', treatment)
    results = []
    
    def testModel(results, model):
        # model.view_model()
        estimand = model.identify_effect(proceed_when_unidentifiable=True)
        methods = {
            'psm': 'backdoor.propensity_score_matching',
            'pss': 'backdoor.propensity_score_stratification',
            'psw': 'backdoor.propensity_score_weighting',
            'lr': 'backdoor.linear_regression',
            'glm': 'backdoor.generalized_linear_model',
            'iv': 'iv.instrumental_variable',
            'iv/rd': 'iv.regression_discontinuity'
        }
        tmp = lambda df: satisfy(df, groups.current)
        satCurrent, satOther = satisfy(dataSource, groups.current), satisfy(dataSource, groups.other)
        method = 'lr'
        if methods[method].startswith('backdoor.propensity_score_'):
            for treat in model._treatment:
                filters = [f for f in groups.current.predicates if f.fid == treat]
                tmp = IDoWhy.IRInsightExplainSubspace(predicates=filters)
                model._data = model._data.assign(**{treat: satisfy(transData, tmp) })
        estimate = model.estimate_effect(
            estimand,
            methods[method],
            target_units=lambda df: inferDiff(satCurrent, satOther), # satisfy(self.dataSource, groups.current), satisfy(df, groups.other)),
            # evaluate_effect_strength=True,
            )
        results.append(IDoWhy.LinkInfo(
            src=f.fid,
            tar=measures[0].fid,
            src_type=2,
            tar_type=1,
            description=IDoWhy.LinkInfoDescription(key='', data={'estimate': str(estimate)}),
            responsibility=significance_value(estimate.value, var=1.)
        ))
        # TOBEDONE: more params
        if estimate.value > 0:
            print("f===========", f.fid)
            print("target_units=\n", dataSource[tmp(transData)])
            print('unobserved f = ', f, '\n', estimate)
    
    # General: use origin graph 
    # Fallback: without graph, any variable can be used as common_cause
    for f in fields:
        if f.fid not in dimensions and f.fid not in [f.fid for f in measures]:
            # common_causes = [f.fid]
            # effect_modifiers = [f.fid]
            effect_modifiers = [f.fid]
            # TODO: only if edges in causal graph: 
            model = dowhy.CausalModel(
                data=transData,
                # treatment=[d for d in dimensions if flipped or not compare(current.get(d, None), other.get(d, None))],
                common_causes=[f.fid],
                treatment=treatment,
                outcome=[measures[0].fid],
                # instruments=[], # Z, causes of treatment, no confounding for the effect of Z on outcome
                # effect_modifiers=effect_modifiers, # causes of outcome other than treatment
                # graph=graph,
                identify_vars=True
            )
            testModel(results, model)
    
    return results

def significance_value(x: float, var: float=1.):
    import scipy.stats as st
    """
        x (float): X - EX
        var (float): σ(X)
    """
    print("x = ", x)
    print("norm cdf =", st.norm.cdf(abs(x)))
    return 2 * st.norm.cdf(abs(x), scale=var) - 1

def ExplainData(props: IDoWhy.IRInsightExplainProps) -> tp.List[IDoWhy.IRInsightExplainResult]:
    session = ExplainDataSession(props.data, props.fields)
    session.g_gml = constructPAG(props.fields, props.causalModel)
    session.updateModel(props.view.dimensions, props.view.measures, props.groups)
    session.identitifyEstimand()
    session.estimateEffect(props.groups)
    results = []
    try:
        descrip_data = {
            'data': inferInfo(session),
            'target estimand': session.estimate.target_estimand.__str__(),
            'realized estimand': session.estimate.realized_estimand_expr,
            'target units': session.estimate.estimator.target_units_tostr() if hasattr(session.estimate, "estimator") else None,
            'mean value of estimation': session.estimate.value,
            'effect estimates': session.estimate.cate_estimates if hasattr(session.estimate, "cate_estimates") else None,
        }
        if hasattr(session.estimate, "estimator"):
            if session.estimate.estimator._significance_test:
                descrip_data['p-value'] = session.estimate.test_stat_significance()
                # session.estimate.estimator.signif_results_tostr(session.estimate.test_stat_significance())
            if session.estimate.estimator._confidence_intervals:
                descrip_data['confidence interval'], [session.estimate.estimator.confidence_level,
                                                                session.estimate.get_confidence_intervals()]
        if session.estimate.conditional_estimates is not None:
            descrip_data['conditional estimates'] = str(session.estimate.conditional_estimates)
        if session.estimate.effect_strength is not None:
            descrip_data['change in outcome attributable to treatment'] = session.estimate.effect_strength["fraction-effect"]
        print("descrip_data=", descrip_data)
        descrip_data['desc_by'] = 'ExplainData'
        results.append(IDoWhy.LinkInfo(
            src=props.view.dimensions[0], tar=props.view.measures[0].fid, src_type=-1, tar_type=1,
            description=IDoWhy.LinkInfoDescription(key='', data=descrip_data),
            responsibility=session.estimate.value
        ))
    except Exception as e:
        print(str(e), file=sys.stderr)
    
    results.extend(explainData(props))
    
    sum2 = 0.
    for res in results:
        sum2 += res.responsibility * res.responsibility
    vars = math.sqrt(sum2 / len(results))
    for res in results:
        res.responsibility = significance_value(res.responsibility, vars)
    
    print("results =", results)
    
    return IDoWhy.IRInsightExplainResult(
        causalEffects=results
    )
