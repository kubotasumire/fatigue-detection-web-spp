import React, { useState } from "react";
import "./StartScreen.css";

const StartScreen = ({ onDifficultySelect }) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);

  const difficulties = [
    {
      id: "easy",
      label: "低ストレス\n（簡単）",
      description: "簡単な問題が5問のみ",
      color: "#4CAF50",
    },
    {
      id: "medium",
      label: "程よいストレス\n（中級）",
      description: "ある程度難しい問題で7問",
      color: "#FF9800",
    },
    {
      id: "hard",
      label: "高ストレス\n（難しい）",
      description: "難しい問題が約20問",
      color: "#F44336",
    },
  ];

  const handleSelect = (difficulty) => {
    setSelectedDifficulty(difficulty);
  };

  const handleStart = () => {
    if (selectedDifficulty) {
      onDifficultySelect(selectedDifficulty);
    }
  };

  return (
    <div className="start-screen">
      <div className="start-container">
        <h1>Web学習アプリ</h1>
        <p className="subtitle">難易度を選択してゲームを開始してください</p>

        <div className="difficulty-grid">
          {difficulties.map((diff) => (
            <button
              key={diff.id}
              className={`difficulty-card ${
                selectedDifficulty === diff.id ? "selected" : ""
              }`}
              style={{
                borderColor:
                  selectedDifficulty === diff.id ? diff.color : "#ccc",
              }}
              onClick={() => handleSelect(diff.id)}
            >
              <div
                className="card-color"
                style={{ backgroundColor: diff.color }}
              ></div>
              <h2>{diff.label}</h2>
              <p>{diff.description}</p>
              <div className="card-icon">
                {selectedDifficulty === diff.id && (
                  <span className="checkmark">✓</span>
                )}
              </div>
            </button>
          ))}
        </div>

        {selectedDifficulty && (
          <div className="start-button-container">
            <button className="start-button" onClick={handleStart}>
              ゲーム開始
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StartScreen;
