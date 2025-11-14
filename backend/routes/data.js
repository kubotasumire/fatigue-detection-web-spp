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

  console.log(`🎬 Session started:`, { sessionId, difficulty });

  sessions.set(sessionId, {
    id: sessionId,
    difficulty,
    startTime: timestamp,
    sensorData: [],
    quizResponses: [],
    endTime: null
  });

  console.log(`✅ Sessions count: ${sessions.size}`);
  res.json({ sessionId });
});

// リアルタイムセンサーデータを受信
router.post('/sensor', (req, res) => {
  const { sessionId, data } = req.body;
  // data構造: { timestamp, position: {x, y}, gaze: {x, y, object, inCenter} }

  console.log(`📤 Sensor data received:`, {
    sessionId,
    dataType: data?.timestamp ? 'valid' : 'invalid',
    position: data?.position,
    gaze: data?.gaze?.object
  });

  const session = sessions.get(sessionId);
  if (!session) {
    console.warn(`❌ Session not found: ${sessionId}`);
    console.warn(`📋 Available sessions: ${Array.from(sessions.keys()).join(', ') || 'NONE'}`);
    return res.status(404).json({ error: 'Session not found', receivedSessionId: sessionId });
  }

  session.sensorData.push(data);
  console.log(`✅ Sensor data saved. Total: ${session.sensorData.length} records`);
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

  console.log(`📊 Session end request:`, { sessionId, timestamp, sessionsCount: sessions.size });

  const session = sessions.get(sessionId);
  if (!session) {
    console.warn(`❌ Session not found: ${sessionId}`);
    console.warn(`📋 Available sessions: ${Array.from(sessions.keys()).join(', ') || 'NONE'}`);
    return res.status(404).json({ error: 'Session not found' });
  }

  session.endTime = timestamp;

  // セッションデータをファイルに保存（タイムスタンプをJST形式に変換）
  // Render環境では /mnt/data/sessions、ローカル開発環境では ./data/sessions を使用
  const dataDir = process.env.NODE_ENV === 'production'
    ? '/mnt/data/sessions'
    : path.join(__dirname, '../../data/sessions');

  try {
    if (!fs.existsSync(dataDir)) {
      console.log(`📁 Creating directory: ${dataDir}`);
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // タイムスタンプをJST形式に変換してファイルに保存
    const formattedSessionData = formatSessionDataToJST(session);
    const sessionFile = path.join(dataDir, `${sessionId}.json`);
    fs.writeFileSync(sessionFile, JSON.stringify(formattedSessionData, null, 2));

    console.log(`✅ Session saved: ${sessionFile}`);
    console.log(`📊 Session data: ${JSON.stringify(formattedSessionData, null, 2).substring(0, 200)}...`);

    res.json({ success: true, message: 'Session saved' });
  } catch (error) {
    console.error(`❌ Error saving session: ${error.message}`, error);
    res.status(500).json({ error: 'Failed to save session', details: error.message });
  }
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

// 保存されたセッションファイル一覧を取得
router.get('/sessions/list', (req, res) => {
  const dataDir = process.env.NODE_ENV === 'production'
    ? '/mnt/data/sessions'
    : path.join(__dirname, '../../data/sessions');

  try {
    if (!fs.existsSync(dataDir)) {
      return res.json({ sessions: [], count: 0 });
    }

    const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));
    const sessions = files.map(file => {
      const filePath = path.join(dataDir, file);
      const stats = fs.statSync(filePath);
      return {
        filename: file,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      };
    });

    res.json({ sessions, count: sessions.length });
  } catch (error) {
    console.error('Error listing sessions:', error);
    res.status(500).json({ error: 'Failed to list sessions' });
  }
});

// 保存されたセッションファイルの内容を取得
router.get('/sessions/:filename', (req, res) => {
  const { filename } = req.params;

  // ファイル名の検証（セキュリティ対策）
  if (!filename.endsWith('.json') || filename.includes('..') || filename.includes('/')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  const dataDir = process.env.NODE_ENV === 'production'
    ? '/mnt/data/sessions'
    : path.join(__dirname, '../../data/sessions');

  try {
    const filePath = path.join(dataDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Session file not found' });
    }

    const data = fs.readFileSync(filePath, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading session file:', error);
    res.status(500).json({ error: 'Failed to read session file' });
  }
});

module.exports = router;
