import os, sys, json, time, argparse
import numpy as np, pandas as pd
from typing import Dict, List, Tuple, Optional, Union, Literal, Generic, TypeVar, Any
from enum import Enum
import typing as tp
import traceback
from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field, Extra

import algorithms as alg
from .. import interface as I
from .. import common as c
from .. import session


class XLearner(c.AlgInterface):
    def __init__(self, sessionId: str, req: I.DiscoverReq):
        self.runXlearner(sessionId, req)

    def runXlearner(self, sessionId: str, req: I.DiscoverReq):
        algoName, tableId, fields, focusedFields, bgKnowledgesPag, funcDeps, params = \
            req.algoName, req.tableId, req.fields, req.focusedFields, req.bgKnowledgesPag, req.funcDeps, req.params

        data, meta = session.readTable(sessionId, tableId)

        d = {f['fid']: f for f in fields}
        fields = [d[ff] for ff in focusedFields]

        from algorithms.causallearn.XLearner import XLearnerParams, XLearner as XLearnerAlgo
        self.algo = XLearnerAlgo(data, fields, XLearnerParams())
        self.algo.calc(XLearnerParams(), focusedFields, bgKnowledgesPag)

        taskId = ...

        return taskId
