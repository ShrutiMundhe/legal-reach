import base64
import io
import json
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import numpy as np
from langchain_core.documents import Document
from langchain_ollama import OllamaEmbeddings
from langchain_ollama.llms import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader

from main import answer_legal_question

HOST = "127.0.0.1"
PORT = 8008
MAX_FILE_BYTES = 30 * 1024 * 1024
SESSION_TTL_SECONDS = 60 * 60 * 3

lock = threading.Lock()
sessions = {}
embedding_model = OllamaEmbeddings(model="mxbai-embed-large", base_url="http://localhost:11434")
llm = OllamaLLM(model="llama3.2")
splitter = RecursiveCharacterTextSplitter(chunk_size=700, chunk_overlap=100, separators=["\n\n", "\n", ". ", " ", ""])

session_prompt = ChatPromptTemplate.from_template(
    """You are a legal document explainer.
Answer ONLY from the provided document context. Do not use outside knowledge.
If answer is not in the document, say exactly: "This information is not available in the uploaded document."
Keep language simple for an 8th-grade student.
Always add citations like [DocumentName, page X].

Context:
{context}

Question:
{question}

Response format:
1) Quick Answer
2) Easy Explanation (short bullet points)
3) Citations"""
)
session_chain = session_prompt | llm


def cleanup_old_sessions():
    now = time.time()
    with lock:
        stale = [sid for sid, data in sessions.items() if now - data["updated_at"] > SESSION_TTL_SECONDS]
        for sid in stale:
            del sessions[sid]


def prepare_session_from_pdf(session_id: str, filename: str, file_bytes: bytes):
    pdf_reader = PdfReader(io.BytesIO(file_bytes))
    pages = []
    for page_index, page in enumerate(pdf_reader.pages, start=1):
        text = (page.extract_text() or "").strip()
        if text:
            pages.append((page_index, text))

    if not pages:
        raise ValueError("Could not extract text from uploaded PDF.")

    docs = []
    for page_num, page_text in pages:
        chunks = splitter.split_text(page_text)
        for chunk_idx, chunk in enumerate(chunks, start=1):
            docs.append(
                Document(
                    page_content=chunk,
                    metadata={
                        "source": filename,
                        "page": page_num,
                        "chunk": chunk_idx
                    }
                )
            )

    embeddings = np.array(embedding_model.embed_documents([d.page_content for d in docs]))
    with lock:
        sessions[session_id] = {
            "filename": filename,
            "docs": docs,
            "embeddings": embeddings,
            "updated_at": time.time(),
        }


def answer_from_session(session_id: str, question: str):
    with lock:
        session = sessions.get(session_id)

    if not session:
        raise ValueError("No uploaded document found for this session.")

    docs = session["docs"]
    embeddings = session["embeddings"]
    query_embedding = np.array(embedding_model.embed_query(question))

    embeddings_norm = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)
    query_norm = query_embedding / np.linalg.norm(query_embedding)
    similarities = np.dot(embeddings_norm, query_norm)
    top_indices = np.argsort(similarities)[-5:][::-1]
    selected_docs = [docs[i] for i in top_indices if i < len(docs)]

    context_lines = []
    for doc in selected_docs:
        context_lines.append(
            f"[{doc.metadata.get('source')}, page {doc.metadata.get('page')}]\n{doc.page_content[:350]}"
        )
    context = "\n\n".join(context_lines)
    result = session_chain.invoke({"context": context, "question": question})

    with lock:
        session["updated_at"] = time.time()

    return result


class RagHandler(BaseHTTPRequestHandler):
    def _send_json(self, status_code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        cleanup_old_sessions()
        if self.path == "/health":
            self._send_json(200, {"ok": True})
            return
        self._send_json(404, {"ok": False, "message": "Not found"})

    def do_POST(self):
        cleanup_old_sessions()
        try:
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length).decode("utf-8") if length else "{}"
            data = json.loads(raw)
        except Exception:
            self._send_json(400, {"ok": False, "message": "Invalid JSON body."})
            return

        try:
            if self.path == "/ask":
                question = (data.get("question") or "").strip()
                if not question:
                    self._send_json(400, {"ok": False, "message": "Question is required."})
                    return
                answer = answer_legal_question(question)
                self._send_json(200, {"ok": True, "answer": answer})
                return

            if self.path == "/session/upload":
                session_id = (data.get("sessionId") or "").strip()
                filename = (data.get("fileName") or "uploaded.pdf").strip()
                file_b64 = (data.get("fileDataBase64") or "").strip()
                if not session_id or not file_b64:
                    self._send_json(400, {"ok": False, "message": "sessionId and fileDataBase64 are required."})
                    return

                file_bytes = base64.b64decode(file_b64)
                if len(file_bytes) > MAX_FILE_BYTES:
                    self._send_json(400, {"ok": False, "message": "File is too large. Max size is 30MB."})
                    return

                prepare_session_from_pdf(session_id, filename, file_bytes)
                self._send_json(200, {"ok": True, "message": "PDF uploaded and indexed for this session."})
                return

            if self.path == "/session/ask":
                session_id = (data.get("sessionId") or "").strip()
                question = (data.get("question") or "").strip()
                if not session_id or not question:
                    self._send_json(400, {"ok": False, "message": "sessionId and question are required."})
                    return
                answer = answer_from_session(session_id, question)
                self._send_json(200, {"ok": True, "answer": answer})
                return

            if self.path == "/session/clear":
                session_id = (data.get("sessionId") or "").strip()
                if session_id:
                    with lock:
                        sessions.pop(session_id, None)
                self._send_json(200, {"ok": True})
                return

            self._send_json(404, {"ok": False, "message": "Not found"})
        except Exception as exc:
            self._send_json(500, {"ok": False, "message": str(exc)})


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), RagHandler)
    print(f"RAG worker running at http://{HOST}:{PORT}")
    server.serve_forever()
