const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../utils/database');
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
    // セッションをデータベースに保存
    db.run(
      `INSERT INTO sessions (id, difficulty, startTime, endTime, postFatigue)
       VALUES (?, ?, ?, ?, ?)`,
      [sessionId, session.difficulty, session.startTime, timestamp, session.postFatigue || null],
      (err) => {
        if (err) {
          console.error(`❌ Error inserting session:`, err);
          return res.status(500).json({ error: 'Failed to save session', details: err.message });
        }

        // センサーデータを保存
        const sensorInsertPromises = session.sensorData.map((data) => {
          return new Promise((resolve, reject) => {
            db.run(
              `INSERT INTO sensor_data
               (sessionId, timestamp, positionX, positionY, rotationX, rotationY, gazeX, gazeY, gazeObject, gazeInCenter)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                sessionId,
                data.timestamp,
                data.position?.x || null,
                data.position?.y || null,
                data.rotation?.x || null,
                data.rotation?.y || null,
                data.gaze?.x || null,
                data.gaze?.y || null,
                data.gaze?.object || null,
                data.gaze?.inCenter ? 1 : 0
              ],
              (err) => {
                if (err) {
                  console.error(`❌ Error inserting sensor data:`, err);
                  reject(err);
                } else {
                  resolve();
                }
              }
            );
          });
        });

        // クイズ回答を保存
        const quizInsertPromises = session.quizResponses.map((response) => {
          return new Promise((resolve, reject) => {
            db.run(
              `INSERT INTO quiz_responses (sessionId, quizId, selectedAnswer, isCorrect, timestamp)
               VALUES (?, ?, ?, ?, ?)`,
              [
                sessionId,
                response.quizId,
                response.selectedAnswer,
                response.isCorrect ? 1 : 0,
                response.timestamp
              ],
              (err) => {
                if (err) {
                  console.error(`❌ Error inserting quiz response:`, err);
                  reject(err);
                } else {
                  resolve();
                }
              }
            );
          });
        });

        Promise.all([...sensorInsertPromises, ...quizInsertPromises])
          .then(() => {
            console.log(`✅ Session saved to database: ${sessionId}`);
            console.log(`📊 Sensor data records: ${session.sensorData.length}, Quiz responses: ${session.quizResponses.length}`);
            res.json({ success: true, message: 'Session saved to database' });
          })
          .catch((error) => {
            console.error(`❌ Error saving session data:`, error);
            res.status(500).json({ error: 'Failed to save session data', details: error.message });
          });
      }
    );
  } catch (error) {
    console.error(`❌ Error in session end handler:`, error);
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

// 保存されたセッション一覧を取得（SQLiteから）
router.get('/sessions/list', (req, res) => {
  db.all(`SELECT id, difficulty, startTime, endTime, postFatigue, createdAt FROM sessions ORDER BY createdAt DESC`,
    (err, rows) => {
      if (err) {
        console.error('Error querying sessions:', err);
        return res.status(500).json({ error: 'Failed to list sessions' });
      }
      res.json({ sessions: rows || [], count: (rows || []).length });
    }
  );
});

// 特定のセッションデータを取得（SQLiteから）
router.get('/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  // セッション情報、センサーデータ、クイズ回答を取得
  db.get(
    `SELECT id, difficulty, startTime, endTime, postFatigue, createdAt FROM sessions WHERE id = ?`,
    [sessionId],
    (err, session) => {
      if (err) {
        console.error('Error querying session:', err);
        return res.status(500).json({ error: 'Failed to get session' });
      }

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // センサーデータを取得
      db.all(
        `SELECT * FROM sensor_data WHERE sessionId = ? ORDER BY timestamp ASC`,
        [sessionId],
        (err, sensorData) => {
          if (err) {
            console.error('Error querying sensor data:', err);
            return res.status(500).json({ error: 'Failed to get sensor data' });
          }

          // クイズ回答を取得
          db.all(
            `SELECT * FROM quiz_responses WHERE sessionId = ? ORDER BY timestamp ASC`,
            [sessionId],
            (err, quizResponses) => {
              if (err) {
                console.error('Error querying quiz responses:', err);
                return res.status(500).json({ error: 'Failed to get quiz responses' });
              }

              res.json({
                ...session,
                sensorData: sensorData || [],
                quizResponses: quizResponses || []
              });
            }
          );
        }
      );
    }
  );
});

module.exports = router;
