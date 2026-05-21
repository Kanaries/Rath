from __future__ import annotations

import re
from typing import Any, Dict, List

from assistant_llm import maybe_enrich_answer_with_llm


NAV_PATTERNS: List[tuple] = [
    (re.compile(r"\b(auto\s*pilot|autopilot|scan|rank(ed)?\s*insights?|interesting)\b", re.I), "megaAuto", "autopilot"),
    (re.compile(r"\b(copilot|semi[- ]?auto|pattern|correlation)\b", re.I), "semiAuto", "copilot"),
    (re.compile(r"\b(causal|cause|effect|why does|what drives)\b", re.I), "causal", "causal"),
    (re.compile(r"\b(dashboard|report)\b", re.I), "dashboard", "dashboard"),
    (re.compile(r"\b(manual|chart|explore|graphic walker)\b", re.I), "editor", "manual"),
    (re.compile(r"\b(paint|painter)\b", re.I), "painter", "painter"),
    (re.compile(r"\b(import|load|connect|data source|prepare)\b", re.I), "dataSource", "datasource"),
]

EXPLAIN_PATTERN = re.compile(r"\b(why|explain|what|how|describe|tell me about)\b", re.I)
AUTOPILOT_RUN_PATTERN = re.compile(
    r"(\b(run|start|launch)\b.*\b(auto\s*pilot|autopilot)\b)|(\b(auto\s*pilot|autopilot)\b.*\b(run|start|now)\b)",
    re.I,
)
CAUSAL_PATTERN = re.compile(r"\b(causal|cause|effect)\b", re.I)


def _normalize(text: str) -> str:
    return text.strip().lower()


def _match_fields(question: str, fields: List[Dict[str, Any]]) -> List[str]:
    q = _normalize(question)
    hits: List[str] = []
    for field in fields:
        fid = str(field.get("fid", ""))
        if fid == "__index__":
            continue
        name = str(field.get("name") or fid).strip()
        token = _normalize(name)
        if len(token) >= 2 and token in q:
            hits.append(fid)
    return hits


def parse_assistant_question(question: str, fields: List[Dict[str, Any]]) -> Dict[str, Any]:
    q = question.strip()
    if not q:
        return {
            "type": "unknown",
            "reason": "empty",
            "suggestions": [
                "Which fields correlate with revenue?",
                "Run AutoPilot on this dataset",
                "Try causal analysis on sales",
            ],
        }

    matched_fields = _match_fields(q, fields)

    if EXPLAIN_PATTERN.search(q) and matched_fields:
        return {"type": "explain_fields", "fieldFids": matched_fields, "reason": "explain_fields"}

    if AUTOPILOT_RUN_PATTERN.search(q):
        return {"type": "run_autopilot", "reason": "explicit_autopilot"}

    if CAUSAL_PATTERN.search(q):
        return {"type": "run_causal", "fieldFids": matched_fields, "reason": "explicit_causal"}

    for pattern, page, reason in NAV_PATTERNS:
        if pattern.search(q):
            if page == "causal":
                return {"type": "run_causal", "fieldFids": matched_fields, "reason": reason}
            if page == "megaAuto" and re.search(r"\b(run|start|go)\b", q, re.I):
                return {"type": "run_autopilot", "reason": reason}
            return {"type": "navigate", "page": page, "reason": reason}

    if matched_fields:
        return {"type": "focus_fields", "fieldFids": matched_fields, "reason": "matched_fields"}

    if EXPLAIN_PATTERN.search(q):
        return {"type": "explain_fields", "fieldFids": matched_fields, "reason": "explain_without_fields"}

    return {
        "type": "unknown",
        "reason": "no_match",
        "suggestions": ["Run AutoPilot", "Try causal analysis", "Open dashboard"],
    }


def _field_label(fields: List[Dict[str, Any]], fid: str) -> str:
    for field in fields:
        if str(field.get("fid")) == fid:
            return str(field.get("name") or fid)
    return fid


def build_assistant_answer(question: str, intent: Dict[str, Any], fields: List[Dict[str, Any]]) -> str:
    intent_type = intent.get("type")
    if intent_type == "run_autopilot":
        return "I can open AutoPilot and start a ranked insight scan for this dataset."
    if intent_type == "run_causal":
        fids = intent.get("fieldFids") or []
        if fids:
            names = ", ".join(_field_label(fields, fid) for fid in fids)
            return f"I can open causal analysis focusing on {names}."
        return "I can open causal analysis with safe defaults."
    if intent_type == "navigate":
        page = intent.get("page", "dataSource")
        return f"I can take you to {page}."
    if intent_type == "focus_fields":
        names = ", ".join(_field_label(fields, fid) for fid in intent.get("fieldFids") or [])
        return f"I matched these fields: {names}. You can use them in AutoPilot, Copilot, or causal discovery."
    if intent_type == "explain_fields":
        fids = intent.get("fieldFids") or []
        if fids:
            names = ", ".join(_field_label(fields, fid) for fid in fids)
            return f"I can explain patterns involving {names} using the narrative service."
        return "Name one or more fields in your question so I can generate an explanation."
    if intent_type == "unknown":
        suggestions = intent.get("suggestions") or []
        if suggestions:
            return "Try one of these: " + " · ".join(suggestions)
    return "Ask me to run AutoPilot, explain a field, try causal analysis, or open the dashboard."


def handle_assistant_request(payload: Dict[str, Any]) -> Dict[str, Any]:
    question = str(payload.get("question") or "")
    fields = payload.get("fields") or []
    if not isinstance(fields, list):
        fields = []
    intent = parse_assistant_question(question, fields)
    rule_answer = build_assistant_answer(question, intent, fields)
    answer, llm_used = maybe_enrich_answer_with_llm(question, fields, rule_answer)
    return {"answer": answer, "intent": intent, "llmUsed": llm_used}
