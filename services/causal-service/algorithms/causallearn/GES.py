from typing import Dict, List, Tuple, Optional, Union, Literal
import traceback
from pydantic import Field

from algorithms.common import getOpts, IDepTestItems, ICatEncodeType, IQuantEncodeType, UCPriorityItems, UCRuleItems, AlgoInterface, IRow, IDataSource, IFieldMeta, IFields
from algorithms.common import transDataSource, OptionalParams, ScoreFunctions
import algorithms.common as common

from causallearn.search.ScoreBased.GES import ges

class GESParams(OptionalParams, title="GES Algorithm(暂不支持背景知识)"):
    """
    Record[‘G’]: 
        Record[‘G’].graph[j,i]=1 and Record[‘G’].graph[i,j]=-1 表示 i –> j;
        Record[‘G’].graph[i,j] = Record[‘G’].graph[j,i] = -1 表示 i — j.
    """
    # """
    # Record[‘G’]: learned causal graph, where
    #     Record[‘G’].graph[j,i]=1 and Record[‘G’].graph[i,j]=-1 indicate i –> j;
    #     Record[‘G’].graph[i,j] = Record[‘G’].graph[j,i] = -1 indicates i — j.
    # Record[‘update1’]: each update (Insert operator) in the forward step.
    # Record[‘update2’]: each update (Delete operator) in the backward step.
    # Record[‘G_step1’]: learned graph at each step in the forward step.
    # Record[‘G_step2’]: learned graph at each step in the backward step.
    # Record[‘score’]: the score of the learned graph.
    # """
    score_func: Optional[str] = Field(
        default='local_score_BIC', title='Score Function', description=" The score function you would like to use, including (see score_functions.). Default: ‘local_score_BIC’.",
        options=getOpts(ScoreFunctions))
    maxP: Optional[int] = Field(
        default=0, title='Max Number of Parents', description="Allowed maximum number of parents when searching the graph. Default: 0, which means not given",
        ge=0, le=32, multiple_of=1,
    )
    """
    parameters: Needed when using CV likelihood. Default: None.
        parameters[‘kfold’]: k-fold cross validation.
        parameters[‘lambda’]: regularization parameter.
        parameters[‘dlabel’]: for variables with multi-dimensions, indicate which dimensions belong to the i-th variable.  """

import json
class GES(AlgoInterface):
    ParamType = GESParams
    def __init__(self, dataSource: List[IRow], fields: List[IFieldMeta], params: Optional[ParamType] = ParamType()):
        super(GES, self).__init__(dataSource=dataSource, fields=fields, params=params)
        
    def calc(self, params: Optional[ParamType] = ParamType(), focusedFields: List[str] = [], bgKnowledgesPag: Optional[List[common.BgKnowledgePag]] = [], **kwargs):
        array = self.selectArray(focusedFields=focusedFields, params=params)
        common.checkLinearCorr(array)
        self.Record = ges(array, score_func=params.score_func, maxP=params.maxP if params.maxP else None)
    
        l = self.Record['G'].graph.tolist()
        return {
            'data': l,
            'matrix': l,
            'fields': self.safeFieldMeta(self.focusedFields),
            # 'Record': json.dumps(self.Record)
        }
            # 'Record': self.Record