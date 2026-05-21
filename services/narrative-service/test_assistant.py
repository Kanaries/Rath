import unittest

from assistant import build_assistant_answer, parse_assistant_question


class AssistantParserTest(unittest.TestCase):
    fields = [
        {"fid": "revenue", "name": "Revenue", "semanticType": "quantitative", "analyticType": "measure"},
        {"fid": "region", "name": "Region", "semanticType": "nominal", "analyticType": "dimension"},
    ]

    def test_run_autopilot(self):
        intent = parse_assistant_question("Run AutoPilot now", self.fields)
        self.assertEqual(intent["type"], "run_autopilot")

    def test_explain_fields(self):
        intent = parse_assistant_question("Explain why revenue matters", self.fields)
        self.assertEqual(intent["type"], "explain_fields")
        self.assertIn("revenue", intent["fieldFids"])

    def test_navigate_dashboard(self):
        intent = parse_assistant_question("open dashboard", self.fields)
        self.assertEqual(intent["type"], "navigate")
        self.assertEqual(intent["page"], "dashboard")

    def test_build_answer(self):
        intent = parse_assistant_question("Try causal analysis on revenue", self.fields)
        answer = build_assistant_answer("Try causal analysis on revenue", intent, self.fields)
        self.assertIn("Revenue", answer)


if __name__ == "__main__":
    unittest.main()
