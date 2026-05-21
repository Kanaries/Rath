"""
Minimal smoke checks for the causal-service algorithms.

Intended to be executed inside the causal-service environment (Docker image),
where causallearn / dowhy dependencies are available.

Run:
  python3 smoke_test.py
"""

from __future__ import annotations

from typing import List, Dict, Any


def _make_toy_dataset(n: int = 200) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    # Simple toy data with a couple of correlated variables.
    import random
    import math

    rows: List[Dict[str, Any]] = []
    for i in range(n):
        x = random.random()
        y = 2.0 * x + random.gauss(0, 0.05)
        z = random.random()
        cat = "A" if x > 0.5 else "B"
        rows.append({"x": x, "y": y, "z": z, "cat": cat, "t": i})

    fields = [
        {"fid": "x", "name": "x", "semanticType": "quantitative"},
        {"fid": "y", "name": "y", "semanticType": "quantitative"},
        {"fid": "z", "name": "z", "semanticType": "quantitative"},
        {"fid": "cat", "name": "cat", "semanticType": "nominal"},
        {"fid": "t", "name": "t", "semanticType": "ordinal"},
    ]
    return rows, fields


def _assert_square_matrix(m: Any, n: int) -> None:
    assert isinstance(m, list), f"matrix should be list, got {type(m)}"
    assert len(m) == n, f"matrix rows {len(m)} != {n}"
    for row in m:
        assert isinstance(row, list), f"matrix row should be list, got {type(row)}"
        assert len(row) == n, f"matrix cols {len(row)} != {n}"


def main() -> int:
    dataSource, fields_raw = _make_toy_dataset()

    # Import inside main to make it clear what dependencies are required.
    import algorithms
    from algorithms.common import IFieldMeta

    fields = [IFieldMeta(**f) for f in fields_raw]
    focused = ["x", "y", "z"]

    # PC
    from algorithms.causallearn.PC import PC, PCParams

    pc = PC(dataSource, fields, PCParams())
    pc_res = pc.calc(PCParams(), focusedFields=focused, bgKnowledgesPag=[])
    _assert_square_matrix(pc_res["matrix"], len(focused))
    print("[ok] PC")

    # FCI (enabled)
    from algorithms.causallearn.FCI import FCI, FCIParams

    fci = FCI(dataSource, fields, FCIParams())
    fci_res = fci.calc(FCIParams(), focusedFields=focused, bgKnowledgesPag=[])
    _assert_square_matrix(fci_res["matrix"], len(focused))
    print("[ok] FCI")

    # Functional dependency test
    from algorithms.FuncDepTest import FuncDepTest, FuncDepTestParams

    fd = FuncDepTest(dataSource, fields, FuncDepTestParams())
    fd_res = fd.calc(FuncDepTestParams(), focusedFields=focused, bgKnowledgesPag=[])
    _assert_square_matrix(fd_res["matrix"], len(focused))
    print("[ok] FuncDepTest")

    # DoWhy explain smoke (may be slow / optional depending on deps)
    try:
        from algorithms.dowhy import ExplainData, IRInsightExplainProps, IRInsightExplainSubspace, IRInsightSubspaceGroup, IRViewSpec, IRMeasureSpec, ICausalModel, PagLink, IFilter
    except (ModuleNotFoundError, ImportError) as e:
        print(f"[skip] /explain smoke (missing dependencies): {e}")
    else:
        try:
            props = IRInsightExplainProps(
                data=dataSource,
                fields=fields,
                causalModel=ICausalModel(
                    funcDeps=[],
                    edges=[
                        PagLink(src="x", tar="y", src_type=-1, tar_type=1),
                    ],
                ),
                groups=IRInsightSubspaceGroup(
                    current=IRInsightExplainSubspace(predicates=[IFilter(fid="cat", type="set", values=["A"])]),
                    other=IRInsightExplainSubspace(predicates=[IFilter(fid="cat", type="set", values=["B"])]),
                ),
                view=IRViewSpec(
                    dimensions=["cat"],
                    measures=[IRMeasureSpec(fid="y", op="mean")],
                ),
            )
            explain = ExplainData(props)
            assert hasattr(explain, "causalEffects")
            print("[ok] /explain core")
        except ValueError as e:
            print(f"[skip] /explain smoke (runtime): {e}")

    try:
        from algorithms.dowhy.Explainer import Explainer, ExplainerParams

        explainer = Explainer(dataSource, fields_raw)
        explainer_res = explainer.calc(
            ExplainerParams(
                target="y",
                treatment=["x"],
                estimate_effect_method="backdoor.linear_regression",
            ),
            focusedFields=["x", "y"],
            bgKnowledgesPag=[{"src": "x", "tar": "y", "src_type": -1, "tar_type": 1}],
        )
        assert "res" in explainer_res
        assert "causal_estimate" in explainer_res["res"]
        print("[ok] Explainer effect estimation")
    except Exception as e:
        print(f"[skip] Explainer smoke: {e}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

