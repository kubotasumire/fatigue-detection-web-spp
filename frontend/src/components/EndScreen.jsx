import React, { useState, useEffect } from 'react';
import { formatSessionDataToJST, formatToJST, generateJapaneseDatetimeFilename } from '../utils/dateFormatter';
import './EndScreen.css';

const EndScreen = ({ sessionData, difficulty, onRestart, apiBaseUrl }) => {
  const API_BASE_URL = apiBaseUrl !== undefined ? apiBaseUrl : 'http://localhost:5001';
  const [accuracy, setAccuracy] = useState(0);
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const calculateResults = async () => {
      try {
        console.log('=== EndScreen Data Debug ===');
        console.log('sessionData:', sessionData);
        console.log('quizResponses:', sessionData.quizResponses);
        console.log('quizResponses length:', sessionData.quizResponses?.length);

        // ローカルで正答率を計算
        const quizResponses = sessionData.quizResponses || [];
        const correctAnswers = quizResponses.filter(q => q.isCorrect).length;
        const totalQuestions = quizResponses.length;
        const calculatedAccuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

        setAccuracy(calculatedAccuracy);
        console.log(`Accuracy calculated: ${calculatedAccuracy.toFixed(1)}% (${correctAnswers}/${totalQuestions})`);

        // バックエンドから統計データを取得（内部用途のみ）
        try {
          const response = await fetch(`${API_BASE_URL}/api/results/calculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionData })
          });

          const data = await response.json();
          setMetrics(data.metrics);
          console.log('Metrics received:', data.metrics);
        } catch (metricsError) {
          console.warn('Could not fetch metrics from backend:', metricsError);
          // メトリクス取得失敗時も処理を続行
        }
      } catch (error) {
        console.error('Error calculating results:', error);
      } finally {
        setIsLoading(false);
      }
    };

    calculateResults();
  }, [sessionData]);

  const handleDownload = () => {
    // Save original startTime before formatting (it's a number)
    const originalStartTime = sessionData.startTime;
    // Format session data with JST timestamps
    const formattedData = formatSessionDataToJST(sessionData);
    const dataStr = JSON.stringify(formattedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    const filename = generateJapaneseDatetimeFilename(originalStartTime, sessionData.id);
    link.download = `${filename}.json`;
    link.click();
  };

  const handleDownloadCSV = () => {
    // CSVヘッダー
    const headers = ['timestamp', 'posX', 'posY', 'rotX', 'rotY', 'gazeX', 'gazeY', 'gazeObject'];

    // Save original startTime before formatting (it's a number)
    const originalStartTime = sessionData.startTime;
    // Format sensor data with JST timestamps
    const formattedData = formatSessionDataToJST(sessionData);

    const csvContent = [
      headers.join(','),
      ...formattedData.sensorData.map(d =>
        [
          d.timestamp,
          d.position.x,
          d.position.y,
          d.rotation.x,
          d.rotation.y,
          d.gaze.x,
          d.gaze.y,
          d.gaze.object
        ].join(',')
      )
    ].join('\n');

    const dataBlob = new Blob([csvContent], { type: 'text/csv; charset=utf-8;' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    const filename = generateJapaneseDatetimeFilename(originalStartTime, sessionData.id);
    link.download = `${filename}_sensor_data.csv`;
    link.click();
  };

  const getDifficultyLabel = () => {
    const labels = {
      easy: '低ストレス（簡単）',
      medium: '程よいストレス（中級）',
      hard: '高ストレス（難しい）'
    };
    return labels[difficulty] || difficulty;
  };

  return (
    <div className="end-screen">
      <div className="end-container">
        {isLoading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>結果を計算中...</p>
          </div>
        ) : (
          <>
            {/* タイトル */}
            <h1>ゲーム終了</h1>
            <p className="subtitle">お疲れ様でした!</p>

            {/* 結果サマリー */}
            <div className="results-summary">
              <div className="result-card">
                <div className="result-label">正答率</div>
                <div className="result-value">{accuracy.toFixed(1)}%</div>
                <div className="result-count">
                  ({sessionData.quizResponses.filter(q => q.isCorrect).length} / {sessionData.quizResponses.length})
                </div>
              </div>

              <div className="result-card">
                <div className="result-label">難易度</div>
                <div className="result-value">{getDifficultyLabel()}</div>
              </div>

              <div className="result-card">
                <div className="result-label">解いた問題数</div>
                <div className="result-value">{sessionData.quizResponses.length}</div>
              </div>
            </div>

            {/* 計測指標表示は削除済み - バックエンド側でデータ保存のみ実施 */}

            {/* ダウンロードボタン */}
            <div className="download-section">
              <h3>データをダウンロード</h3>
              <div className="button-group">
                <button className="download-button" onClick={handleDownload}>
                  セッションデータ (JSON)
                </button>
                <button className="download-button" onClick={handleDownloadCSV}>
                  センサーデータ (CSV)
                </button>
              </div>
            </div>

            {/* アクション */}
            <div className="action-buttons">
              <button className="restart-button" onClick={onRestart}>
                もう一度プレイ
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EndScreen;
