import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const RAGBOT_DIR = path.join(PROJECT_ROOT, 'ragbot', 'LocalAIAgentWithRAG-main');
const RAG_WORKER_SCRIPT = path.join(RAGBOT_DIR, 'worker_server.py');
const PYTHON_BIN = process.env.RAGBOT_PYTHON || 'python';
const RAG_WORKER_URL = process.env.RAG_WORKER_URL || 'http://127.0.0.1:8008';

let ragWorkerProcess = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isWorkerAlive = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${RAG_WORKER_URL}/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
};

const ensureWorker = async () => {
  if (await isWorkerAlive()) return;

  if (!ragWorkerProcess || ragWorkerProcess.exitCode !== null) {
    ragWorkerProcess = spawn(PYTHON_BIN, [RAG_WORKER_SCRIPT], {
      cwd: RAGBOT_DIR,
      windowsHide: true
    });

    ragWorkerProcess.stdout.on('data', (data) => {
      console.log(`[RAG Worker] ${data.toString().trim()}`);
    });

    ragWorkerProcess.stderr.on('data', (data) => {
      console.error(`[RAG Worker] ${data.toString().trim()}`);
    });

    ragWorkerProcess.on('close', (code) => {
      console.error(`[RAG Worker] exited with code ${code}`);
    });
  }

  for (let i = 0; i < 12; i += 1) {
    if (await isWorkerAlive()) return;
    await sleep(1000);
  }

  throw new Error('RAG worker did not become ready in time.');
};

const callWorker = async (endpoint, body) => {
  await ensureWorker();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);
  const response = await fetch(`${RAG_WORKER_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: controller.signal
  });
  clearTimeout(timeoutId);
  const payload = await response.json();
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.message || 'RAG worker request failed.');
  }
  return payload;
};

router.post('/ask', async (req, res) => {
  const question = (req.body?.question || '').trim();
  if (!question) return res.status(400).json({ message: 'Question is required.' });
  try {
    const payload = await callWorker('/ask', { question });
    return res.json({ answer: payload.answer, mode: 'global' });
  } catch (error) {
    return res.status(500).json({ message: `RAG service unavailable: ${error.message}` });
  }
});

router.post('/session/upload', async (req, res) => {
  const sessionId = (req.body?.sessionId || '').trim();
  const fileName = (req.body?.fileName || '').trim();
  const fileDataBase64 = (req.body?.fileDataBase64 || '').trim();

  if (!sessionId || !fileDataBase64) {
    return res.status(400).json({ message: 'sessionId and PDF data are required.' });
  }

  try {
    const payload = await callWorker('/session/upload', { sessionId, fileName, fileDataBase64 });
    return res.json({ message: payload.message });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post('/session/ask', async (req, res) => {
  const sessionId = (req.body?.sessionId || '').trim();
  const question = (req.body?.question || '').trim();
  if (!sessionId || !question) {
    return res.status(400).json({ message: 'sessionId and question are required.' });
  }
  try {
    const payload = await callWorker('/session/ask', { sessionId, question });
    return res.json({ answer: payload.answer, mode: 'session' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post('/session/clear', async (req, res) => {
  const sessionId = (req.body?.sessionId || '').trim();
  if (!sessionId) return res.status(400).json({ message: 'sessionId is required.' });
  try {
    await callWorker('/session/clear', { sessionId });
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
