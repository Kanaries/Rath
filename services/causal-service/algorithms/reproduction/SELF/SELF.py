import copy

from dataclasses import dataclass
from typing import Dict, List, Tuple, Optional, Union, Literal
import numpy as np
import pandas as pd

from sklearn.neighbors import KernelDensity
from sklearn.linear_model import LinearRegression
from scipy import stats
import xgboost
xgboost.set_config(verbosity=0)
from rpy2.robjects import r
import time

from .utilities import get_parents, get_vicinity_G, compare_graph

r('''
R_kde_func <- function(N, bw){
    f <- stats::approxfun(stats::density(N,bw=bw,from=min(N),to=max(N)))
    return(f(N))
}
''')
r('''
get_leaf_node <- function(model){
    dump=xgb.dump(model)
    d=length(grep(dump,pattern = "leaf"))
    return(d)
}
''')


def cal_score(data, graph, score_type, bw, booster, gamma, nrounds, use_py_package=False):
    NodeScore = np.zeros(data.shape[1])
    nodes = np.arange(data.shape[1])
    NodeScore = updateScore(data, graph, NodeScore, nodes, score_type, bw, booster, gamma, nrounds, use_py_package)
    return NodeScore


def updateScore(data, graph, NodeScore, nodes, score_type="bic", bw="nrd0",
                booster="gbtree", gamma=10, nrounds=20, use_py_package=False):
    bicterm = np.log(data.shape[0]) / data.shape[0] / 2
    for i in nodes:
        pa = get_parents(graph, i)
        is_cata = False
        if len(pa) == 0:
            N = data[:, i]
            # TODO: check if N is categorical
            if is_cata:
                values, counts = np.unique(N, return_counts=True)
                d = len(values) - 1
                eta = counts / np.sum(counts)
                if score_type == "log":
                    NodeScore[i] = np.sum(np.log(eta) * eta)
                elif score_type == "bic":
                    NodeScore[i] = np.sum(np.log(eta) * eta) - d * bicterm
                elif score_type == "aic":
                    NodeScore[i] = np.sum(np.log(eta) * eta) - d / data.shape[0]
            else:
                kde_value = r("R_kde_func")(N, bw)
                if score_type == "log":
                    NodeScore[i] = np.sum(np.log(kde_value)) / data.shape[0]
                elif score_type == "bic":
                    NodeScore[i] = np.sum(np.log(kde_value)) / data.shape[0]
                elif score_type == "aic":
                    NodeScore[i] = np.sum(np.log(kde_value)) / data.shape[0] - 1
        else:
            # len(pa) > 0
            x = data[:, pa]
            y = data[:, i]
            if is_cata:
                num_class = len(np.unique(y))
                model = xgboost.XGBRegressor(objective='multi:softmax', num_class=num_class, booster=booster,
                                             gamma=gamma, nrounds=nrounds)
            else:
                if booster == "lm":
                    model = LinearRegression(fit_intercept=True, normalize=True)
                    model.fit(x, y)
                else:
                    # fit_ts = time.time_ns()
                    if use_py_package:
                        model = xgboost.XGBRegressor(booster=booster, gamma=gamma, nrounds=nrounds)
                        model.fit(x, y)
                    else:
                        model = r("xgboost")(data=x, label=y, verbose=0, nrounds=nrounds, gamma=gamma, booster=booster)
                    # print(f"xgb time: {(time.time_ns() - fit_ts) / 1e6}ms")
            if booster == "lm":
                N = y - model.predict(x)
            else:
                if use_py_package:
                    N = y - model.predict(x)
                else:
                    N = y - r("stats::predict")(model, x)
            if is_cata:
                N -= 1
            if is_cata:
                # 求出d d=ri*si
                values, counts = np.unique(N, return_counts=True)
                d = len(values) - 1
                eta = counts / np.sum(counts)
                if score_type == "log":
                    NodeScore[i] = np.sum(np.log(eta) * eta)
                elif score_type == "bic":
                    NodeScore[i] = np.sum(np.log(eta) * eta) - d * bicterm
                elif score_type == "aic":
                    NodeScore[i] = np.sum(np.log(eta) * eta) - d / data.shape[0]
            else:
                if booster == "gbtree":
                    d = r("get_leaf_node")(model=model)
                    d = d + len(pa)
                else:
                    d = len(pa) + 1  # gblinear
                # kde = stats.kde.gaussian_kde(N, bw_method='silverman')
                kde_ts = time.time_ns()
                kde_value = r("R_kde_func")(N, bw)
                # print(f"kde time: {(time.time_ns() - kde_ts) / 1e6}ms")
                if score_type == "log":
                    NodeScore[i] = np.sum(np.log(kde_value)) / data.shape[0]
                elif score_type == "bic":
                    NodeScore[i] = np.sum(np.log(kde_value)) / data.shape[0] - d * bicterm
                elif score_type == "aic":
                    NodeScore[i] = np.sum(np.log(kde_value)) / data.shape[0] - bicterm  # ??
    return NodeScore


@dataclass
class Result:
    graph: np.ndarray
    nodeScore: List[float]
    score: float


class FastHillClimb:
    def __init__(self, Data, Graph: np.ndarray = None, bgKownledges: np.ndarray = None,
                 min_increase=0.01, score_type="bic",
                 bw="nrd0", booster="gbtree", gamma=10, max_iter: int = 30, use_py_package=False):
        assert (score_type in ["bic", "aic", "log"]), "score_type must be in ['bic', 'aic', 'log']"
        assert (booster in ["gbtree", "gblinear", "lm"]), "booster must be in ['gbtree', 'gblinear', 'lm']"
        if Graph is not None:
            assert (Data.shape[1] == Graph.shape[0] == Graph.shape[1]), "Data and Graph shape must be matched"

        self.Data: np.ndarray = Data
        self.Graph: np.ndarray = Graph if Graph is not None else np.zeros((Data.shape[1], Data.shape[1]))
        self.bgKownledges: np.ndarray = bgKownledges
        self.min_increase = min_increase
        self.score_type = score_type
        # kernel density estimate params
        self.bw = bw
        # xgboost params
        self.booster = booster
        self.gamma = gamma
        self.max_iter = max_iter
        self.use_py_package = use_py_package

    def fit(self):
        # init
        init_score = cal_score(self.Data, self.Graph, self.score_type, self.bw, self.booster,
                               self.gamma, self.max_iter, use_py_package=self.use_py_package)
        init_result = Result(
            graph=self.Graph,
            nodeScore=init_score,
            score=init_score.sum()
        )
        graph = copy.deepcopy(self.Graph)
        bestResult = copy.deepcopy(init_result)
        # print(f"init_node_score: {init_result.nodeScore}")
        # print("init_score: ", init_result.score)
        # print("init_graph: ", init_result.graph)
        while True:
            t_s = time.time_ns()
            vicinities = get_vicinity_G(graph, self.bgKownledges)
            # print(f"get_vicinity_G time: {(time.time_ns() - t_s) / 1e6}ms")
            t_s = time.time_ns()
            for G in vicinities:
                nodes = compare_graph(graph, G)
                nodeScore = updateScore(self.Data, G, init_result.nodeScore.copy(), nodes, self.score_type, self.bw,
                                               self.booster, self.gamma, self.max_iter, use_py_package=self.use_py_package)
                score = nodeScore.sum()
                # print(f"G: {G}, nodes: {nodes}, Resultscore: {result.score}, bestResult.score: {bestResult.score}")
                # print(f"G: {G}, Resultscore: {score}")
                if score > bestResult.score:
                    bestResult = Result(
                        graph=G,
                        nodeScore=nodeScore,
                        score=score
                    )
            # print(f"updateScore time: {(time.time_ns() - t_s) / 1e6}ms")
            # print("score: ", bestResult.score)
            # print("graph: \n", bestResult.graph)
            if np.abs(bestResult.score - init_result.score) < self.min_increase:
                break
            if (bestResult.graph == init_result.graph).all():
                break
            init_result = copy.deepcopy(bestResult)
            graph = copy.deepcopy(bestResult.graph)
        print("score: ", bestResult.score)
        print("graph: \n", bestResult.graph)
        return bestResult.graph
