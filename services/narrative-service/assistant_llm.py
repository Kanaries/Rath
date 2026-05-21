from __future__ import annotations

import json
import logging
import os
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional, Tuple

# Limit fields included in the LLM prompt to avoid exceeding token/context limits.
MAX_FIELDS = 20
TIMEOUT_DEFAULT = 10

logger = logging.getLogger(__name__)


def _llm_configured() -> bool:
    llm_url = (os.environ.get("ASSISTANT_LLM_URL") or "").strip()
    api_key = (os.environ.get("OPENAI_API_KEY") or "").strip()
    return bool(llm_url or api_key)


def _build_prompt(question: str, fields: List[Dict[str, Any]], rule_answer: str) -> str:
    field_lines = []
    for field in fields[:MAX_FIELDS]:
        field_lines.append(
            f"- {field.get('name') or field.get('fid')} ({field.get('analyticType')}, {field.get('semanticType')})"
        )
    field_text = "\n".join(field_lines) if field_lines else "- (no fields provided)"
    return (
        "You are RATH Data Assistant. Answer briefly and practically.\n"
        "Suggest concrete next steps inside RATH (AutoPilot, causal analysis, dashboard, manual exploration).\n"
        "Do not invent data values.\n\n"
        f"User question: {question}\n\n"
        f"Known fields:\n{field_text}\n\n"
        f"Rule-based suggestion: {rule_answer}\n\n"
        "Write a concise helpful answer in 2-4 sentences."
    )


def _post_json(url: str, payload: Dict[str, Any], headers: Dict[str, str], timeout: int = TIMEOUT_DEFAULT) -> Dict[str, Any]:
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", **headers},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _extract_message_content(response: Any) -> Optional[str]:
    if not isinstance(response, dict):
        return None
    choices = response.get("choices")
    if not isinstance(choices, list) or len(choices) == 0:
        return None
    first = choices[0]
    if not isinstance(first, dict):
        return None
    message = first.get("message")
    if not isinstance(message, dict):
        return None
    content = message.get("content")
    if not isinstance(content, str) or not content.strip():
        return None
    return content.strip()


def maybe_enrich_answer_with_llm(
    question: str,
    fields: List[Dict[str, Any]],
    rule_answer: str,
) -> Tuple[str, bool]:
    if not _llm_configured():
        return rule_answer, False

    api_key = os.environ.get("OPENAI_API_KEY", "")
    base_url = os.environ.get("ASSISTANT_LLM_URL", "https://api.openai.com/v1").rstrip("/")
    model = os.environ.get("ASSISTANT_LLM_MODEL", "gpt-4o-mini")
    prompt = _build_prompt(question, fields, rule_answer)

    try:
        response = _post_json(
            f"{base_url}/chat/completions",
            {
                "model": model,
                "messages": [
                    {"role": "system", "content": "You are a helpful data analysis copilot."},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.2,
            },
            headers={"Authorization": f"Bearer {api_key}"} if api_key else {},
        )
        content = _extract_message_content(response)
        if content:
            return content, True
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, KeyError, IndexError) as e:
        logger.exception("assistant LLM request failed: %s", e)

    return rule_answer, False
