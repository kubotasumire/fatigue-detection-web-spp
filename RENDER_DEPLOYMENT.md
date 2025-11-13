# Render へのデプロイガイド

このドキュメントでは、fatigue-detection-web-spp を Render にデプロイして、複数ユーザーがリモートからアクセスできるようにセットアップします。

## 前提条件

- GitHub アカウント（リポジトリをプッシュ済み）
- Render アカウント（https://render.com で無料登録）

## ステップ 1: GitHub リポジトリの準備

```bash
# リポジトリをGitHubにプッシュ（既に完了している場合はスキップ）
cd /path/to/fatigue-detection-web-spp
git remote add origin https://github.com/YOUR_USERNAME/fatigue-detection-web-spp.git
git push -u origin main
```

## ステップ 2: Render でバックエンドをデプロイ

### 2.1 Render ダッシュボードにログイン

1. https://dashboard.render.com にアクセス
2. GitHub でサインイン

### 2.2 新しいサービスを作成

1. **New +** → **Web Service** をクリック
2. **GitHub** を選択
3. リポジトリを探して `fatigue-detection-web-spp` を選択

### 2.3 デプロイ設定

| 項目              | 値                          |
| ----------------- | --------------------------- |
| **Name**          | `fatigue-detection-backend` |
| **Runtime**       | `Node`                      |
| **Build Command** | `cd backend && npm install` |
| **Start Command** | `cd backend && npm start`   |

### 2.4 環境変数の設定

**Environment** セクションで以下を設定：

| Key        | Value        |
| ---------- | ------------ |
| `NODE_ENV` | `production` |
| `PORT`     | `5001`       |

### 2.5 デプロイ

**Deploy** をクリック。約 5 分でデプロイ完了。

**バックエンド URL（メモしておく）**：

```
https://fatigue-detection-backend.onrender.com
```

---

## ステップ 3: フロントエンド用の環境設定

### 3.1 `.env.production` ファイルを作成

`frontend/.env.production` を作成：

```env
REACT_APP_API_BASE_URL=https://fatigue-detection-backend.onrender.com
```

### 3.2 Render で建立された後のフロントエンド URL に応じて、`build` コマンドを実行

---

## ステップ 4: Render でフロントエンドをデプロイ

### 4.1 新しいサービスを作成

1. **New +** → **Static Site** をクリック
2. **GitHub** を選択
3. リポジトリ `fatigue-detection-web-spp` を選択

### 4.2 デプロイ設定

| 項目                  | 値                             |
| --------------------- | ------------------------------ |
| **Name**              | `fatigue-detection-frontend`   |
| **Build Command**     | `cd frontend && npm run build` |
| **Publish directory** | `frontend/build`               |

### 4.3 デプロイ

**Deploy** をクリック。約 3-5 分でデプロイ完了。

**フロントエンド URL（メモしておく）**：

```
https://fatigue-detection-frontend.onrender.com
```

---

## ステップ 5: 複数ユーザーでアクセス確認

1. フロントエンド URL を複数デバイス/ブラウザで開く
2. 難易度を選択して「ゲーム開始」をクリック
3. データが正常に保存されることを確認

---

## トラブルシューティング

### バックエンドに接続できない場合

1. Render ダッシュボードで バックエンドサービスのログを確認
2. 以下を確認：
   - ✅ バックエンドがデプロイ完了状態か
   - ✅ フロントエンドの `.env.production` に正しい URL が入っているか
   - ✅ CORS が有効か（`server.js` で確認）

### フロントエンドが見つからない場合

```bash
# ローカルでビルドテスト
cd frontend
npm run build
```

### データが保存されない場合

1. バックエンド ログを確認
2. `backend/data/sessions/` ディレクトリの権限を確認

---

## 2 週間後のクリーンアップ

データ収集完了後、Render のサービスを削除して月々の費用を節約：

1. Render ダッシュボード → サービス選択
2. **Settings** → **Delete Service** をクリック
