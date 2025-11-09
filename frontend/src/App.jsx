import React, { useState, useEffect, useRef } from 'react';
import StartScreen from './components/StartScreen';
import GameScene from './components/GameScene';
import EndScreen from './components/EndScreen';
import FatigueQuestionnaire from './components/FatigueQuestionnaire';
import './App.css';

function App() {
  // APIベースURL（環境変数から取得、なければlocalhost:5001使用）
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

  const [gameState, setGameState] = useState('start'); // start, pre-questionnaire, playing, end, post-questionnaire
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [quizResponses, setQuizResponses] = useState([]);
  const [attemptedQuizzes, setAttemptedQuizzes] = useState(new Set());
  const [preFatigue, setPreFatigue] = useState(null);
  const [postFatigue, setPostFatigue] = useState(null);
  const sessionDataRef = useRef(null);

  // 難易度選択時（事前アンケート画面へ）
  const handleDifficultySelect = (difficulty) => {
    setSelectedDifficulty(difficulty);
    setGameState('pre-questionnaire');
  };

  // 事前疲労アンケート送信時（ゲーム開始）
  const handlePreFatigueSubmit = async (fatigueLevel) => {
    setPreFatigue(fatigueLevel);

    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // バックエンドにセッション開始を通知
      const response = await fetch(`${API_BASE_URL}/api/data/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          difficulty: selectedDifficulty,
          timestamp: Date.now(),
          preFatigue: fatigueLevel
        })
      });

      const data = await response.json();

      setSessionId(data.sessionId);
      setQuizResponses([]); // クイズ回答をリセット
      setAttemptedQuizzes(new Set()); // 試行済みクイズをリセット
      setGameState('playing');

      // セッションデータをメモリに保存
      sessionDataRef.current = {
        id: data.sessionId,
        difficulty: selectedDifficulty,
        startTime: Date.now(),
        sensorData: [],
        quizResponses: [],
        endTime: null,
        preFatigue: fatigueLevel,
        postFatigue: null
      };
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  // クイズ試行を記録（開いたときに呼ばれる）
  const handleQuizAttempt = (quizId) => {
    setAttemptedQuizzes(prev => new Set(prev).add(quizId));
    console.log(`Quiz attempt recorded: ${quizId}`);
  };

  // クイズ回答データを記録
  const handleQuizResponse = (quizId, isCorrect) => {
    const response = {
      quizId,
      isCorrect,
      timestamp: Date.now()
    };

    // App.jsx の状態に記録
    setQuizResponses(prev => [...prev, response]);

    // sessionDataRef にも記録（バックアップ用）
    if (sessionDataRef.current) {
      sessionDataRef.current.quizResponses.push(response);
    }

    console.log(`Quiz response recorded: ${quizId} - ${isCorrect ? 'correct' : 'incorrect'}`);
  };

  // ゲーム終了時（事後アンケート画面へ）
  const handleGameEnd = async (reason) => {
    if (!sessionDataRef.current) return;

    const endTime = Date.now();
    sessionDataRef.current.endTime = endTime;

    console.log('=== Game End - Final Session Data ===');
    console.log('Quiz Responses:', sessionDataRef.current.quizResponses);

    try {
      // バックエンドにセッション終了を通知
      await fetch(`${API_BASE_URL}/api/data/session/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          timestamp: endTime
        })
      });

      // セッションデータを保存して事後アンケートへ
      setSessionData(sessionDataRef.current);
      setGameState('post-questionnaire');
    } catch (error) {
      console.error('Failed to end session:', error);
      setGameState('post-questionnaire');
    }
  };

  // 事後疲労アンケート送信時（終了画面へ）
  const handlePostFatigueSubmit = (fatigueLevel) => {
    setPostFatigue(fatigueLevel);

    // セッションデータに事後疲労を追加
    if (sessionDataRef.current) {
      sessionDataRef.current.postFatigue = fatigueLevel;
    }

    // 終了画面へ移動
    setSessionData(sessionDataRef.current);
    setGameState('end');
  };

  const handleTimeUp = () => {
    console.log('時間終了');
    handleGameEnd({ reason: 'timeup' });
  };

  // スタート画面に戻る
  const handleRestart = () => {
    setGameState('start');
    setSelectedDifficulty(null);
    setSessionId(null);
    setSessionData(null);
    setPreFatigue(null);
    setPostFatigue(null);
    setQuizResponses([]);
    setAttemptedQuizzes(new Set());
    sessionDataRef.current = null;
  };

  return (
    <div className="App">
      {gameState === 'start' && <StartScreen onDifficultySelect={handleDifficultySelect} />}

      {gameState === 'pre-questionnaire' && (
        <FatigueQuestionnaire onSubmit={handlePreFatigueSubmit} timing="pre" />
      )}

      {gameState === 'playing' && (
        <GameScene
          difficulty={selectedDifficulty}
          sessionId={sessionId}
          onGameEnd={handleGameEnd}
          onTimeUp={handleTimeUp}
          onQuizResponse={handleQuizResponse}
          onQuizAttempt={handleQuizAttempt}
          quizResponses={quizResponses}
          attemptedQuizzes={attemptedQuizzes}
          apiBaseUrl={API_BASE_URL}
        />
      )}

      {gameState === 'post-questionnaire' && (
        <FatigueQuestionnaire onSubmit={handlePostFatigueSubmit} timing="post" />
      )}

      {gameState === 'end' && sessionData && (
        <EndScreen sessionData={sessionData} difficulty={selectedDifficulty} onRestart={handleRestart} apiBaseUrl={API_BASE_URL} />
      )}
    </div>
  );
}

export default App;
