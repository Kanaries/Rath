import os
import unittest
from unittest.mock import patch

from assistant import handle_assistant_request
from assistant_llm import maybe_enrich_answer_with_llm


class AssistantLlmTest(unittest.TestCase):
    fields = [{"fid": "revenue", "name": "Revenue", "semanticType": "quantitative", "analyticType": "measure"}]

    @patch.dict(os.environ, {"OPENAI_API_KEY": "", "ASSISTANT_LLM_URL": ""}, clear=False)
    def test_rule_only_when_llm_not_configured(self):
        answer, used = maybe_enrich_answer_with_llm("Run AutoPilot", self.fields, "rule answer")
        self.assertEqual(answer, "rule answer")
        self.assertFalse(used)

    @patch.dict(os.environ, {"OPENAI_API_KEY": "test-key", "ASSISTANT_LLM_URL": "http://llm.test/v1"})
    @patch("assistant_llm._post_json")
    def test_llm_enrichment_when_configured(self, mock_post):
        mock_post.return_value = {"choices": [{"message": {"content": "LLM enriched answer"}}]}
        answer, used = maybe_enrich_answer_with_llm("Run AutoPilot", self.fields, "rule answer")
        self.assertEqual(answer, "LLM enriched answer")
        self.assertTrue(used)

    @patch.dict(os.environ, {"OPENAI_API_KEY": "", "ASSISTANT_LLM_URL": ""}, clear=False)
    def test_handle_assistant_request_includes_llm_flag(self):
        result = handle_assistant_request({"question": "Run AutoPilot", "fields": self.fields})
        self.assertIn("answer", result)
        self.assertIn("intent", result)
        self.assertEqual(result["llmUsed"], False)


if __name__ == "__main__":
    unittest.main()
