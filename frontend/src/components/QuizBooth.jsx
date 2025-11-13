import React, { useState, useEffect } from 'react';
import './QuizBooth.css';

const QuizBooth = ({ quiz, difficulty, onClose, dataCollector, apiBaseUrl }) => {
  const API_BASE_URL = apiBaseUrl !== undefined ? apiBaseUrl : 'http://localhost:5001';
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleOptionClick = (index) => {
    if (!submitted) {
      setSelectedAnswer(index);
    }
  };

  const handleSubmit = async () => {
    if (selectedAnswer === null) return;

    try {
      // バックエンドで正解判定
      const response = await fetch(`${API_BASE_URL}/api/quiz/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          difficulty,
          quizId: quiz.id,
          selectedAnswer
        })
      });

      const result = await response.json();
      setIsCorrect(result.isCorrect);
      setSubmitted(true);

      // データ記録
      if (dataCollector) {
        dataCollector.recordQuizResponse(quiz.id, selectedAnswer, result.isCorrect);
      }

      // 難易度に応じて遅延時間を決定
      const delayMap = {
        easy: 1000,    // 1秒
        medium: 3000,  // 3秒
        hard: 7000     // 7秒
      };
      const delay = delayMap[difficulty] || 2000; // デフォルト: 2秒

      // 遅延後に画面を閉じる
      setTimeout(() => {
        onClose(quiz.id, result.isCorrect);
      }, delay);
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  const handleClose = () => {
    if (!submitted) {
      onClose(quiz.id, false);
    }
  };

  if (!quiz) return null;

  return (
    <div className="quiz-booth-overlay" onClick={handleClose}>
      <div className="quiz-booth-modal" onClick={(e) => e.stopPropagation()}>
        {/* ヘッダー */}
        <div className="quiz-header">
          <h2>問題</h2>
          <button className="close-button" onClick={handleClose} disabled={submitted}>
            ✕
          </button>
        </div>

        {/* コンテンツ */}
        {!submitted ? (
          <>
            {/* 問題文 */}
            <div className="quiz-question">
              <p>{quiz.question}</p>
            </div>

            {/* 選択肢 */}
            <div className="quiz-options">
              {quiz.options.map((option, index) => (
                <button
                  key={index}
                  className={`option-button ${
                    selectedAnswer === index ? 'selected' : ''
                  }`}
                  onClick={() => handleOptionClick(index)}
                  disabled={submitted}
                >
                  <span className="option-letter">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="option-text">{option}</span>
                </button>
              ))}
            </div>

            {/* 送信ボタン */}
            <div className="quiz-footer">
              <button
                className="submit-button"
                onClick={handleSubmit}
                disabled={selectedAnswer === null}
              >
                回答する
              </button>
            </div>
          </>
        ) : (
          /* 結果表示 */
          <div className={`quiz-result ${isCorrect ? 'correct' : 'incorrect'}`}>
            <div className="result-icon">
              {isCorrect ? (
                <>
                  <span className="checkmark">✓</span>
                  <p className="result-text">正解!</p>
                </>
              ) : (
                <>
                  <span className="cross">✗</span>
                  <p className="result-text">不正解</p>
                  <p className="correct-answer">
                    正解: <strong>{quiz.options[quiz.correctAnswer]}</strong>
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizBooth;
