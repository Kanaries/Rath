import os, sys, json, time, argparse
import numpy as np, pandas as pd
from typing import Dict, List, Tuple, Optional, Union, Literal
import traceback
from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field

from algorithms.common import getOpts, IDepTestItems, ICatEncodeType, IQuantEncodeType, UCPriorityItems, UCRuleItems, AlgoInterface, IRow, IDataSource, IFieldMeta, IFields
from algorithms.common import transDataSource, OptionalParams
import algorithms.common as common

import causallearn.search.ConstraintBased.FCI as FCI
from causallearn.search.ConstraintBased.FCI import fci
from causallearn.utils.PCUtils import SkeletonDiscovery
from causallearn.utils.PCUtils.BackgroundKnowledge import BackgroundKnowledge
from causallearn.utils.PCUtils.BackgroundKnowledgeOrientUtils import orient_by_background_knowledge

def xlearn(dataset: np.ndarray, independence_test_method: str=FCI.fisherz, alpha: float = 0.05, depth: int = -1,
        max_path_length: int = -1, verbose: bool = False, background_knowledge: BackgroundKnowledge | None = None,
        functional_dependencies: List[common.IFunctionalDep]=[], f_ind={}, fields=[], **kwargs) -> Tuple[FCI.Graph, List[FCI.Edge]]:
    """
    Parameters
    ----------
    dataset: data set (numpy ndarray), shape (n_samples, n_features). The input data, where n_samples is the number of
            samples and n_features is the number of features.
    independence_test_method: str, name of the function of the independence test being used
            [fisherz, chisq, gsq, kci]
           - fisherz: Fisher's Z conditional independence test
           - chisq: Chi-squared conditional independence test
           - gsq: G-squared conditional independence test
           - kci: Kernel-based conditional independence test
    alpha: float, desired significance level of independence tests (p_value) in (0,1)
    depth: The depth for the fast adjacency search, or -1 if unlimited
    max_path_length: the maximum length of any discriminating path, or -1 if unlimited.
    verbose: True is verbose output should be printed or logged
    background_knowledge: background knowledge
    functional_dependencies: functional dependencies

    Returns
    -------
    graph : a CausalGraph object, where graph.graph[j,i]=1 and graph.graph[i,j]=-1 indicates  i --> j ,
                    graph.graph[i,j] = graph.graph[j,i] = -1 indicates i --- j,
                    graph.graph[i,j] = graph.graph[j,i] = 1 indicates i <-> j,
                    graph.graph[j,i]=1 and graph.graph[i,j]=2 indicates  i o-> j.
    edges : list
        Contains graph's edges properties.
        If edge.properties have the Property 'dd', then there is no latent confounder. Otherwise,
            there might be latent confounders.
        If edge.properties have the Property nl, then it is definitely direct. Otherwise,
            it is possibly direct.
    """

    if dataset.shape[0] < dataset.shape[1]:
        FCI.warnings.warn("The number of features is much larger than the sample size!")

    independence_test_method = FCI.CIT(dataset, method=independence_test_method, **kwargs)

    ## ------- check parameters ------------
    if (depth is None) or type(depth) != int:
        raise TypeError("'depth' must be 'int' type!")
    if (background_knowledge is not None) and type(background_knowledge) != BackgroundKnowledge:
        raise TypeError("'background_knowledge' must be 'BackgroundKnowledge' type!")
    if type(max_path_length) != int:
        raise TypeError("'max_path_length' must be 'int' type!")
    ## ------- end check parameters ------------
    
    from collections import deque
    def toposort(adj) -> List[int]:
        Q = deque()
        res = []
        cnt = [0] * len(adj)
        for i in range(len(adj)):
            for j in adj[i]: cnt[j] += 1
        for i in range(len(adj)):
            if cnt[i] == 0: Q.append(i)
        while len(Q) > 0:
            u = Q.popleft()
            res.append(u)
            for j in adj[u]: 
                cnt[j] -= 1
                if cnt[j] == 0: res.append(j)
        return res
    FDNodes: List[FCI.Node] = []
    NodeId: Dict[str, int] = {}
    attr_id = []
    cur_id = 0
    adj = []
    anc = []
    S = []
    G_fd = set()
    # for (u, v) in background_knowledge.required_rules_specs:
    #     src, dest = NodeId.get(u.get_name(), None), NodeId.get(v.get_name(), None)
    #     if src is None:
    #         src = NodeId[u.get_name()] = cur_id
    #         FDNodes.append(u)
    #         G_fd.add(u.get_attribute('id'))
    #         adj.append(set())
    #         anc.append(set())
    #         attr_id.append(u.get_attribute('id'))
    #         cur_id += 1
    #     if dest is None:
    #         dest = NodeId[v.get_name()] = cur_id
    #         FDNodes.append(v)
    #         G_fd.add(v.get_attribute('id'))
    #         adj.append(set())
    #         anc.append(set())
    #         attr_id.append(v.get_attribute('id'))
    #         cur_id += 1
    #     adj[src].add(dest)
    #     anc[dest].add(src)
    """
    NodeId: Dict[int, int] 原始图中对应点的局域编号
    FDNode: List[int]: 在Gfd中的causallearn格式的graphnodes，全局编号
    attr_id: Gfd中每个点在原始图中对应的点编号
    adj, anc: Gfd的邻接表
    G_fd: Gfd中的点集，原图编号
    """
    for dep in functional_dependencies:
        if len(dep.params) == 1:
            param, f = dep.params[0].fid, dep.fid
            u, v = f_ind[dep.params[0].fid], f_ind[dep.fid]
            src, dest = NodeId.get(u, None), NodeId.get(v, None)
            if src is None:
                src = NodeId[u] = cur_id
                node = FCI.GraphNode(f"X{u+1}")
                node.add_attribute('id', u)
                G_fd.add(u), adj.append(set()), anc.append(set()), FDNodes.append(node)
                attr_id.append(u)
                cur_id += 1
            if dest is None:
                dest = NodeId[v] = cur_id
                node = FCI.GraphNode(f"X{v+1}")
                node.add_attribute('id', v)
                G_fd.add(v), adj.append(set()), anc.append(set()), FDNodes.append(node)
                attr_id.append(v)
                cur_id += 1
            adj[src].add(dest)
            anc[dest].add(src)
        else:
            # TODO: depends on more than one params: should be treated the same as bgKnowledge
            pass
    topo = toposort(adj)
    
    fake_knowledge = BackgroundKnowledge()
    skeleton_knowledge = set()
    for t in topo[::-1]:
        mxvcnt, y = 0, -1
        for a in anc[t]:
            print("a = ", a, attr_id[a])
            vcnt = np.unique(dataset[:, attr_id[a]]).size
            if vcnt > mxvcnt:
                y = a
                mxvcnt = vcnt
        if y == -1: continue
        # S.append((attr_id[t], attr_id[y]))
        # fake_knowledge.add_required_by_node(FDNodes[t], FDNodes[y])
        fake_knowledge.add_required_by_node(FDNodes[y], FDNodes[t])
        skeleton_knowledge.add((attr_id[y], attr_id[t]))
        # remove X and connected edges from G_FD
        G_fd.remove(attr_id[t])
        for a in anc[t]:
            adj[a].remove(t)
    GfdNodes = []
    for i, v in enumerate(G_fd):
        node = FCI.GraphNode(f"X{v + 1}")
        node.add_attribute("id", v)
        GfdNodes.append(node)
    FDgraph, FD_sep_sets = FCI.fas(dataset, GfdNodes, independence_test_method=independence_test_method, alpha=alpha,
                          knowledge=None, depth=depth, verbose=verbose)
    print("FDGraph:", FDgraph, FD_sep_sets)
    
    # S = S join fas(dataset, GV)
    nodes = []
    for i in range(dataset.shape[1]):
        node = FCI.GraphNode(f"X{i + 1}")
        node.add_attribute("id", i)
        nodes.append(node)
        
    for i in range(FDgraph.graph.shape[0]):
        for j in range(i):
            if FDgraph.graph[i, j] == -1:
                x, y = attr_id[i], attr_id[j]
                skeleton_knowledge.add((x, y))
            # if FDgraph.graph[i, j] == -1:
            #     fake_knowledge.add_required_by_node(node[x], node[y])
            # if FDgraph.graph[j, i] == -1:
            #     fake_knowledge.add_required_by_node(node[y], node[x])
    
    print("fake_knowledge =", fake_knowledge)
    print(skeleton_knowledge)
    # for k in fake_knowledge.required_rules_specs:
    #     print(k[0].get_all_attributes(), k[1].get_all_attributes())
    
    for funcDep in functional_dependencies:
        for p in funcDep.params:
            background_knowledge.add_required_by_node(nodes[f_ind[p.fid]], nodes[f_ind[funcDep.fid]])

    # FAS (“Fast Adjacency Search”) is the adjacency search of the PC algorithm, used as a first step for the FCI algorithm.
    graph, sep_sets = FCI.fas(dataset, nodes, independence_test_method=independence_test_method, alpha=alpha,
                          knowledge=background_knowledge, depth=depth, verbose=verbose)
    for u, v in skeleton_knowledge:
        print(u, v)
        graph.add_edge(FCI.Edge(nodes[u], nodes[v], FCI.Endpoint.TAIL, FCI.Endpoint.TAIL))
        # graph[u, v] = graph[v, u] = -1
    
    print("global fas graph =", graph)
    print({u: s for u, s in sep_sets.items() if len(s)})
    # return graph, sep_sets
    # forbid_knowledge = BackgroundKnowledge()
    # for (u, v) in background_knowledge.forbidden_rules_specs:
    #     forbid_knowledge.add_forbidden_by_node(u, v)
    # forbid_knowledge.tier_map = background_knowledge.tier_map
    # forbid_knowledge.tier_value_map = background_knowledge.tier_value_map
    # background_knowledge = forbid_knowledge
    
    # reorient all edges with CIRCLE Endpoint
    ori_edges = graph.get_graph_edges()
    for ori_edge in ori_edges:
        graph.remove_edge(ori_edge)
        ori_edge.set_endpoint1(FCI.Endpoint.CIRCLE)
        ori_edge.set_endpoint2(FCI.Endpoint.CIRCLE)
        graph.add_edge(ori_edge)

    sp = FCI.SepsetsPossibleDsep(dataset, graph, independence_test_method, alpha, background_knowledge, depth,
                             max_path_length, verbose)

    FCI.rule0(graph, nodes, sep_sets, background_knowledge, verbose)

    waiting_to_deleted_edges = []

    for edge in graph.get_graph_edges():
        node_x = edge.get_node1()
        node_y = edge.get_node2()

        sep_set = sp.get_sep_set(node_x, node_y)

        if sep_set is not None:
            waiting_to_deleted_edges.append((node_x, node_y, sep_set))

    for waiting_to_deleted_edge in waiting_to_deleted_edges:
        dedge_node_x, dedge_node_y, dedge_sep_set = waiting_to_deleted_edge
        graph.remove_edge(graph.get_edge(dedge_node_x, dedge_node_y))
        sep_sets[(graph.node_map[dedge_node_x], graph.node_map[dedge_node_y])] = dedge_sep_set

        if verbose:
            message = "Possible DSEP Removed " + dedge_node_x.get_name() + " --- " + dedge_node_y.get_name() + " sepset = ["
            for ss in dedge_sep_set:
                message += graph.nodes[ss].get_name() + " "
            message += "]"
            print(message)

    FCI.reorientAllWith(graph, FCI.Endpoint.CIRCLE)
    FCI.rule0(graph, nodes, sep_sets, background_knowledge, verbose)

    change_flag = True
    first_time = True

    while change_flag:
        change_flag = False
        change_flag = FCI.rulesR1R2cycle(graph, background_knowledge, change_flag, verbose)
        change_flag = FCI.ruleR3(graph, sep_sets, background_knowledge, change_flag, verbose)

        if change_flag or (first_time and background_knowledge is not None and
                           len(background_knowledge.forbidden_rules_specs) > 0 and
                           len(background_knowledge.required_rules_specs) > 0 and
                           len(background_knowledge.tier_map.keys()) > 0):
            change_flag = FCI.ruleR4B(graph, max_path_length, dataset, independence_test_method, alpha, sep_sets,
                                  change_flag,
                                  background_knowledge, verbose)

            first_time = False

            if verbose:
                print("Epoch")

    graph.set_pag(True)

    edges = FCI.get_color_edges(graph)
    
    return graph, edges


class XLearnerParams(OptionalParams, title="XLearn"):
    """
    G:
    G.graph[j,i]=1 and G.graph[i,j]=-1 表示 i –> j;
    G.graph[i,j] = G.graph[j,i] = -1 表示 i — j;
    G.graph[i,j] = G.graph[j,i] = 1 表示 i <-> j;
    G.graph[j,i]=1 and G.graph[i,j]=2 表示 i o-> j.
    """
    # """
    # G: a CausalGraph object, where
    # G.graph[j,i]=1 and G.graph[i,j]=-1 indicates i –> j;
    # G.graph[i,j] = G.graph[j,i] = -1 indicates i — j;
    # G.graph[i,j] = G.graph[j,i] = 1 indicates i <-> j;
    # G.graph[j,i]=1 and G.graph[i,j]=2 indicates i o-> j.
    
    # edges: list. Contains graph’s edges properties. If edge.properties have the Property ‘dd’, then there is no latent confounder. Otherwise, there might be latent confounders. If edge.properties have the Property ‘nl’, then it is definitely direct. Otherwise, it is possibly direct.
    # """
    independence_test_method: Optional[str] = Field(
        default='gsq', title="独立性检验", #"Independence Test",
        description="Independence test method function.  Default: ‘fisherz’",
        options=getOpts(IDepTestItems),
    )
    alpha: Optional[float] = Field(
        default=0.05, title="显著性阈值", # "Alpha",
        description="Significance level of individual partial correlation tests. Default: 0.05.",
        gt=0.0, le=1.0
    )
    depth: Optional[int] = Field(
        default=-1, title="邻接表搜索深度", # 'Depth',
        description="The depth for the fast adjacency search, or -1 if unlimited. Default: -1.",
        ge=-1, le=8, multiple_of=1
    )
    max_path_length: Optional[int] = Field(
        default=-1, title="判别路径最大长度", # 'Max path length',
        description="The maximum length of any discriminating path, or -1 if unlimited. Default: -1",
        ge=-1, le=16, multiple_of=1
    )

class XLearner(AlgoInterface):
    ParamType = XLearnerParams
    dev_only = False
    def __init__(self, dataSource: List[IRow], fields: List[IFieldMeta], params: Optional[ParamType] = ParamType()):
        super(XLearner, self).__init__(dataSource, fields, params)
        
    def constructBgKnowledge(self, bgKnowledges: Optional[List[common.BgKnowledge]] = [], f_ind: Dict[str, int] = {}):
        node = self.G.get_nodes()
        self.bk = BackgroundKnowledge()
        for k in bgKnowledges:
            if k.type > common.bgKnowledge_threshold[1]:
                self.bk.add_required_by_node(node[f_ind[k.src]], node[f_ind[k.tar]])
            elif k.type < common.bgKnowledge_threshold[0]:
                self.bk.add_forbidden_by_node(node[f_ind[k.src]], node[f_ind[k.tar]])
        return self.bk
    
    def calc(self, params: Optional[ParamType] = ParamType(), focusedFields: List[str] = [], bgKnowledgesPag: Optional[List[common.BgKnowledgePag]] = [], funcDeps: common.IFunctionalDep = [],  **kwargs):
        array = self.selectArray(focusedFields=focusedFields, params=params)
        # common.checkLinearCorr(array)
        print(array, array.min(), array.max())
        self.G, self.edges = fci(array, **params.__dict__, background_knowledge=None, cache_path=self.__class__.cache_path, verbose=self.__class__.verbose)
        
        # if bgKnowledges and len(bgKnowledges) > 0:
        f_ind = {fid: i for i, fid in enumerate(focusedFields)}
        bk = self.constructBgKnowledgePag(bgKnowledgesPag=bgKnowledgesPag if bgKnowledgesPag else [], f_ind=f_ind)
            
        self.G, self.edges = xlearn(array, **params.__dict__, background_knowledge=bk, functional_dependencies=funcDeps, f_ind=f_ind, fields=focusedFields, cache_path=self.__class__.cache_path, verbose=self.__class__.verbose)
        l = self.G.graph.tolist()
        return {
            'data': l,
            'matrix': l,
            'fields': self.safeFieldMeta(self.focusedFields),
            'edges': self.edges
        }