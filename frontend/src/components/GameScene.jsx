import React, { useEffect, useRef, useState } from 'react';
import { useGameTimer } from '../hooks/useGameTimer';
import DataCollector from '../utils/dataCollector';
import QuizBooth from './QuizBooth';
import './GameScene.css';

const GameScene = ({ difficulty, sessionId, onGameEnd, onTimeUp, onQuizResponse, onQuizAttempt, quizResponses, attemptedQuizzes, apiBaseUrl, sessionDataRef }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const API_BASE_URL = apiBaseUrl !== undefined ? apiBaseUrl : 'http://localhost:5001';

  // タイムアップ時の処理
  const handleTimeUp = () => {
    console.log('⏰ Time is up! Marking unanswered quizzes as incorrect');

    // 未回答の問題をすべて不正解としてマークする
    quizzes.forEach(quiz => {
      const isAnswered = quizResponses?.find(r => r.quizId === quiz.id);
      if (!isAnswered) {
        // 未回答の問題を不正解としてカウント
        if (onQuizResponse) {
          onQuizResponse(quiz.id, false);
        }
      }
    });

    // ゲーム終了
    if (onGameEnd) {
      onGameEnd({ reason: 'timeUp' });
    }

    if (onTimeUp) {
      onTimeUp();
    }
  };

  const { formattedTime, remainingTime } = useGameTimer(difficulty, handleTimeUp);
  const dataCollectorRef = useRef(null);
  const quizBoothsRef = useRef([]);
  const activeQuizRef = useRef(null);

  const [quizzes, setQuizzes] = useState([]);
  const [solvedQuizzes, setSolvedQuizzes] = useState(new Set());
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Canvas 初期化
  useEffect(() => {
    if (!containerRef.current) return;

    // 既存の canvas があれば削除
    const existingCanvas = containerRef.current.querySelector('canvas');
    if (existingCanvas) {
      existingCanvas.remove();
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';

    containerRef.current.appendChild(canvas);
    canvasRef.current = canvas;

    // クリックを確実に受け取るため
    canvas.style.cursor = 'pointer';

    console.log('🎨 Canvas initialized:', { width, height });
    setIsInitialized(true);
  }, []);

  // クイズデータ取得
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/quiz/difficulty/${difficulty}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log(`Loaded ${data.quizzes?.length || 0} quizzes for difficulty: ${difficulty}`);
        setQuizzes(data.quizzes || []);
      } catch (error) {
        console.error('Failed to fetch quizzes:', error);
        setQuizzes([]);
      }
    };

    if (difficulty) {
      fetchQuizzes();
    }
  }, [difficulty]);

  // 星形を描画するヘルパー関数
  const drawStar = (ctx, x, y, size, fillColor, strokeColor, quizId) => {
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3;

    const starSize = size / 2;
    const points = 5;
    const innerRadius = starSize * 0.4;
    const outerRadius = starSize;

    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;

      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // クイズ番号を描画（星の中央に）
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(quizId, x, y);
  };

  // Canvas レンダリング
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // 背景色 - 星が映える優しい青色
    ctx.fillStyle = '#E8F4F8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // グリッド描画（最適化版 - 80pxごと、淡い色）
    ctx.strokeStyle = 'rgba(100, 180, 220, 0.2)';
    ctx.lineWidth = 0.8;
    const gridSize = 80;
    for (let i = 0; i < canvas.width; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // クイズブースを描画（円周上に配置、番号はランダム）
    if (quizzes.length > 0) {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) / 3;
      const boothSize = 80;

      // クイズIDをランダムにシャッフル
      const shuffledQuizzes = [...quizzes].sort(() => Math.random() - 0.5);

      quizBoothsRef.current = quizzes.map((quiz, index) => {
        // 円周上の位置を計算（元のインデックスに基づく）
        const angle = (index / quizzes.length) * Math.PI * 2 - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        // クイズの状態を確認
        const quizResponse = quizResponses?.find(r => r.quizId === quiz.id);
        const isAnswered = !!quizResponse;
        const isAttempted = attemptedQuizzes?.has(quiz.id);

        // 星の色を決定
        let fillColor = '#FFD700'; // デフォルト：黄色（未試行）
        let strokeColor = '#FFC700';

        if (isAnswered) {
          // 回答済み問題：正解なら緑、不正解なら赤
          if (quizResponse.isCorrect) {
            fillColor = '#90EE90'; // 明るい緑
            strokeColor = '#4CAF50';
          } else {
            fillColor = '#FF6B6B'; // 明るい赤
            strokeColor = '#DC143C';
          }
        } else if (isAttempted) {
          // 試行済みだが未回答：黄色のままキープ
          fillColor = '#FFD700';
          strokeColor = '#FFC700';
        }

        // 星形を描画
        drawStar(ctx, x, y, boothSize, fillColor, strokeColor, quiz.id);

        return { id: quiz.id, x, y, size: boothSize };
      });

      console.log('⭐ Canvas rendered with', quizBoothsRef.current.length, 'shiny star icons');
    } else {
      console.log('⏳ Waiting for quizzes to load...');
      quizBoothsRef.current = [];
    }
  }, [quizzes, solvedQuizzes, quizResponses, attemptedQuizzes]);

  // マウスクリック処理（トラックパッド対応）
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handlePointerInteraction = (event) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;

      console.log(`🖱️ Pointer detected at canvas coordinates: (${Math.round(clickX)}, ${Math.round(clickY)})`);
      console.log(`📍 Current booth count: ${quizBoothsRef.current.length}`);

      if (quizBoothsRef.current.length === 0) {
        console.log('⚠️ No booths available yet');
        return;
      }

      for (const booth of quizBoothsRef.current) {
        const dx = clickX - booth.x;
        const dy = clickY - booth.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check if quiz has been answered
        const isAnswered = quizResponses?.find(r => r.quizId === booth.id);
        // 星のサイズに合わせたクリック判定
        const clickThreshold = booth.size / 2 + 10;
        console.log(`  Star ${booth.id}: distance=${Math.round(distance)}, threshold=${clickThreshold}, answered=${!!isAnswered}`);

        if (distance < clickThreshold && !isAnswered) {
          console.log(`✅ Clicked star: ${booth.id}`);
          setActiveQuizId(booth.id);
          activeQuizRef.current = booth.id;
          event.preventDefault();
          break;
        }
      }
    };

    // 複数のイベントタイプをリスン
    canvas.addEventListener('click', handlePointerInteraction);
    canvas.addEventListener('mousedown', handlePointerInteraction);
    canvas.addEventListener('touchstart', handlePointerInteraction);

    console.log('✅ Event listeners attached to canvas');

    return () => {
      canvas.removeEventListener('click', handlePointerInteraction);
      canvas.removeEventListener('mousedown', handlePointerInteraction);
      canvas.removeEventListener('touchstart', handlePointerInteraction);
      console.log('🧹 Event listeners removed from canvas');
    };
  }, []);

  // データ収集開始
  useEffect(() => {
    if (!isInitialized || !sessionId) return;

    console.log('🔧 Initializing DataCollector:', { sessionId, API_BASE_URL });
    dataCollectorRef.current = new DataCollector(sessionId, API_BASE_URL);
    dataCollectorRef.current.start();
    console.log('✅ DataCollector started');

    return () => {
      if (dataCollectorRef.current) {
        console.log('🛑 Stopping DataCollector');
        dataCollectorRef.current.stop();
      }
    };
  }, [isInitialized, sessionId, API_BASE_URL]);

  const handleQuizClose = async (quizId, isCorrect) => {
    // クイズ回答データを記録（App.jsx経由でsessionDataRefにも記録される）
    if (onQuizResponse) {
      onQuizResponse(quizId, isCorrect);
    }

    setSolvedQuizzes(prev => new Set(prev).add(quizId));
    setActiveQuizId(null);

    // sessionDataRefを使うことで、更新前のquizResponsesの値に依存せず
    // すべてのクイズに回答したか確認
    setTimeout(() => {
      if (sessionDataRef.current && quizzes.length > 0) {
        if (sessionDataRef.current.quizResponses.length >= quizzes.length) {
          console.log('✅ All quizzes answered! Game completed.');
          onGameEnd({ reason: 'completed' });
        }
      }
    }, 100);
  };

  return (
    <div className="game-scene">
      <div ref={containerRef} className="three-container"></div>

      {/* UI オーバーレイ */}
      <div className="game-ui">
        {/* タイマー */}
        <div className={`timer ${remainingTime < 60 ? 'warning' : ''}`}>
          <span className="label">制限時間:</span>
          <span className="time">{formattedTime}</span>
        </div>

        {/* 進捗 */}
        <div className="progress">
          <span className="label">回答した問題:</span>
          <span className="count">{quizResponses.length} / {quizzes.length}</span>
        </div>
      </div>

      {/* クイズポップアップ（UI より上に配置） */}
      {activeQuizId && (
        <QuizBooth
          quiz={quizzes.find(q => q.id === activeQuizId)}
          difficulty={difficulty}
          onClose={handleQuizClose}
          dataCollector={dataCollectorRef.current}
          apiBaseUrl={API_BASE_URL}
        />
      )}
    </div>
  );
};

export default GameScene;
