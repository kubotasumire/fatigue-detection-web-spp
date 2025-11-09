/**
 * 計測指標計算エンジン (f1-f13)
 *
 * f1: 回転角速度の平均、標準偏差（時間窓ごと）
 * f2: 回転方向の変化頻度
 * f3: 静止時間の割合（閾値以下の回転が続く時間）
 * f4: 移動距離/時間=移動速度
 * f5: 移動の開始回数（静止→移動の遷移）
 * f6: クイズアイテムからの平均距離
 * f7: 位置の分散（空間内での行動範囲）
 * f8: 講義関連オブジェクトへの注視割合
 * f9: オブジェクト切り替え頻度
 * f10: 1オブジェクトあたりの平均注視時間
 * f11: 「空（何もない空間）」への注視時間（ぼんやり）
 * f12: 行動のバリエーション（エントロピー）=-Σ(p_i*log(p_i))
 * f13: インタラクション密度=（視線移動数+移動数+発話数）/時間
 */

class MetricsController {
  /**
   * セッションデータから全計測指標を計算
   * @param {Object} sessionData - セッションデータ
   * @returns {Object} 計測指標オブジェクト
   */
  calculateMetrics(sessionData) {
    const { sensorData, startTime, endTime } = sessionData;
    const duration = endTime - startTime;

    return {
      f1: this.calculateRotationalVelocity(sensorData),
      f2: this.calculateRotationDirectionChanges(sensorData),
      f3: this.calculateStationaryTime(sensorData),
      f4: this.calculateMovementVelocity(sensorData, duration),
      f5: this.calculateMovementStarts(sensorData),
      f6: this.calculateAverageDistanceFromQuiz(sensorData),
      f7: this.calculatePositionVariance(sensorData),
      f8: this.calculateGazeOnObjects(sensorData),
      f9: this.calculateObjectSwitchFrequency(sensorData),
      f10: this.calculateAverageGazeTimePerObject(sensorData),
      f11: this.calculateBlankSpaceGazeTime(sensorData),
      f12: this.calculateBehaviorEntropy(sensorData),
      f13: this.calculateInteractionDensity(sensorData, duration)
    };
  }

  /**
   * f1: 回転角速度の平均、標準偏差
   */
  calculateRotationalVelocity(sensorData) {
    if (sensorData.length < 2) return { mean: 0, stdDev: 0 };

    const velocities = [];
    for (let i = 1; i < sensorData.length; i++) {
      const prev = sensorData[i - 1].rotation;
      const curr = sensorData[i].rotation;
      const timeDelta = (sensorData[i].timestamp - sensorData[i - 1].timestamp) / 1000; // 秒

      if (timeDelta === 0) continue;

      const angleDelta = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
      );
      const velocity = angleDelta / timeDelta;
      velocities.push(velocity);
    }

    const mean = velocities.length > 0 ? velocities.reduce((a, b) => a + b) / velocities.length : 0;
    const stdDev = velocities.length > 1
      ? Math.sqrt(velocities.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / (velocities.length - 1))
      : 0;

    return { mean, stdDev };
  }

  /**
   * f2: 回転方向の変化頻度
   */
  calculateRotationDirectionChanges(sensorData) {
    let changes = 0;
    let prevDirection = null;

    for (let i = 1; i < sensorData.length; i++) {
      const prev = sensorData[i - 1].rotation;
      const curr = sensorData[i].rotation;

      const currDirection = {
        x: curr.x - prev.x,
        y: curr.y - prev.y
      };

      if (prevDirection) {
        // 方向が反転したかチェック
        if ((prevDirection.x * currDirection.x < 0) || (prevDirection.y * currDirection.y < 0)) {
          changes++;
        }
      }

      prevDirection = currDirection;
    }

    return changes;
  }

  /**
   * f3: 静止時間の割合（閾値以下の回転が続く時間）
   */
  calculateStationaryTime(sensorData, rotationThreshold = 0.1) {
    if (sensorData.length < 2) return 0;

    let stationaryTime = 0;
    const velocities = [];

    for (let i = 1; i < sensorData.length; i++) {
      const prev = sensorData[i - 1].rotation;
      const curr = sensorData[i].rotation;
      const timeDelta = sensorData[i].timestamp - sensorData[i - 1].timestamp;

      const angleDelta = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
      );

      if (angleDelta < rotationThreshold) {
        stationaryTime += timeDelta;
      }
    }

    const totalTime = sensorData[sensorData.length - 1].timestamp - sensorData[0].timestamp;
    return totalTime > 0 ? stationaryTime / totalTime : 0;
  }

  /**
   * f4: 移動速度（移動距離/時間）
   */
  calculateMovementVelocity(sensorData, duration) {
    if (sensorData.length < 2 || duration === 0) return 0;

    let totalDistance = 0;

    for (let i = 1; i < sensorData.length; i++) {
      const prev = sensorData[i - 1].position;
      const curr = sensorData[i].position;

      const distance = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
      );
      totalDistance += distance;
    }

    return totalDistance / (duration / 1000); // 秒単位
  }

  /**
   * f5: 移動の開始回数（静止→移動の遷移）
   */
  calculateMovementStarts(sensorData, movementThreshold = 1) {
    if (sensorData.length < 2) return 0;

    let starts = 0;
    let wasStationary = true;

    for (let i = 1; i < sensorData.length; i++) {
      const prev = sensorData[i - 1].position;
      const curr = sensorData[i].position;

      const distance = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
      );

      const isMoving = distance > movementThreshold;

      if (isMoving && wasStationary) {
        starts++;
      }

      wasStationary = !isMoving;
    }

    return starts;
  }

  /**
   * f6: クイズアイテムからの平均距離
   * TODO: クイズアイテムの位置情報をsensorDataに含める必要あり
   */
  calculateAverageDistanceFromQuiz(sensorData) {
    if (sensorData.length === 0) return 0;

    // TODO: クイズオブジェクトの位置を取得して計算
    return 0;
  }

  /**
   * f7: 位置の分散（空間内での行動範囲）
   */
  calculatePositionVariance(sensorData) {
    if (sensorData.length === 0) return 0;

    const positions = sensorData.map(d => d.position);
    const meanX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
    const meanY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;

    const variance = positions.reduce((sum, p) => {
      return sum + Math.pow(p.x - meanX, 2) + Math.pow(p.y - meanY, 2);
    }, 0) / positions.length;

    return variance;
  }

  /**
   * f8: 講義関連オブジェクトへの注視割合
   * TODO: gazeデータにobjectTypeフィールドを追加
   */
  calculateGazeOnObjects(sensorData) {
    if (sensorData.length === 0) return 0;

    const gazeOnObjects = sensorData.filter(d => d.gaze && d.gaze.object && d.gaze.object !== 'empty').length;
    return gazeOnObjects / sensorData.length;
  }

  /**
   * f9: オブジェクト切り替え頻度
   */
  calculateObjectSwitchFrequency(sensorData) {
    if (sensorData.length < 2) return 0;

    let switches = 0;
    let prevObject = sensorData[0].gaze?.object || null;

    for (let i = 1; i < sensorData.length; i++) {
      const currObject = sensorData[i].gaze?.object || null;

      if (prevObject !== currObject) {
        switches++;
      }

      prevObject = currObject;
    }

    return switches;
  }

  /**
   * f10: 1オブジェクトあたりの平均注視時間
   */
  calculateAverageGazeTimePerObject(sensorData) {
    if (sensorData.length === 0) return 0;

    const gazeByObject = {};
    let prevObject = null;
    let objectStartTime = sensorData[0].timestamp;

    for (let i = 0; i < sensorData.length; i++) {
      const currObject = sensorData[i].gaze?.object || null;

      if (currObject !== prevObject) {
        if (prevObject) {
          const duration = sensorData[i].timestamp - objectStartTime;
          gazeByObject[prevObject] = (gazeByObject[prevObject] || 0) + duration;
        }
        objectStartTime = sensorData[i].timestamp;
      }

      prevObject = currObject;
    }

    const objects = Object.values(gazeByObject);
    return objects.length > 0 ? objects.reduce((a, b) => a + b) / objects.length : 0;
  }

  /**
   * f11: 「空（何もない空間）」への注視時間（ぼんやり）
   */
  calculateBlankSpaceGazeTime(sensorData) {
    if (sensorData.length === 0) return 0;

    let blankTime = 0;
    let prevObject = null;
    let objectStartTime = sensorData[0].timestamp;

    for (let i = 1; i < sensorData.length; i++) {
      const currObject = sensorData[i].gaze?.object || null;

      if (currObject !== prevObject) {
        if (prevObject === 'empty' || prevObject === null) {
          blankTime += sensorData[i].timestamp - objectStartTime;
        }
        objectStartTime = sensorData[i].timestamp;
      }

      prevObject = currObject;
    }

    const totalTime = sensorData[sensorData.length - 1].timestamp - sensorData[0].timestamp;
    return totalTime > 0 ? blankTime / totalTime : 0;
  }

  /**
   * f12: 行動のバリエーション（エントロピー）
   */
  calculateBehaviorEntropy(sensorData) {
    if (sensorData.length === 0) return 0;

    // 行動を分類（position, rotation, gaze）
    const behaviors = {};
    let totalBehaviors = 0;

    sensorData.forEach(d => {
      const behavior = `pos:${Math.round(d.position.x)}-${Math.round(d.position.y)},rot:${Math.round(d.rotation.x)},gaze:${d.gaze?.object || 'empty'}`;
      behaviors[behavior] = (behaviors[behavior] || 0) + 1;
      totalBehaviors++;
    });

    // エントロピー計算: -Σ(p_i * log(p_i))
    let entropy = 0;
    Object.values(behaviors).forEach(count => {
      const p = count / totalBehaviors;
      entropy -= p * Math.log2(p);
    });

    return entropy;
  }

  /**
   * f13: インタラクション密度=（視線移動数+移動数+発話数）/時間
   */
  calculateInteractionDensity(sensorData, duration) {
    if (duration === 0) return 0;

    let gazeShifts = 0;
    let movements = 0;
    // 発話数はここでは0（音声入力がない）

    // 視線移動
    gazeShifts = this.calculateObjectSwitchFrequency(sensorData);

    // 移動
    movements = this.calculateMovementStarts(sensorData);

    const interactions = gazeShifts + movements;
    return interactions / (duration / 1000); // 秒単位
  }

  /**
   * 正答率を計算
   */
  calculateAccuracy(quizResponses) {
    if (quizResponses.length === 0) return 0;

    const correct = quizResponses.filter(r => r.isCorrect).length;
    return (correct / quizResponses.length) * 100;
  }
}

module.exports = new MetricsController();
