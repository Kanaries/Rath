from typing import Dict, Any
import typing

from .common import AlgoInterface
from .causallearn.PC import PC
from .causallearn.FCI import FCI
from .causallearn.CD_NOD import CD_NOD
from .causallearn.GES import GES
from .causallearn.ExactSearch import ExactSearch
from .causallearn.GIN import GIN
from .causallearn.GRaSP import GRaSP
from .causallearn.CAM_UV import CAM_UV
from .causallearn.RCD import RCD
from .causallearn.XLearner import XLearner
from .dowhy.Explainer import Explainer

from .FuncDepTest import FuncDepTest

DICT: Dict[str, typing.Type[Any]] = {
    'FCI': FCI,
    'CD_NOD': CD_NOD,
    'GES': GES,
    'PC': PC,
    'ExactSearch': ExactSearch,
    'GIN': GIN,
    'GRaSP': GRaSP,
    'CAM_UV': CAM_UV,
    'RCD': RCD,
    'XLearner': XLearner,
    'FuncDepTest': FuncDepTest,
    'Explainer': Explainer
}
from .common import registerCausalRequest, CausalRequest