# Render へのデプロイガイド

このドキュメントでは、fatigue-detection-web-spp をRenderにデプロイして、複数ユーザーがリモートからアクセスできるようにセットアップします。

## 前提条件

- GitHub アカウント（リポジトリをプッシュ済み）
- Renderアカウント（https://render.com で無料登録）

## ステップ 1: GitHub リポジトリの準備

```bash
# リポジトリをGitHubにプッシュ（既に完了している場合はスキップ）
cd /path/to/fatigue-detection-web-spp
git remote add origin https://github.com/YOUR_USERNAME/fatigue-detection-web-spp.git
git push -u origin main
```

## ステップ 2: Renderでバックエンドをデプロイ

### 2.1 Renderダッシュボードにログイン
1. https://dashboard.render.com にアクセス
2. GitHub でサインイン

### 2.2 新しいサービスを作成
1. **New +** → **Web Service** をクリック
2. **GitHub** を選択
3. リポジトリを探して `fatigue-detection-web-spp` を選択

### 2.3 デプロイ設定
| 項目 | 値 |
|------|-----|
| **Name** | `fatigue-detection-backend` |
| **Runtime** | `Node` |
| **Build Command** | `cd backend && npm install` |
| **Start Command** | `cd backend && npm start` |

### 2.4 環境変数の設定
**Environment** セクションで以下を設定：

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5001` |

### 2.5 デプロイ
**Deploy** をクリック。約5分でデプロイ完了。

**バックエンドURL（メモしておく）**：
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

### 3.2 Renderで建立された後のフロントエンドURLに応じて、`build` コマンドを実行

---

## ステップ 4: Renderでフロントエンドをデプロイ

### 4.1 新しいサービスを作成
1. **New +** → **Static Site** をクリック
2. **GitHub** を選択
3. リポジトリ `fatigue-detection-web-spp` を選択

### 4.2 デプロイ設定
| 項目 | 値 |
|------|-----|
| **Name** | `fatigue-detection-frontend` |
| **Build Command** | `cd frontend && npm run build` |
| **Publish directory** | `frontend/build` |

### 4.3 デプロイ
**Deploy** をクリック。約3-5分でデプロイ完了。

**フロントエンドURL（メモしておく）**：
```
https://fatigue-detection-frontend.onrender.com
```

---

## ステップ 5: 複数ユーザーでアクセス確認

1. フロントエンドURL を複数デバイス/ブラウザで開く
2. 難易度を選択して「ゲーム開始」をクリック
3. データが正常に保存されることを確認

---

## トラブルシューティング

### バックエンドに接続できない場合

1. Render ダッシュボードで バックエンドサービスのログを確認
2. 以下を確認：
   - ✅ バックエンドがデプロイ完了状態か
   - ✅ フロントエンドの `.env.production` に正しいURL が入っているか
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

## 2週間後のクリーンアップ

データ収集完了後、Renderのサービスを削除して月々の費用を節約：

1. Render ダッシュボード → サービス選択
2. **Settings** → **Delete Service** をクリック

