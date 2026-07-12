import React, { useMemo, useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../utils/config';
import './RagbotWidget.css';

const RagbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [sessionDocName, setSessionDocName] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const sessionId = useMemo(() => {
    const existing = sessionStorage.getItem('ragSessionId');
    if (existing) return existing;
    const generated = `${user?._id || 'anon'}-${Date.now()}`;
    sessionStorage.setItem('ragSessionId', generated);
    return generated;
  }, [user?._id]);

  const welcomeMessage = useMemo(
    () =>
      "Hi, I am your legal assistant. Upload one PDF (max 30MB) and ask questions from that document only. If no file is uploaded, I answer from platform legal documents. My answers are citation-based and I am not a lawyer.",
    []
  );

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result || '';
        const base64 = String(result).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const onFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Only PDF file is allowed.');
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      setError('PDF is too large. Max allowed size is 30MB.');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const base64 = await toBase64(file);
      await axios.post(`${API_BASE_URL}/api/rag/session/upload`, {
        sessionId,
        fileName: file.name,
        fileDataBase64: base64
      });
      setSessionDocName(file.name);
      setAnswer('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload and process PDF.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const clearSessionDocument = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/rag/session/clear`, { sessionId });
      setSessionDocName('');
      setAnswer('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to clear uploaded document.');
    }
  };

  const askRagbot = async () => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || loading) return;

    setLoading(true);
    setError('');

    try {
      const endpoint = sessionDocName ? '/api/rag/session/ask' : '/api/rag/ask';
      const payload = sessionDocName
        ? { sessionId, question: trimmedQuestion }
        : { question: trimmedQuestion };
      const res = await axios.post(`${API_BASE_URL}${endpoint}`, payload);
      setAnswer(res.data?.answer || 'No answer received.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get response from legal assistant.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className="rag-fab" onClick={() => setOpen((prev) => !prev)} aria-label="Open legal assistant">
        💬
      </button>

      {open && (
        <div className="rag-panel">
          <div className="rag-header">
            <span>Legal Assistant</span>
            <span className="rag-mode">{sessionDocName ? 'PDF mode' : 'Global mode'}</span>
          </div>

          <div className="rag-intro">
            {welcomeMessage}
          </div>

          <div className="rag-upload-row">
            <label className="rag-upload-label">
              <input type="file" accept="application/pdf" onChange={onFileUpload} disabled={uploading || loading} />
              {uploading ? 'Processing PDF...' : 'Upload PDF (max 30MB)'}
            </label>
            {sessionDocName && (
              <button className="rag-clear-btn" onClick={clearSessionDocument} disabled={loading || uploading}>
                Clear PDF
              </button>
            )}
          </div>

          {sessionDocName && <div className="rag-doc-tag">Using: {sessionDocName}</div>}

          <div className="rag-body">
            <textarea
              className="rag-textarea"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={sessionDocName ? "Ask from uploaded PDF..." : "Ask from platform legal documents..."}
              rows={4}
            />

            <button
              className="rag-ask-btn"
              onClick={askRagbot}
              disabled={loading || !question.trim()}
            >
              {loading ? 'Getting answer...' : 'Ask Assistant'}
            </button>

            {error && <div className="rag-error">{error}</div>}

            {answer && (
              <div className="rag-answer">
                {answer}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default RagbotWidget;
