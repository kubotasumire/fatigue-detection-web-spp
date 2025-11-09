const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { formatSessionDataToJST } = require('../utils/dateFormatter');

// セッションデータをメモリに保存（本番環境ではデータベース使用）
const sessions = new Map();

// セッション開始
router.post('/session/start', (req, res) => {
  const { difficulty, timestamp } = req.body;
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  sessions.set(sessionId, {
    id: sessionId,
    difficulty,
    startTime: timestamp,
    sensorData: [],
    quizResponses: [],
    endTime: null
  });

  res.json({ sessionId });
});

// リアルタイムセンサーデータを受信
router.post('/sensor', (req, res) => {
  const { sessionId, data } = req.body;
  // data構造: { timestamp, position: {x, y}, rotation: {x, y}, gaze: {x, y, object} }

  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  session.sensorData.push(data);
  res.json({ success: true });
});

// クイズ回答を記録
router.post('/quiz-response', (req, res) => {
  const { sessionId, quizId, selectedAnswer, isCorrect, timestamp } = req.body;

  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  session.quizResponses.push({
    quizId,
    selectedAnswer,
    isCorrect,
    timestamp
  });

  res.json({ success: true });
});

// セッション終了
router.post('/session/end', (req, res) => {
  const { sessionId, timestamp } = req.body;

  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  session.endTime = timestamp;

  // セッションデータをファイルに保存（タイムスタンプをJST形式に変換）
  const dataDir = path.join(__dirname, '../../data/sessions');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // タイムスタンプをJST形式に変換してファイルに保存
  const formattedSessionData = formatSessionDataToJST(session);
  const sessionFile = path.join(dataDir, `${sessionId}.json`);
  fs.writeFileSync(sessionFile, JSON.stringify(formattedSessionData, null, 2));

  res.json({ success: true, message: 'Session saved' });
});

// セッションデータ取得
router.get('/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json(session);
});

module.exports = router;
