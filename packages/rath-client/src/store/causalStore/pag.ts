import type { IFieldMeta } from "../../interfaces";
import { IFunctionalDep, PagLink, PAG_NODE } from "../../pages/causal/config";
import { CausalModelAssertion, NodeAssert, EdgeAssert } from "./modelStore";


export const transformAssertionsToPag = (
    assertions: readonly CausalModelAssertion[], fields: readonly IFieldMeta[]
): PagLink[] => {
    return assertions.reduce<PagLink[]>((list, decl) => {
        if ('fid' in decl) {
            switch (decl.assertion) {
                case NodeAssert.FORBID_AS_CAUSE: {
                    return list.concat(fields.filter(f => f.fid !== decl.fid).map<PagLink>(f => ({
                        src: f.fid,
                        src_type: PAG_NODE.EMPTY,
                        tar: decl.fid,
                        tar_type: PAG_NODE.ARROW,
                    })));
                }
                case NodeAssert.FORBID_AS_EFFECT: {
                    return list.concat(fields.filter(f => f.fid !== decl.fid).map<PagLink>(f => ({
                        src: decl.fid,
                        src_type: PAG_NODE.EMPTY,
                        tar: f.fid,
                        tar_type: PAG_NODE.ARROW,
                    })));
                }
                default: {
                    return list;
                }
            }
        }
        const srcIdx = fields.findIndex((f) => f.fid === decl.sourceFid);
        const tarIdx = fields.findIndex((f) => f.fid === decl.targetFid);

        if (srcIdx !== -1 && tarIdx !== -1) {
            switch (decl.assertion) {
                case EdgeAssert.TO_BE_RELEVANT: {
                    list.push({
                        src: decl.sourceFid,
                        tar: decl.targetFid,
                        src_type: PAG_NODE.CIRCLE,
                        tar_type: PAG_NODE.CIRCLE,
                    });
                    break;
                }
                case EdgeAssert.TO_BE_NOT_RELEVANT: {
                    list.push({
                        src: decl.sourceFid,
                        tar: decl.targetFid,
                        src_type: PAG_NODE.EMPTY,
                        tar_type: PAG_NODE.EMPTY,
                    });
                    break;
                }
                case EdgeAssert.TO_EFFECT: {
                    list.push({
                        src: decl.sourceFid,
                        tar: decl.targetFid,
                        src_type: PAG_NODE.BLANK,
                        tar_type: PAG_NODE.ARROW,
                    });
                    break;
                }
                case EdgeAssert.TO_NOT_EFFECT: {
                    list.push({
                        src: decl.sourceFid,
                        tar: decl.targetFid,
                        src_type: PAG_NODE.EMPTY,
                        tar_type: PAG_NODE.ARROW,
                    });
                    break;
                }
                default: {
                    break;
                }
            }
        }

        return list;
    }, []);
};

export const transformFuncDepsToPag = (funcDeps: readonly IFunctionalDep[]): PagLink[] => {
    return funcDeps.reduce<PagLink[]>((list, funcDep) => {
        const { fid: tar } = funcDep;
        for (const { fid: src } of funcDep.params) {
            list.push({
                src,
                tar,
                src_type: PAG_NODE.BLANK,
                tar_type: PAG_NODE.ARROW,
            });
        }
        return list;
    }, []);
};
  
export const transformPagToAssertions = (pag: readonly PagLink[]): CausalModelAssertion[] => {
    return pag.reduce<CausalModelAssertion[]>((list, link) => {
        if (link.src_type === PAG_NODE.BLANK && link.tar_type === PAG_NODE.ARROW) {
            return list.concat([{
                sourceFid: link.src,
                targetFid: link.tar,
                assertion: EdgeAssert.TO_EFFECT,
            }]);
        } else if (link.tar_type === PAG_NODE.BLANK && link.src_type === PAG_NODE.ARROW) {
            return list.concat([{
                sourceFid: link.tar,
                targetFid: link.src,
                assertion: EdgeAssert.TO_EFFECT,
            }]);
        } else if (link.src_type === PAG_NODE.BLANK && link.tar_type === PAG_NODE.BLANK) {
            return list.concat([{
                sourceFid: link.src,
                targetFid: link.tar,
                assertion: EdgeAssert.TO_BE_RELEVANT,
            }]);
        } else if (link.src_type === PAG_NODE.ARROW && link.tar_type === PAG_NODE.ARROW) {
            return list.concat([{
                sourceFid: link.src,
                targetFid: link.tar,
                assertion: EdgeAssert.TO_BE_RELEVANT,
            }]);
        }
        return list;
    }, []);
};

export const resolveCausality = (causality: readonly (readonly PAG_NODE[])[], fields: readonly IFieldMeta[]): PagLink[] => {
    const links: PagLink[] = [];

    for (let i = 0; i < causality.length - 1; i += 1) {
        for (let j = i + 1; j < causality.length; j += 1) {
            const src = fields[i].fid;
            const tar = fields[j].fid;
            const src_type = causality[i][j];
            const tar_type = causality[j][i];
            if (src_type === PAG_NODE.BLANK && tar_type === PAG_NODE.ARROW) {
                // i ----> j
                links.push({
                    src,
                    tar,
                    src_type,
                    tar_type,
                });
            } else if (tar_type === PAG_NODE.BLANK && src_type === PAG_NODE.ARROW) {
                // j ----> i
                links.push({
                    src: tar,
                    tar: src,
                    src_type: tar_type,
                    tar_type: src_type,
                });
            } else if (src_type === PAG_NODE.BLANK && tar_type === PAG_NODE.BLANK) {
                // i ----- j
                links.push({
                    src,
                    tar,
                    src_type,
                    tar_type,
                });
            } else if (src_type === PAG_NODE.ARROW && tar_type === PAG_NODE.ARROW) {
                // i <---> j
                links.push({
                    src,
                    tar,
                    src_type,
                    tar_type,
                });
            } else if (src_type === PAG_NODE.CIRCLE && tar_type === PAG_NODE.ARROW) {
                // i o---> j
                links.push({
                    src,
                    tar,
                    src_type,
                    tar_type,
                });
            } else if (src_type === PAG_NODE.ARROW && tar_type === PAG_NODE.CIRCLE) {
                // j o---> i
                links.push({
                    src: tar,
                    tar: src,
                    src_type: tar_type,
                    tar_type: src_type,
                });
            } else if (tar_type === PAG_NODE.CIRCLE && src_type === PAG_NODE.CIRCLE) {
                // i o---o j
                links.push({
                    src,
                    tar,
                    src_type,
                    tar_type,
                });
            }
        }
    }

    return links;
};

export const mergePAGs = (pag1: readonly PagLink[], pag2: readonly PagLink[]): PagLink[] => {
    return pag2.reduce<PagLink[]>((links, link) => {
        const overloadIndex = links.findIndex(which => [which.src, which.tar].every(fid => [link.src, link.tar].some(node => node === fid)));
        if (overloadIndex === -1) {
            return links.concat([link]);
        }
        links.splice(overloadIndex, 1, link);
        return links;
    }, pag1.slice(0)).filter(link => ![link.src_type, link.tar_type].some(nodeType => nodeType === PAG_NODE.EMPTY));
};

export interface ICausalDiff {
    srcFid: string;
    tarFid: string;
    expected: Pick<PagLink, 'src_type' | 'tar_type'>;
    received: Pick<PagLink, 'src_type' | 'tar_type'>;
}

export const findUnmatchedCausalResults = (
    assertions: readonly PagLink[],
    causality: readonly PagLink[],
): Readonly<ICausalDiff>[] => {
    const diffs: ICausalDiff[] = [];

    for (const decl of assertions) {
        const link = causality.find(which => (
            (which.src === decl.src && which.tar === decl.tar) || (which.tar === decl.src && which.src === decl.tar)
        ));
        if ([decl.src_type, decl.tar_type].every(nodeType => nodeType === PAG_NODE.CIRCLE)) {
            // EdgeAssert.TO_BE_RELEVANT
            if (!link) {
                diffs.push({
                    srcFid: decl.src,
                    tarFid: decl.src,
                    expected: {
                        src_type: decl.src_type,
                        tar_type: decl.tar_type,
                    },
                    received: {
                        src_type: PAG_NODE.EMPTY,
                        tar_type: PAG_NODE.EMPTY,
                    },
                });
            }
        } else if ([decl.src_type, decl.tar_type].every(nodeType => nodeType === PAG_NODE.EMPTY)) {
            // EdgeAssert.TO_BE_NOT_RELEVANT
            if (link) {
                diffs.push({
                    srcFid: link.src,
                    tarFid: link.src,
                    expected: {
                        src_type: PAG_NODE.EMPTY,
                        tar_type: PAG_NODE.EMPTY,
                    },
                    received: {
                        src_type: link.src_type,
                        tar_type: link.tar_type,
                    },
                });
            }
        } else {
            const sourceNode = decl.src_type === PAG_NODE.ARROW ? decl.tar : decl.src;
            const targetNode = decl.src_type === PAG_NODE.ARROW ? decl.src : decl.tar;
            const shouldEffect = (decl.src_type === PAG_NODE.ARROW ? decl.tar_type : decl.src_type) === PAG_NODE.BLANK;
            if (shouldEffect) {
                if (!link) {
                    diffs.push({
                        srcFid: sourceNode,
                        tarFid: targetNode,
                        expected: {
                            src_type: PAG_NODE.BLANK,
                            tar_type: PAG_NODE.ARROW,
                        },
                        received: {
                            src_type: PAG_NODE.EMPTY,
                            tar_type: PAG_NODE.EMPTY,
                        },
                    });
                } else {
                    const sourceType = link.src === sourceNode ? link.src_type : link.tar_type;
                    const targetType = link.tar === targetNode ? link.tar_type : link.src_type;
                    if (targetType !== PAG_NODE.ARROW) {
                        diffs.push({
                            srcFid: sourceNode,
                            tarFid: targetNode,
                            expected: {
                                src_type: PAG_NODE.BLANK,
                                tar_type: PAG_NODE.ARROW,
                            },
                            received: {
                                src_type: sourceType,
                                tar_type: targetType,
                            },
                        });
                    }
                }
            } else if (link) {
                const sourceType = link.src === sourceNode ? link.src_type : link.tar_type;
                const targetType = link.tar === targetNode ? link.tar_type : link.src_type;
                if (targetType === PAG_NODE.ARROW) {
                    diffs.push({
                        srcFid: sourceNode,
                        tarFid: targetNode,
                        expected: {
                            src_type: PAG_NODE.EMPTY,
                            tar_type: PAG_NODE.ARROW,
                        },
                        received: {
                            src_type: sourceType,
                            tar_type: targetType,
                        },
                    });
                }
            }
        }
    }

    return diffs;
};
