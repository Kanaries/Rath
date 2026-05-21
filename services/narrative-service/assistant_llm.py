from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional, Tuple


def _llm_configured() -> bool:
    return bool(os.environ.get("ASSISTANT_LLM_URL") or os.environ.get("OPENAI_API_KEY"))


def _build_prompt(question: str, fields: List[Dict[str, Any]], rule_answer: str) -> str:
    field_lines = []
    for field in fields[:20]:
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


def _post_json(url: str, payload: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", **headers},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))


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
        content = response.get("choices", [{}])[0].get("message", {}).get("content")
        if isinstance(content, str) and content.strip():
            return content.strip(), True
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, KeyError, IndexError):
        pass

    return rule_answer, False
