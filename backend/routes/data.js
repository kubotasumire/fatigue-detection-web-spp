const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { db } = require('../utils/firebase');
const { formatSessionDataToJST } = require('../utils/dateFormatter');

// セッションデータをメモリに保存（セッション中のデータ）
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
router.post('/session/end', async (req, res) => {
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
    // セッションをFirestoreに保存
    await db.collection('sessions').doc(sessionId).set({
      id: sessionId,
      difficulty: session.difficulty,
      startTime: session.startTime,
      endTime: timestamp,
      postFatigue: session.postFatigue || null,
      sensorDataCount: session.sensorData.length,
      quizResponsesCount: session.quizResponses.length,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`✅ Session saved to Firestore: ${sessionId}`);

    // センサーデータを保存
    for (const data of session.sensorData) {
      await db.collection('sessions').doc(sessionId).collection('sensorData').add({
        timestamp: data.timestamp,
        positionX: data.position?.x || null,
        positionY: data.position?.y || null,
        rotationX: data.rotation?.x || null,
        rotationY: data.rotation?.y || null,
        gazeX: data.gaze?.x || null,
        gazeY: data.gaze?.y || null,
        gazeObject: data.gaze?.object || null,
        gazeInCenter: data.gaze?.inCenter || false
      });
    }

    console.log(`✅ Sensor data saved: ${session.sensorData.length} records`);

    // クイズ回答を保存
    for (const response of session.quizResponses) {
      await db.collection('sessions').doc(sessionId).collection('quizResponses').add({
        quizId: response.quizId,
        selectedAnswer: response.selectedAnswer,
        isCorrect: response.isCorrect,
        timestamp: response.timestamp
      });
    }

    console.log(`✅ Quiz responses saved: ${session.quizResponses.length} records`);

    res.json({ success: true, message: 'Session saved to Firebase' });
  } catch (error) {
    console.error(`❌ Error saving session to Firebase:`, error);
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

// 保存されたセッション一覧を取得（Firebaseから）
router.get('/sessions/list', async (req, res) => {
  try {
    const sessionsSnapshot = await db.collection('sessions')
      .orderBy('createdAt', 'desc')
      .get();

    const sessions = [];
    sessionsSnapshot.forEach(doc => {
      sessions.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({ sessions, count: sessions.length });
  } catch (error) {
    console.error('Error listing sessions:', error);
    res.status(500).json({ error: 'Failed to list sessions', details: error.message });
  }
});

// 特定のセッションデータを取得（Firebaseから）
router.get('/sessions/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  try {
    // セッション情報を取得
    const sessionDoc = await db.collection('sessions').doc(sessionId).get();

    if (!sessionDoc.exists) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const sessionData = {
      id: sessionDoc.id,
      ...sessionDoc.data()
    };

    // センサーデータを取得
    const sensorSnapshot = await db.collection('sessions')
      .doc(sessionId)
      .collection('sensorData')
      .orderBy('timestamp', 'asc')
      .get();

    const sensorData = [];
    sensorSnapshot.forEach(doc => {
      sensorData.push(doc.data());
    });

    // クイズ回答を取得
    const quizSnapshot = await db.collection('sessions')
      .doc(sessionId)
      .collection('quizResponses')
      .orderBy('timestamp', 'asc')
      .get();

    const quizResponses = [];
    quizSnapshot.forEach(doc => {
      quizResponses.push(doc.data());
    });

    res.json({
      ...sessionData,
      sensorData,
      quizResponses
    });
  } catch (error) {
    console.error('Error retrieving session:', error);
    res.status(500).json({ error: 'Failed to retrieve session', details: error.message });
  }
});

module.exports = router;
