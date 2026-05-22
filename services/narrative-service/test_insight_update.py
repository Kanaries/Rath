import unittest

import pandas as pd

from insight_update import insight_check


class InsightRegressionTest(unittest.TestCase):
    fields = pd.DataFrame([
        {"fid": "region", "name": "Region", "analyticType": "dimension", "semanticType": "nominal"},
        {"fid": "sales", "name": "Sales", "analyticType": "measure", "semanticType": "quantitative"},
    ])

    def test_single_breakdown_group_does_not_crash(self):
        data = pd.DataFrame({
            "region": ["A"] * 12,
            "sales": list(range(1, 13)),
        })
        insight_dict, meta = insight_check(self.fields, data, langType="en")
        self.assertIsInstance(insight_dict, dict)
        self.assertIn("StaticMeasure", insight_dict)

    def test_two_measures_with_low_cardinality_dimension(self):
        fields = pd.DataFrame([
            {"fid": "region", "name": "Region", "analyticType": "dimension", "semanticType": "nominal"},
            {"fid": "sales", "name": "Sales", "analyticType": "measure", "semanticType": "quantitative"},
            {"fid": "profit", "name": "Profit", "analyticType": "measure", "semanticType": "quantitative"},
        ])
        data = pd.DataFrame({
            "region": ["East", "East", "West", "West"],
            "sales": [10, 12, 8, 9],
            "profit": [2, 3, 1, 2],
        })
        insight_dict, meta = insight_check(fields, data, langType="en")
        self.assertIsInstance(insight_dict, dict)
        self.assertIn("Trend", insight_dict)

    def test_mean_aggregation_with_object_columns(self):
        fields = pd.DataFrame([
            {"fid": "region", "name": "Region", "analyticType": "dimension", "semanticType": "nominal"},
            {"fid": "category", "name": "Category", "analyticType": "dimension", "semanticType": "nominal"},
            {"fid": "sales", "name": "Sales", "analyticType": "measure", "semanticType": "quantitative"},
        ])
        data = pd.DataFrame({
            "region": ["East", "East", "West", "West"],
            "category": ["A", "B", "A", "B"],
            "sales": ["10", "12", "8", "9"],
        })
        insight_dict, meta = insight_check(fields, data, aggrType="mean", langType="en")
        self.assertIsInstance(insight_dict, dict)
        self.assertIn("StaticMeasure", insight_dict)
        self.assertGreaterEqual(insight_dict["StaticMeasure"]["score"], 0)


if __name__ == "__main__":
    unittest.main()
