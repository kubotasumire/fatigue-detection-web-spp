# 3D Web学習環境 - 疲労感検出アプリケーション

Web学習環境における「疲労感」の検出とその指標作成を目的とした3DWeb実験アプリケーション。

## プロジェクト概要

### 目的
Web学習環境での被験者の疲労感を、リアルタイムセンサーデータ（position, rotation, gaze）から検出し、その指標を作成する。

### 実験設計
3つの難易度レベルでストレス条件を設定：

- **低ストレス（簡単）**: 簡単な問題が5問のみ（制限時間5分）
- **程よいストレス（中級）**: ある程度難しい問題で7問（制限時間10分）
- **高ストレス（難しい）**: 難しい問題が約20問（制限時間20分）

### 計測指標（f1-f13）

| 指標 | 説明 |
|------|------|
| f1 | 回転角速度の平均、標準偏差（時間窓ごと） |
| f2 | 回転方向の変化頻度 |
| f3 | 静止時間の割合（閾値以下の回転が続く時間） |
| f4 | 移動速度（移動距離/時間） |
| f5 | 移動の開始回数（静止→移動の遷移） |
| f6 | クイズアイテムからの平均距離 |
| f7 | 位置の分散（空間内での行動範囲） |
| f8 | 講義関連オブジェクトへの注視割合 |
| f9 | オブジェクト切り替え頻度 |
| f10 | 1オブジェクトあたりの平均注視時間 |
| f11 | 「空」への注視時間（ぼんやり） |
| f12 | 行動のバリエーション（エントロピー） |
| f13 | インタラクション密度 |

## プロジェクト構成

```
fatigue-detection-web-app/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── StartScreen.jsx          # スタート画面・難易度選択
│   │   │   ├── GameScene.jsx            # 3D空間メインゲーム
│   │   │   ├── QuizBooth.jsx            # クイズポップアップ
│   │   │   └── EndScreen.jsx            # 終了画面・結果表示
│   │   ├── utils/
│   │   │   └── dataCollector.js         # センサーデータ収集
│   │   ├── hooks/
│   │   │   ├── useThreeScene.js         # Three.js シーン管理
│   │   │   └── useGameTimer.js          # ゲームタイマー管理
│   │   ├── App.jsx                      # メインアプリケーション
│   │   └── index.js
│   ├── public/
│   │   └── index.html
│   └── package.json
│
├── backend/
│   ├── routes/
│   │   ├── quiz.js                      # クイズAPI
│   │   ├── data.js                      # センサーデータAPI
│   │   └── results.js                   # 結果計算API
│   ├── controllers/
│   │   └── metricsController.js         # 計測指標計算エンジン
│   ├── server.js                        # Express サーバー
│   ├── .env
│   └── package.json
│
├── data/
│   └── sessions/                        # セッションデータ保存
│
└── README.md
```

## セットアップ手順

### バックエンドのセットアップ

```bash
cd backend
npm install
npm start
```

サーバーは `http://localhost:5000` で起動します。

### フロントエンドのセットアップ

```bash
cd frontend
npm install
npm start
```

アプリケーションは `http://localhost:3000` で起動します。

## クイズデータの挿入

`backend/routes/quiz.js` の `quizzes` オブジェクトにクイズデータを挿入してください。

### フォーマット

```javascript
const quizzes = {
  easy: [
    {
      id: 1,
      question: "問題文",
      options: ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
      correctAnswer: 0  // インデックス（0-3）
    },
    // ... 5問まで
  ],
  medium: [
    // ... 7問
  ],
  hard: [
    // ... 20問
  ]
};
```

## 機能詳細

### データ収集

#### Position / Rotation
- マウスの動きをリアルタイムで追跡
- 正規化座標として記録
- フレームごとにバックエンドに送信

#### Gaze（視線追跡）
- スクリーン中央の範囲（±200px）を監視
- 中央領域内のオブジェクトを検出
- オブジェクト変化時に記録

### ゲームフロー

1. **スタート画面**: 難易度選択
2. **ゲームシーン**:
   - 3D空間にクイズブースが円形に配置
   - ブースをクリックしてクイズ表示
   - クイズ回答・送信
   - ブースが消える（解いたクイズとマーク）
3. **終了条件**:
   - すべてのクイズを解く
   - 制限時間終了 → 未解答は不正解でカウント
4. **終了画面**:
   - 正答率表示
   - 計測指標表示
   - データダウンロード（JSON/CSV）

### データ保存

- **セッションデータ**: `data/sessions/{sessionId}.json`
  - クイズ回答記録
  - センサーデータ（timestamp付き）
  - セッション情報

- **エクスポート形式**:
  - JSON: フル形式でダウンロード
  - CSV: センサーデータのみテーブル形式

## API エンドポイント

### Quiz API

- `GET /api/quiz/difficulty/:difficulty` - 難易度別クイズ取得
- `POST /api/quiz/verify` - 回答検証

### Data API

- `POST /api/data/session/start` - セッション開始
- `POST /api/data/sensor` - センサーデータ送信
- `POST /api/data/quiz-response` - クイズ回答記録
- `POST /api/data/session/end` - セッション終了
- `GET /api/data/session/:sessionId` - セッションデータ取得

### Results API

- `POST /api/results/calculate` - 計測指標計算

## 技術スタック

### フロントエンド
- React 18
- Three.js（r128）
- CSS3 Animations

### バックエンド
- Node.js
- Express
- CORS対応

## ブラウザ互換性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 今後の拡張機能

- [ ] MongoDB/SQLiteでの永続化
- [ ] 複数被験者管理システム
- [ ] リアルタイムgaze検出（WebRTC）
- [ ] データ分析ダッシュボード
- [ ] 音声入力対応
- [ ] VR対応

## 注意事項

- クイズデータは `backend/routes/quiz.js` で手動挿入が必要
- 現在のgaze検出はマウス中央範囲判定のため、高精度な視線追跡には別途デバイスが必要
- バックエンドとフロントエンド両方が実行中である必要があります

## ライセンス

MIT License
