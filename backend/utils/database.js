const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Render環境では /mnt/data、ローカル開発環境では ./data を使用
const dataDir = process.env.NODE_ENV === 'production'
  ? '/mnt/data'
  : path.join(__dirname, '../../data');

// ディレクトリが存在しない場合は作成
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'sessions.db');

console.log(`📊 Database path: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
  } else {
    console.log('✅ Connected to SQLite database');
    initializeDatabase();
  }
});

// データベーステーブルを初期化
function initializeDatabase() {
  db.serialize(() => {
    // セッションテーブル
    db.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        difficulty TEXT,
        startTime INTEGER,
        endTime INTEGER,
        postFatigue INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('❌ Error creating sessions table:', err);
      } else {
        console.log('✅ Sessions table ready');
      }
    });

    // センサーデータテーブル
    db.run(`
      CREATE TABLE IF NOT EXISTS sensor_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sessionId TEXT,
        timestamp INTEGER,
        positionX REAL,
        positionY REAL,
        rotationX REAL,
        rotationY REAL,
        gazeX REAL,
        gazeY REAL,
        gazeObject TEXT,
        gazeInCenter BOOLEAN,
        FOREIGN KEY (sessionId) REFERENCES sessions(id)
      )
    `, (err) => {
      if (err) {
        console.error('❌ Error creating sensor_data table:', err);
      } else {
        console.log('✅ Sensor data table ready');
      }
    });

    // クイズ回答テーブル
    db.run(`
      CREATE TABLE IF NOT EXISTS quiz_responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sessionId TEXT,
        quizId TEXT,
        selectedAnswer TEXT,
        isCorrect BOOLEAN,
        timestamp INTEGER,
        FOREIGN KEY (sessionId) REFERENCES sessions(id)
      )
    `, (err) => {
      if (err) {
        console.error('❌ Error creating quiz_responses table:', err);
      } else {
        console.log('✅ Quiz responses table ready');
      }
    });
  });
}

module.exports = db;
