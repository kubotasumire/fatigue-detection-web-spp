# セットアップガイド

3D Web学習環境の疲労感検出アプリケーションをセットアップするための手順です。

## システム要件

- Node.js 14.0以上
- npm 6.0以上
- モダンブラウザ（Chrome, Firefox, Safari, Edge）

## インストール手順

### 1. 依存パッケージのインストール

#### バックエンド
```bash
cd backend
npm install
```

#### フロントエンド
```bash
cd frontend
npm install
```

## 実行方法

### 方法1: 別ターミナルで実行

**ターミナル1: バックエンドサーバー起動**
```bash
cd backend
npm start
```
出力: `Server is running on port 5000`

**ターミナル2: フロントエンド開発サーバー起動**
```bash
cd frontend
npm start
```
ブラウザが自動的に `http://localhost:3000` で開きます

### 方法2: スクリプト実行

以下のスクリプトを実行してください（ルートディレクトリから）

**Linux/Mac:**
```bash
./start-dev.sh
```

**Windows:**
```cmd
start-dev.bat
```

## 初回起動時の確認

1. **バックエンド健全性確認**
   ```bash
   curl http://localhost:5000/api/health
   ```
   応答: `{"status":"ok"}`

2. **クイズデータ確認**
   ```bash
   curl http://localhost:5000/api/quiz/difficulty/easy
   ```
   5個のクイズが返される

3. **フロントエンド確認**
   - `http://localhost:3000` でスタート画面が表示される
   - 難易度選択ボタンが3つ表示される

## トラブルシューティング

### ポートが既に使用されている

**バックエンド（5000番ポート）**
```bash
# 使用中のプロセスを確認
lsof -i :5000
# 必要に応じてプロセスを終了
kill -9 <PID>
```

または `.env` を修正
```
PORT=5001  # 別のポート番号
```

**フロントエンド（3000番ポート）**
```bash
DANGEROUSLY_EXPOSE_PORT=3001 npm start
```

### CORS エラー

バックエンドが `localhost:5000` で実行中であることを確認してください。

フロントエンド側の API URL が正しいか確認：
- `frontend/src/components/GameScene.jsx`
- `frontend/src/utils/dataCollector.js`
- `frontend/src/components/EndScreen.jsx`

### Three.js が読み込まれない

```bash
cd frontend
npm install three@r128 --save
```

### モジュールが見つからない

```bash
# キャッシュをクリアして再インストール
cd backend && rm -rf node_modules && npm install
cd frontend && rm -rf node_modules && npm install
```

## 開発時のファイル構成確認

```
test-h/
├── backend/
│   ├── node_modules/
│   ├── routes/
│   ├── controllers/
│   ├── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── node_modules/
│   ├── public/
│   ├── src/
│   └── package.json
└── data/
    └── sessions/  # セッションデータが保存される
```

## ログ確認

### バックエンド ログ
バックエンド起動時に以下が表示される：
```
Server is running on port 5000
```

### フロントエンド ログ
ブラウザのコンソール（F12キー）でデバッグ情報を確認

### セッションデータ保存確認
```bash
ls -la data/sessions/
# 形式: session_<timestamp>_<random>.json
```

## パフォーマンス最適化

### フロントエンド
```bash
cd frontend
npm run build
```
本番向けの最適化ビルドが `frontend/build/` に生成されます

## ポート設定変更

### バックエンド
`backend/.env`:
```
PORT=5000
```

### フロントエンド
React開発サーバーのポート変更は環境変数で制御：
```bash
PORT=3001 npm start
```

## データ永続化

現在のシステムはメモリ + JSON ファイル保存を使用しています。

本番環境では `backend/routes/data.js` を以下に修正してください：
- MongoDB 接続
- SQLite3 連携
- その他の永続化ストレージ

## API仕様確認

すべてのAPI仕様は `README.md` を参照してください

## 次のステップ

1. クイズデータをカスタマイズ（`backend/routes/quiz.js`）
2. 実験パラメータを調整（制限時間、問題数）
3. データ分析スクリプトを作成
4. 被験者管理機能の追加

## サポート

問題が発生した場合は、以下を確認してください：

1. Node.js バージョン: `node -v`
2. npm バージョン: `npm -v`
3. ブラウザコンソールのエラーメッセージ
4. バックエンドサーバーのログ

## ライセンス

MIT License
