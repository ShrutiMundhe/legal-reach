import json
import sys

from main import answer_legal_question


def main():
    question = " ".join(sys.argv[1:]).strip()
    if not question:
        print("__RAGBOT_RESULT__" + json.dumps({"ok": False, "error": "Question is required."}))
        return

    try:
        answer = answer_legal_question(question)
        print("__RAGBOT_RESULT__" + json.dumps({"ok": True, "answer": answer}, ensure_ascii=False))
    except Exception as exc:
        print("__RAGBOT_RESULT__" + json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
