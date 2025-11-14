/**
 * リアルタイムセンサーデータ収集
 * position, rotation, gazeをキャプチャしてバックエンドに送信
 */

class DataCollector {
  constructor(sessionId, apiBaseUrl = 'http://localhost:5001') {
    this.sessionId = sessionId;
    this.apiBaseUrl = apiBaseUrl;
    this.isCollecting = false;
    this.lastMousePos = { x: 0, y: 0 };
    this.lastRotation = { x: 0, y: 0 };
    this.startTime = Date.now();

    // データバッチ処理（効率化のため複数データをまとめて送信）
    this.dataBatch = [];
    this.batchSize = 10; // 10フレーム毎に送信
    this.sendInterval = null;
  }

  /**
   * データ収集を開始
   */
  start() {
    this.isCollecting = true;
    this.startTime = Date.now();

    // マウス移動トラッキング
    this.mouseMoveHandler = this.handleMouseMove.bind(this);
    document.addEventListener('mousemove', this.mouseMoveHandler);

    // フレーム毎のデータ収集（マウス移動がない時も記録）
    this.frameInterval = setInterval(() => {
      this.collectFrameData();
    }, 50); // 50ms毎（約20fps）でフレームデータ採集

    // 定期的にデータを送信
    this.sendInterval = setInterval(() => {
      this.flushBatch();
    }, 100); // 100msごとにバッチ送信

    console.log('🎬 DataCollector started - collecting position, rotation, gaze data every 50ms');
  }

  /**
   * データ収集を停止
   */
  stop() {
    this.isCollecting = false;

    // イベントリスナーを削除
    if (this.mouseMoveHandler) {
      document.removeEventListener('mousemove', this.mouseMoveHandler);
    }

    // インターバルをクリア
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
    }

    if (this.sendInterval) {
      clearInterval(this.sendInterval);
    }

    // 残っているデータを送信
    this.flushBatch();

    console.log('🛑 DataCollector stopped - all intervals cleared');
  }

  /**
   * マウス移動イベント処理
   */
  handleMouseMove(event) {
    if (!this.isCollecting) return;

    const timestamp = Date.now();

    // ウィンドウサイズを基準に正規化
    const normalizedX = (event.clientX / window.innerWidth) * 2 - 1;
    const normalizedY = -(event.clientY / window.innerHeight) * 2 + 1;

    // rotation: マウス移動量から計算
    // カメラの回転角度を推定
    const rotationDelta = {
      x: (normalizedY - this.lastRotation.y) * 0.01, // Y軸周り回転
      y: (normalizedX - this.lastRotation.x) * 0.01   // X軸周り回転
    };

    this.lastRotation.x = normalizedX;
    this.lastRotation.y = normalizedY;

    // センサーデータを収集
    const sensorData = {
      timestamp,
      position: {
        x: event.clientX,
        y: event.clientY
      },
      rotation: {
        x: rotationDelta.x,
        y: rotationDelta.y
      },
      gaze: this.detectGaze(event.clientX, event.clientY)
    };

    this.dataBatch.push(sensorData);

    // バッチが満杯なら送信
    if (this.dataBatch.length >= this.batchSize) {
      this.flushBatch();
    }
  }

  /**
   * フレーム毎の定期的なデータ収集（マウス移動がない時も）
   */
  collectFrameData() {
    if (!this.isCollecting) return;

    const timestamp = Date.now();

    // 最後のマウス位置を使用してセンサーデータを記録
    const sensorData = {
      timestamp,
      position: {
        x: this.lastMousePos.x,
        y: this.lastMousePos.y
      },
      rotation: {
        x: this.lastRotation.x,
        y: this.lastRotation.y
      },
      gaze: this.detectGaze(this.lastMousePos.x, this.lastMousePos.y)
    };

    this.dataBatch.push(sensorData);

    // バッチが満杯なら送信
    if (this.dataBatch.length >= this.batchSize) {
      this.flushBatch();
    }
  }

  /**
   * Gaze検出：スクリーン中央の範囲をチェック
   * Mac 13インチを基準に実装
   */
  detectGaze(x, y) {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // 中央領域を定義（例：中央±200px）
    const gazeRadius = 200;
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < gazeRadius) {
      // 中央付近 → オブジェクト検出処理（TODO）
      return {
        x: x,
        y: y,
        object: this.getGazeObject(x, y),
        inCenter: true
      };
    } else {
      return {
        x: x,
        y: y,
        object: 'empty',
        inCenter: false
      };
    }
  }

  /**
   * マウス位置から対応するオブジェクトを判定
   * TODO: 3D空間のレイキャスティング結果を使用
   */
  getGazeObject(x, y) {
    // TODO: Three.jsのレイキャスター使用して、3D空間のどのオブジェクトを見ているか判定
    // 一時的には'empty'を返す
    return 'empty';
  }

  /**
   * バッチデータをバックエンドに送信
   */
  flushBatch() {
    if (this.dataBatch.length === 0) return;

    const batch = [...this.dataBatch];
    this.dataBatch = [];

    console.log(`📤 Flushing ${batch.length} sensor data records to backend`, {
      sessionId: this.sessionId,
      apiBaseUrl: this.apiBaseUrl,
      sampleData: batch[0]
    });

    batch.forEach(data => {
      this.sendSensorData(data);
    });
  }

  /**
   * 単一のセンサーデータをバックエンドに送信
   */
  async sendSensorData(data) {
    try {
      const url = `${this.apiBaseUrl}/api/data/sensor`;
      const body = JSON.stringify({
        sessionId: this.sessionId,
        data
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });

      if (!response.ok) {
        // 404 エラーはセッション未初期化の一時的な状態なので無視
        if (response.status === 404) {
          console.debug(`⏳ Session not yet initialized (404) - will retry on next flush`);
          return; // サイレント無視
        }
        console.warn(`❌ Sensor data send failed: ${response.status} ${response.statusText}`, {
          sessionId: this.sessionId,
          url,
          apiBaseUrl: this.apiBaseUrl,
          dataType: data?.timestamp ? 'valid' : 'invalid'
        });
      } else {
        console.debug(`✅ Sensor data sent successfully`, {
          position: data?.position,
          timestamp: data?.timestamp
        });
      }
    } catch (error) {
      // ネットワークエラーのみログ出力
      console.error('❌ Error sending sensor data:', error);
    }
  }

  /**
   * クイズ回答を記録
   */
  async recordQuizResponse(quizId, selectedAnswer, isCorrect) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/data/quiz-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          quizId,
          selectedAnswer,
          isCorrect,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        console.warn(`Quiz response recording failed: ${response.status} ${response.statusText}`, {
          sessionId: this.sessionId,
          quizId,
          url: `${this.apiBaseUrl}/api/data/quiz-response`
        });
      }
    } catch (error) {
      console.error('Error recording quiz response:', error);
    }
  }
}

export default DataCollector;
