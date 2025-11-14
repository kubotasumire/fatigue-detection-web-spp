const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { formatSessionDataToJST } = require('../utils/dateFormatter');

// セッションデータをメモリに保存（セッション中のデータ）
const sessions = new Map();

// データ保存ディレクトリ
const dataDir = path.join(__dirname, '../../data/sessions');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`📁 Created data directory: ${dataDir}`);
}

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

  try {
    // セッションデータをローカルファイルに保存
    const formattedSessionData = formatSessionDataToJST(session);
    const sessionFile = path.join(dataDir, `${sessionId}.json`);
    fs.writeFileSync(sessionFile, JSON.stringify(formattedSessionData, null, 2));

    console.log(`✅ Session saved to file: ${sessionFile}`);
    console.log(`📊 Sensor data records: ${session.sensorData.length}, Quiz responses: ${session.quizResponses.length}`);

    res.json({ success: true, message: 'Session saved to local file' });
  } catch (error) {
    console.error(`❌ Error saving session:`, error);
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

// 保存されたセッション一覧を取得（ローカルファイルから）
router.get('/sessions/list', (req, res) => {
  try {
    if (!fs.existsSync(dataDir)) {
      return res.json({ sessions: [], count: 0 });
    }

    const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));
    const sessionsList = files.map(file => {
      const filePath = path.join(dataDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return {
        id: file.replace('.json', ''),
        difficulty: data.difficulty,
        startTime: data.startTime,
        endTime: data.endTime,
        postFatigue: data.postFatigue
      };
    }).sort((a, b) => b.startTime - a.startTime);

    res.json({ sessions: sessionsList, count: sessionsList.length });
  } catch (error) {
    console.error('Error listing sessions:', error);
    res.status(500).json({ error: 'Failed to list sessions', details: error.message });
  }
});

// 特定のセッションデータを取得（ローカルファイルから）
router.get('/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  try {
    const sessionFile = path.join(dataDir, `${sessionId}.json`);

    if (!fs.existsSync(sessionFile)) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const data = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
    res.json(data);
  } catch (error) {
    console.error('Error retrieving session:', error);
    res.status(500).json({ error: 'Failed to retrieve session', details: error.message });
  }
});

module.exports = router;
