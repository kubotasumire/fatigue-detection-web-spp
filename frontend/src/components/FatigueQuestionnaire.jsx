import React, { useState } from 'react';
import './FatigueQuestionnaire.css';

const FatigueQuestionnaire = ({ onSubmit, timing = 'pre' }) => {
  const [selectedLevel, setSelectedLevel] = useState(null);

  const handleSubmit = () => {
    if (selectedLevel === null) return;
    onSubmit(selectedLevel);
  };

  const isAnswered = selectedLevel !== null;

  return (
    <div className="fatigue-questionnaire">
      <div className="questionnaire-card">
        <h2>疲労感調査</h2>
        <p className="questionnaire-question">
          {timing === 'pre'
            ? '試験開始前の現在の疲労感についてお答えください'
            : '試験終了後の現在の疲労感についてお答えください'}
        </p>

        {/* 10段階スケール */}
        <div className="scale-container">
          <div className="scale-labels">
            <span className="label-left">疲れていない</span>
            <span className="label-right">非常に疲れている</span>
          </div>

          <div className="scale-buttons">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
              <button
                key={level}
                className={`scale-button ${selectedLevel === level ? 'selected' : ''}`}
                onClick={() => setSelectedLevel(level)}
              >
                {level}
              </button>
            ))}
          </div>

          <div className="scale-numbers">
            <span className="number-left">1</span>
            <span className="number-right">10</span>
          </div>
        </div>

        {/* わからないオプション */}
        <div className="unknown-option">
          <button
            className={`unknown-button ${selectedLevel === 'unknown' ? 'selected' : ''}`}
            onClick={() => setSelectedLevel('unknown')}
          >
            わからない
          </button>
        </div>

        {/* 送信ボタン */}
        <button
          className={`submit-button ${isAnswered ? 'enabled' : 'disabled'}`}
          onClick={handleSubmit}
          disabled={!isAnswered}
        >
          {timing === 'pre' ? '試験を開始する' : '終了する'}
        </button>
      </div>
    </div>
  );
};

export default FatigueQuestionnaire;
