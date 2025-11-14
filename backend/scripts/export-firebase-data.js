/**
 * Firebaseからセッションデータを取得してローカルに保存するスクリプト
 *
 * 使用方法:
 * node backend/scripts/export-firebase-data.js [sessionId] [--all]
 *
 * 例:
 * - 全セッション取得: node backend/scripts/export-firebase-data.js --all
 * - 特定セッション取得: node backend/scripts/export-firebase-data.js session_1234567890_abc123
 */

const { db } = require('../utils/firebase');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../../data/sessions');

// ディレクトリが存在しない場合は作成
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`📁 Created directory: ${dataDir}`);
}

async function exportAllSessions() {
  try {
    console.log('📥 Fetching all sessions from Firebase...');
    const sessionsSnapshot = await db.collection('sessions')
      .orderBy('createdAt', 'desc')
      .get();

    console.log(`✅ Found ${sessionsSnapshot.size} sessions`);

    let savedCount = 0;

    for (const sessionDoc of sessionsSnapshot.docs) {
      const sessionId = sessionDoc.id;
      const sessionData = sessionDoc.data();

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

      // ファイルに保存
      const sessionFile = path.join(dataDir, `${sessionId}.json`);
      const exportData = {
        ...sessionData,
        sensorData,
        quizResponses
      };

      fs.writeFileSync(sessionFile, JSON.stringify(exportData, null, 2));
      console.log(`✅ Saved: ${sessionFile}`);
      savedCount++;
    }

    console.log(`\n✅ Successfully exported ${savedCount} sessions to ${dataDir}`);
  } catch (error) {
    console.error('❌ Error exporting sessions:', error);
    process.exit(1);
  }
}

async function exportSingleSession(sessionId) {
  try {
    console.log(`📥 Fetching session ${sessionId} from Firebase...`);

    const sessionDoc = await db.collection('sessions').doc(sessionId).get();

    if (!sessionDoc.exists) {
      console.error(`❌ Session not found: ${sessionId}`);
      process.exit(1);
    }

    const sessionData = sessionDoc.data();

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

    // ファイルに保存
    const sessionFile = path.join(dataDir, `${sessionId}.json`);
    const exportData = {
      ...sessionData,
      sensorData,
      quizResponses
    };

    fs.writeFileSync(sessionFile, JSON.stringify(exportData, null, 2));
    console.log(`✅ Saved: ${sessionFile}`);
    console.log(`📊 Data: ${sensorData.length} sensor records, ${quizResponses.length} quiz responses`);
  } catch (error) {
    console.error('❌ Error exporting session:', error);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('❌ Usage: node export-firebase-data.js [sessionId] [--all]');
    console.log('  Examples:');
    console.log('    node export-firebase-data.js --all');
    console.log('    node export-firebase-data.js session_1234567890_abc123');
    process.exit(1);
  }

  if (args.includes('--all')) {
    await exportAllSessions();
  } else {
    const sessionId = args[0];
    await exportSingleSession(sessionId);
  }

  process.exit(0);
}

main();
