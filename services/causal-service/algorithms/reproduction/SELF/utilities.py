import copy
from typing import Dict, List, Tuple, Optional, Union, Literal
import numpy as np
import pandas as pd


def get_parents(graph: np.ndarray, node):
    """
    graph[i][j] == 1 means i <- j
    """
    # print(f"------------np.where(graph[:, node] == 1)\n {np.where(graph[:][node] == 1)}")
    # print(f"node: {node} \n {graph}")
    return np.where(graph[:, node] == 1)[0]
    # return np.where(graph[node] == 1)[0]


def compare_graph(graph1: np.ndarray, graph2: np.ndarray):
    # 找父节点改变的节点
    return np.where(graph1 != graph2)[1]
    # return np.where(graph1 != graph2)[0]


def dfsCircuit(G: np.ndarray, current):
    if vis[current]:
        return True
    vis[current] = 1
    for i in range(G.shape[0]):
        if G[current][i] == 1:
            if dfsCircuit(G, i):
                return False
    vis[current] = 0
    return False


def checkCircuit(G: np.ndarray, start):
    n = G.shape[0]
    global vis
    vis = np.zeros(n)
    if dfsCircuit(G, start):
        del vis
        return False
    del vis
    return True


def get_vicinity_G(graph: np.ndarray, rules: np.ndarray = None):
    GList: List[np.ndarray] = []
    nrow, ncol = graph.shape
    for i in range(nrow):
        for j in range(ncol):
            # AddDelReverse
            if i == j:
                continue
            if rules is not None and rules[j][i] != 0:
                print(f"from {i} to {j} is not allowed")
                continue
            G = copy.deepcopy(graph)
            if G[i][j] == 1:
                G[i][j] = 0  # Del
                GList.append(G.copy())
                G[i][j] = 0
                G[j][i] = 1  # Reverse
                if checkCircuit(G, i):
                    GList.append(G)
            else:
                if G[j][i] == 0:
                    G[i][j] = 1  # Add
                    if checkCircuit(G, j):
                        GList.append(G)
    return np.unique(GList, axis=0)
