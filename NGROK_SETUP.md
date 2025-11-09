# ngrokを使った複数人でのデータ収集セットアップ

## 概要
このドキュメントでは、ngrokを使ってアプリケーションをインターネット経由で複数人に使ってもらう方法を説明します。

## セットアップ手順

### ステップ1: 環境変数の設定

フロントエンドが使用するAPI URLを設定するため、`.env`ファイルを編集します。

**ローカル開発時（localhost）:**
```
REACT_APP_API_BASE_URL=http://localhost:5001
```

**ngrok経由でアクセスする場合:**
```
REACT_APP_API_BASE_URL=https://YOUR_NGROK_URL
```

### ステップ2: バックエンドの起動

ターミナル1でバックエンドを起動します：
```bash
cd backend
npm start
# バックエンドがport 5001で起動
```

### ステップ3: ngrokでバックエンドをトンネル化

ターミナル2で、バックエンドをngrokで公開します：
```bash
ngrok http 5001
```

実行結果：
```
ngrok by @inconshrevable

Session Status                online
Account                       {your-account}
Version                        {version}
Region                        us (United States)
Forwarding                     https://abc123def45.ngrok.io -> http://localhost:5001
```

**重要**: `https://abc123def45.ngrok.io` のURLをメモしておきます。

### ステップ4: フロントエンドの.envを更新

フロントエンドの`.env`ファイルをngrok URLに更新します：
```
REACT_APP_API_BASE_URL=https://abc123def45.ngrok.io
```

### ステップ5: フロントエンドの起動（または再起動）

ターミナル3でフロントエンドを起動します：
```bash
cd frontend
npm start
# http://localhost:3000 で起動
```

**重要**: 既に起動している場合は、`.env`変更後に必ずサーバーを再起動してください。

### ステップ6: 複数人に共有

ngrok URLをリモートユーザーに教えます：
- ローカルアクセス（同じWifi内）: `http://localhost:3000`
- リモートアクセス（インターネット経由）: ngrokが提供するURL

例：
```
フロントエンド: https://frontend.yoursite.com または localhost:3000
バックエンド: ngrokで自動公開されたURL
```

## トラブルシューティング

###問題1: CORS エラーが出る

**原因**: バックエンドがngrokリクエストを受け入れていない

**解決策**: バックエンドの`server.js`でCORSを有効にします：
```javascript
const cors = require('cors');
app.use(cors({
  origin: '*', // すべてのオリジンを許可（テスト用）
  credentials: true
}));
```

### 問題2: データが保存されない

**確認項目**:
1. バックエンドが起動しているか: `curl http://localhost:5001/api/quiz/difficulty/easy`
2. ngrokが正しく転送しているか: ngrok dashboardで確認
3. フロントエンド の.envが正しいか確認

### 問題3: ngrokが時々切断される

**原因**: 無料版のngrokは一定時間で切断されることがあります

**解決策**:
- 有料版のngrokを使用（推奨）
- または再度ngrok httpコマンドで再接続

## データの確認

すべてのセッションデータは以下のディレクトリに保存されます：
```
backend/data/sessions/
```

各ユーザーのセッションデータはJSON形式で保存されます：
```
backend/data/sessions/2024-11-23_12-34-56_session-1_000.json
```

## ローカルネットワーク上での複数人テスト

同じWifi内での複数人テストの場合：

1. マシンのIPアドレスを確認:
```bash
ipconfig getifaddr en0  # macOS
hostname -I  # Linux
```

2. 複数人に共有:
```
http://YOUR_IP:3000
```

例: `http://192.168.1.100:3000`

このアプローチではngrokは不要ですが、バックエンドは`localhost:5001`で動作している必要があります。
