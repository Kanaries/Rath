
import os, sys, json, time, argparse
import numpy as np, pandas as pd
from typing import Dict, List, Tuple, Optional, Union, Literal, Any
import traceback
from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field, Extra
import traceback
from causallearn.utils.PCUtils.BackgroundKnowledge import BackgroundKnowledge

IRow = Dict[str, object]
IDataSource = List[IRow]
IFields = List[str]

ICatEncodeType = {
    'topk-with-noise': "将低频值分组",
    'none': "无", # "No Encoding",
    'one-hot': "One-hot Encoding",
    'one-hot-with-noise': "将低频值分组后做one-hot",
    # 'binary': "Binary Encoding",
    'lex': "字典序", # "Lexicographic Ranking",
    'random': "随机编码",
}
ICatEncodeTypeDefault = 'topk-with-noise'

IQuantEncodeType = {
    'bin': "分箱", # "Binning",
    'none': "无", # "No Encoding",
    # 'id': "Any Index",
    'order': "排名", # "Ranking"
    # 'binned-order': "按排名分箱" # "count-awared binning"
}
IQuantEncodeTypeDefault = 'bin'
    
IDepTestItems = {
    'gsq': 'G检验', # ('g-square', 'G-squared conditional independence test.'),
    'chisq': '卡方条件独立性检验', # ('chi-square', 'Chi-squared conditional independence test.'),
    'fisherz': 'Fisher-Z变换', # ('fisher-z', 'Fisher’s Z conditional independence test.'),
    # 'kci': ('kernel-based conditional independence test', '(As a kernel method, its complexity is cubic in the sample size, so it might be slow if the same size is not small.)'),
    'mv_fisherz': '允许空值的Fisher-Z变换' # ('missing-value fisher-z', 'Missing-value Fisher’s Z'),
    # 'mc_fisherz': ('missing correction fisher-z', "Fisher-Z's test with test-wise deletion and missingness correction")
}
UCRuleItems = {
    0: "uc_superset",
    1: "maxP",
    2: "definiteMaxP"
}
UCPriorityItems = {
    -1: "whatever is default in uc_rule",
    0: "overwrite",
    1: "orient bi-directed",
    2: "prioritize existing colliders",
    3: "prioritize stronger colliders",
    4: "prioritize stronger* colliders"
}
ScoreFunctions = {
    'local_score_BIC': ('BIC score', "BIC score"),
    'local_score_BDeu': ('BDeu score', "BDeu score"),
    'local_score_CV_general': ('Cross validation general', "Generalized score with cross validation for data with single-dimensional variables"),
    'local_score_marginal_general': ('Marginal General',"Generalized score with marginal likelihood for data with single-dimensional variables"),
    'local_score_CV_multi': ('Cross validation multi-dimensional', "Generalized score with cross validation for data with multi-dimensional variables"),
    'local_score_marginal_multi': ('Marginal multi-dimensional', "Generalized score with marginal likelihood for data with multi-dimensional variables")
}
SearchMethods = {
    'astar': "A* search",
    'dp': "Dynamic Programing"
}
BandwidthMethods = {
    'mdbs': "edian distance between samples.",
    'scott': "cott’s Rule of Thumb.",
    'silverman': "Silverman’s Rule of Thumb.",
}

def getOpts(Items: Dict):
    return [
        {
            'key': key,
            'text': desc
        }
        if isinstance(desc, str) else {
            'key': key,
            'text': desc[0],
            'description': desc[1]
        } for (key, desc) in Items.items()
    ]


def checkLinearCorr(array: np.ndarray):
    print(array)
    for i in range(8):
        if np.linalg.matrix_rank(array) < array.shape[1]:
            U, s, VT = np.linalg.svd(array)
            print("================checkLinearCorr:{}".format(i))
            print(U, s, VT, sep='\n')
            # raise Exception("The input array is linear correlated, some fields should be unselected.\n[to be optimized]")
            # array *= (1 + np.random.randn(*array.shape)*1e-3)
            # array *= (1 + np.random.randn(*array.shape) * 1e-3)
            print("The input array is linear correlated, some fields should be unselected.\n[to be optimized]", file=sys.stderr)
            # if np.abs(s[-1] / s[0]) < 1e-4:
            #     print("CheckLinearCorr", U, s, VT)
            #     raise Exception("The input array is linear correlated, some fields should be unselected")
        else:
            break

class OptionalParams(BaseModel, extra=Extra.allow):
    """Optional Parameters"""
    catEncodeType: Optional[str] = Field(
        default=ICatEncodeTypeDefault, title="类别变量编码方式", #"Categorical Encoding",
        description="The encoding to use for categorical variables",
        options=getOpts(ICatEncodeType)
    )
    # keepOriginCat: Optional[bool] = Field(
    #     default=False, title="Keep Original Categorical Variables", description="Whether to keep the original categorical variables", allow_mutation=False
    # )
    quantEncodeType: Optional[str] = Field(
        default=IQuantEncodeTypeDefault, title="数值型变量编码方式", #"Quantitative Encoding",
        description="The encoding to use for quantitative variables",
        options=getOpts(IQuantEncodeType)
    )
    # keepOriginQuant: Optional[bool] = Field(
    #     default=False, title="Keep Original Quantitative Variables", description="Whether to keep the original quantitative variables", allow_mutation=False
    # )
    # verbose: bool = False, show_progress: bool = True, **kwargs: Any


class IFieldMeta(BaseModel):
    fid: str
    name: Optional[str]
    semanticType: str
    ''' 'quantitative' | 'nominal' | 'ordinal' | 'temporal' '''

def encodeCat(origin: pd.Series, fact: pd.Series, encodeType: str) -> pd.DataFrame:
    # if encodeType == 'binary': # encodeType.binary: 
    #     '''invalid'''
    #     df = None
    #     mxv = fact.max()
    #     for i in range(31):
    #         if (mxv >> i) == 0:
    #             break
    #         v = pd.Series((fact & (1 << i)) != 0, dtype=float, name=str(fact.name)+f"&(1<<{i})")
    #         v += np.random.randn(v.size)
    #         df = pd.concat([df, v], axis=1)
    #     return df
    if encodeType == 'lex': # encodeType.lex:
        # print('lex', origin.rank(method="min"), sep='\n')
        # return pd.DataFrame(data=pd.Series(origin.rank(method="min"), name=str(origin.name))+0.0)
        return pd.DataFrame(data=pd.Series(origin.rank(method="max"), name=str(origin.name))) # +1e-3*np.random.randn(origin.size))
    elif encodeType == 'one-hot': # encodeType.oneHot:
        if fact.max() >= 64:
            raise Exception("too many values for one-hot encoding")
        code = pd.get_dummies(origin)
        for v in code.columns:
            code[v].rename(origin.name + '.' + v)
        return code
    elif encodeType == 'one-hot-with-noise':
        cnt = origin.value_counts()
        k, threshold = 16, 5
        noise_type = 0  # 0: kth, 1: by threshold
        v_cnt = len(cnt)
        values = None
        if v_cnt <= k:
            code = pd.Series(range(v_cnt))
            values = pd.Series(cnt.index.values, index=code)
        else:
            code = pd.Series([*range(k-1), *([k-1] * (v_cnt + 1 - k))])
            values = pd.Series(cnt.index.values[:k], index=code[:k], copy=True)
            values[k-1] = '~'
        code_map = pd.DataFrame({'value': cnt.index, 'cnt': cnt.to_numpy(), 'code': code}).set_index('value')
        x = pd.Series(values.loc[code_map.loc[origin.values]['code'].values].values, name=origin.name)
        code = pd.get_dummies(x)
        for v in code.columns:
            code = code.assign(**{f"{x.name}.[{str(v)}]": code[v].values}).drop(columns=[v])
        return code
    elif encodeType == 'topk-with-noise':
        """
        topk-with-noise: merge categories with frequency less than 5 or frequency of the k-th most frequent value together.
        """
        cnt = origin.value_counts()
        k, threshold = 16, 5
        noise_type = 0  # 0: kth, 1: by threshold
        v_cnt = len(cnt)
        if noise_type == 0:
            if v_cnt <= k:
                code = pd.Series(range(v_cnt))
            else:
                code = pd.Series([*range(k-1), *([k-1] * (v_cnt + 1 - k))])
            # print("code", code)
            code_map = pd.DataFrame({'value': cnt.index, 'cnt': cnt.to_numpy(), 'code': code}).set_index('value')
            return pd.DataFrame({origin.name: code_map.loc[origin.values]['code'].values})
        else:
            raise Exception("not implemented")
    elif encodeType == 'random':
        raise Exception("not implemented")
    return pd.DataFrame(fact)

def encodeQuant(x: pd.Series, encodeType: str) -> pd.DataFrame:
    n, eps = 16, 1e-5
    if encodeType == 'bin': # encodeType.bin:
        width = x.max() - x.min()
        if width == 0: return pd.DataFrame(x)
        res = pd.Series( (x - x.min()) * (n - eps) * (1 / width), dtype=np.int32, name=x.name) * (width / (n - eps))
        return pd.DataFrame(res)
    elif encodeType == 'order': # encodeType.order:
        x = pd.Series(x.factorize(sort=True)[0], name=x.name)
        return x
    elif encodeType == 'binned-order':
        order = pd.Series(x.factorize(sort=True)[0])
        len = x.size
        raise Exception("not implemented")
    elif encodeType == 'cnt-bin':
        group, cut_bin = pd.qcut(x, q=n, retbins=True)
        return pd.Series(((cut_bin[:-1] + cut_bin[1:]) * .5)[group], name=x.name)
        
    return pd.DataFrame(x)

def trans(df: pd.DataFrame, fields: List[IFieldMeta], params: OptionalParams):
    params.keepOriginCat, params.keepOriginQuant = False, False
    fids = [f.fid for f in fields]
    res = pd.DataFrame(df.loc[:, fids])
    res_fields: List[IFieldMeta] = []
    for f in fields:
        # print(f, f.semanticType)
        if f.semanticType == 'nominal' or df[f.fid].dtype.kind in 'bcOSUV':
            if params.catEncodeType is not None:
                code, _ = df[f.fid].factorize()
                # res[f.fid] = code + np.random.randn(code.size) * 1e-3
                try:
                    newcode = encodeCat(df[f.fid], pd.Series(code, name=f.fid), params.catEncodeType)
                except Exception as e:
                    with sys.stderr:
                        print(f"encodeCat by {params.catEncodeType} failed:")
                        traceback.print_exception(e)
                # print("newcode-nominal", newcode)
                if params.keepOriginCat or newcode.size == 0:
                    res_fields.append(f)
                else:
                    res.drop(columns=[f.fid])
                # res = pd.concat([res, newcode], axis=1)
                res.loc[:, newcode.columns] = newcode
                for col in list(newcode.columns):
                    res_fields.append(IFieldMeta(fid=col, name=f.name+(col.replace(f.fid, '', 1)), semanticType='ordinal'))
                # print(df.shape, res.shape)
        elif f.semanticType == 'temporal':
            if df[f.fid].dtype in [np.dtype('O'), object, str, pd.CategoricalDtype]:
                code = (pd.to_datetime(df[f.fid]) - pd.Timestamp("1970-01-01")) // pd.Timedelta('1s')
                # res[f.fid] = code
                # res[f.fid] = code + np.random.randn(code.size) * 1e-3
                newcode = encodeCat(df[f.fid], pd.Series(code, name=f.fid), params.catEncodeType)
                # print("newcode-temporal", newcode)
                if params.keepOriginCat or newcode.size == 0:
                    res_fields.append(f)
                else:
                    res.drop(columns=[f.fid])
                for col in list(newcode.columns):
                    res_fields.append(IFieldMeta(fid=col, name=f.name+(col.replace(f.fid, '', 1)), semanticType='ordinal'))
                # res = pd.concat([res, newcode], axis=1)
                res.loc[:, newcode.columns] = newcode
            else:
                newcode = encodeQuant(df[f.fid], params.quantEncodeType)
                # print("newcode-other", newcode, df[f.fid], sep='\n')
                if params.keepOriginQuant or newcode.size == 0:
                    res_fields.append(f)
                else:
                    res.drop(columns=[f.fid])
                # res = pd.concat([res, newcode], axis=1)
                for col in list(newcode.columns):
                    res_fields.append(IFieldMeta(fid=col, name=f.name+(col.replace(f.fid, '', 1)), semanticType='ordinal'))
                res.loc[:, newcode.columns] = newcode
        elif f.semanticType in ['quantitative', 'ordinal']:
            newcode = encodeQuant(df[f.fid], params.quantEncodeType)
            # print("newcode-other", newcode, df[f.fid], sep='\n')
            if params.keepOriginQuant or newcode.size == 0:
                res_fields.append(f)
            else:
                res.drop(columns=f.fid)
            # print("newcode======", res, newcode, res_fields, f.fid, res[f.fid], sep='\n')
            # res = pd.concat([res, newcode], axis=1)
            res.loc[:, newcode.columns] = newcode
            for col in list(newcode.columns):
                res_fields.append(IFieldMeta(fid=col, name=f.name+(col.replace(f.fid, '', 1)), semanticType='ordinal'))
        else:
            res_fields.append(f)
    # print("res, ", res, res_fields)
    return res.loc[:, [f.fid for f in res_fields]], res_fields
    
def transDataSource(dataSource: List[IRow], fields: List[IFieldMeta], params: OptionalParams):
    df = pd.DataFrame(dataSource)
    df, fields = trans(df, fields, params)
    return df, fields

import algorithms
bgKnowledge_threshold = (1e-3-1, 1-1e-3)
class BgKnowledge(BaseModel):
    src: str = Field(title="Source Node")
    tar: str = Field(title="Destination Node")
    type: float = Field(default=0.0, title='Confidence Level', description="""
- For hard constraints:
    - -1 for not connected: src ---X--> tar;
    - 1 for must connect: src -------> tar;
- For soft constraints:
    - value in (-1.0, 1.0), indicating Confidence Level.""",
    ge=-1.0, le=1.0)

class BgKnowledgePag(BaseModel):
    src: str = Field(title="Source Node")
    tar: str = Field(title="Destination Node")
    src_type: int = Field(default=0, title='PAG endpoint of src', description=""" """,
    options=getOpts({-1:'', 0:'', 1:'', 2:''}))
    tar_type: int = Field(default=0, title='PAG endpoint of tar', description=""" """,
    options=getOpts({-1:'', 0:'', 1:'', 2:''}))

class IFunctionalDepParam(BaseModel):
    fid: str
    type: Optional[str] = Field(default='')

class IFunctionalDep(BaseModel):
    fid: str
    params: List[IFunctionalDepParam]
    func: Optional[str] = Field(default='generated', title='Functional Dependency Type', description="To be designed")
    extInfo: Optional[Any] = Field(default=None)

class CausalRequest(BaseModel, extra=Extra.allow):
    dataSource: List[IRow]
    fields: List[IFieldMeta]
    focusedFields: List[str] = Field(default=[], description="A subset of fields which we concerned about.")
    # bgKnowledges: Optional[List[BgKnowledge]] = Field(default=[], description="Known edges")
    bgKnowledgesPag: Optional[List[BgKnowledgePag]] = Field(default=[], description="Known edges (PAG)")
    funcDeps: Optional[List[IFunctionalDep]] = Field(default=[], description="")
    params: OptionalParams = Field(default={}, description="optional params", extra=Extra.allow)

class AlgoInterface:
    ParamType = OptionalParams
    dev_only = True
    cache_path = None # '/tmp/causal.json'
    verbose = False
    def __init__(self, dataSource: List[IRow], fields: List[IFieldMeta], 
                params: Optional[ParamType] = ParamType()):
        self.dataSource, self.origin_fields = pd.DataFrame(dataSource), fields
        self.fields = [*fields]
        # self.data, self.fields = transDataSource(dataSource, fields, params)
    
    def constructBgKnowledgePag(self, bgKnowledgesPag: Optional[List[BgKnowledgePag]] = [], f_ind: Dict[str, int] = {}):
        from causallearn.graph.GraphNode import GraphNode
        node = [GraphNode(f"X{i+1}") for i in range(len(self.fields))]
        self.bk = BackgroundKnowledge()
        for k in bgKnowledgesPag:
            if k.src_type == -1 and k.tar_type == 1:
                self.bk.add_required_by_node(node[f_ind[k.src]], node[f_ind[k.tar]])
            elif k.src_type == 1 and k.tar_type == -1:
                self.bk.add_required_by_node(node[f_ind[k.tar]], node[f_ind[k.src]])
            if k.src_type == 0:
                self.bk.add_forbidden_by_node(node[f_ind[k.src]], node[f_ind[k.tar]])
            if k.tar_type == 0:
                self.bk.add_forbidden_by_node(node[f_ind[k.tar]], node[f_ind[k.src]])
            # if k.type > common.bgKnowledge_threshold[1]:
            #     self.bk.add_required_by_node(node[f_ind[k.src]], node[f_ind[k.tar]])
            # elif k.type < common.bgKnowledge_threshold[0]:
            #     self.bk.add_forbidden_by_node(node[f_ind[k.src]], node[f_ind[k.tar]])
        return self.bk
        
    
    def transFocusedFields(self, focusedFields):
        res = []
        for ff in focusedFields:
            for f in self.fields:
                if (f.fid.startswith(ff + '.[') and  f.fid.endswith(']')) or f.fid == ff:
                    res.append(f.fid)
        return res
    
    def selectArray(self, focusedFields: List[str] = [], params: OptionalParams = OptionalParams()) -> np.ndarray:
        # print('\n\nselectArray', [{f.fid: f for f in self.fields}[ff] for ff in focusedFields])
        print("Fields: ", {f.fid: f for f in self.fields}.keys(), focusedFields)
        focusedFields = self.transFocusedFields(focusedFields)
        self.data, self.focusedFields = transDataSource(self.dataSource, [{f.fid: f for f in self.fields}[ff] for ff in focusedFields], params)
        # print('\n\n', data.dtypes)
        return self.data.to_numpy()

    def safeFieldMeta(self, fields: List[IFieldMeta]):
        def transMeta(fieldMeta: IFieldMeta):
            meta = IFieldMeta(**fieldMeta.__dict__)
            cut = meta.fid.find('&(1<<')
            if cut != -1:
                meta.fid = meta.fid[:cut]
            return meta
        return [transMeta(f) for f in fields]
    
    def calc(self, params: Optional[ParamType] = ParamType(),
             focusedFields: List[str] = [], bgKnowledges: Optional[List[BgKnowledge]] = [], **kwargs):
        pass
    
def getCausalRequest(Type):
    def __init__():
        params: Type.ParamType
    name = f'Request{Type.__name__}'
    globals()[name] = __build_class__(__init__, name, CausalRequest)
    return globals()[name]
    # class Request(BaseModel):
    #     dataSource: List[IRow]
    #     fields: List[IFieldMeta]
    #     params: Type.ParamType
    # return Request


class CausalAlgorithmData(BaseModel, extra=Extra.allow):
    orig_matrix: Optional[List[List[float]]] = Field(description="G")
    matrix: Optional[List[List[float]]] = Field(
        description='''
        matrix[i, j] = matrix[j, i] = 0: i and j are independent
        matrix[i, j] = 1: the edge mark of (i,j) on i is ARROW, i <--? j
        matrix[i, j] = -1: the edge mark of (i,j) on i is BLANK, i --? j
        matrix[i, j] = 2: the edge mark of (i,j) on i is CIRCLE, i o--? j
        https://kevinbinz.com/tag/cpdag/
        ''')
    fields: List[IFieldMeta]
    extra: Optional[Dict[str, object]]
class CausalAlgorithmResponse(BaseModel):
    success: bool
    data: Optional[CausalAlgorithmData] = Field(default=None)
    message: Optional[str] = Field(default=None)
    

def registerCausalRequest(app, algoName, algo, resolve, Response):
    @app.post(f'/causal/{algoName}', response_model=CausalAlgorithmResponse)
    async def causal(item: getCausalRequest(algo), response: Response):
        return resolve(algoName, item, response)

class FuncDep(BaseModel):
    fid: str
    dep: str
    score: float
class FunctionalDependencyResponse(BaseModel):
    funcDepList: List[FuncDep]
