const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// サービスアカウントキーが環境変数またはファイルから取得できない場合の処理
const serviceAccountPath = path.join(__dirname, '../config/firebase-key.json');
let serviceAccount;

// 環境変数からサービスアカウント情報を取得
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (e) {
    console.warn('⚠️ Could not parse FIREBASE_SERVICE_ACCOUNT env var');
  }
}

// ファイルから取得
if (!serviceAccount && fs.existsSync(serviceAccountPath)) {
  serviceAccount = require(serviceAccountPath);
}

// サービスアカウント情報がない場合は、プロジェクトIDから自動初期化
if (!serviceAccount) {
  console.log('📝 Initializing Firebase with projectId only');
  admin.initializeApp({
    projectId: 'fatigue-experiment-2025'
  });
} else {
  console.log('📝 Initializing Firebase with service account');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'fatigue-experiment-2025'
  });
}

const db = admin.firestore();

console.log('✅ Firebase initialized');

module.exports = { admin, db };
