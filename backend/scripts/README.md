# Firebase Data Export Scripts

## export-firebase-data.js

Firebaseから保存されたセッションデータを取得してローカルに落とし込むスクリプト。

### 前提条件

- Firebase Admin SDKが初期化されている
- サービスアカウント認証情報が設定されている（環境変数または `config/firebase-key.json`）

### 使用方法

**全セッションを取得:**
```bash
cd backend
node scripts/export-firebase-data.js --all
```

**特定のセッションのみ取得:**
```bash
node scripts/export-firebase-data.js session_1234567890_abc123
```

### 出力

データは `data/sessions/` ディレクトリに以下の形式で保存されます：

```
data/sessions/
  ├── session_1234567890_abc123.json
  ├── session_1234567890_def456.json
  └── ...
```

各ファイルには以下のデータが含まれます：
- セッション情報（difficulty, startTime, endTime, postFatigue など）
- センサーデータ配列（position, rotation, gaze データ）
- クイズ回答配列（quizId, selectedAnswer, isCorrect など）

### 例

```bash
# 全セッションを取得
$ node scripts/export-firebase-data.js --all
📥 Fetching all sessions from Firebase...
✅ Found 5 sessions
✅ Saved: /path/to/data/sessions/session_xxxx.json
✅ Saved: /path/to/data/sessions/session_yyyy.json
...
✅ Successfully exported 5 sessions
```
