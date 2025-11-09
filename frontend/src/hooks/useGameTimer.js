import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * ゲーム制限時間管理フック
 */
export const useGameTimer = (difficulty, onTimeUp) => {
  // 難易度ごとの制限時間（秒）
  const timeLimits = {
    easy: 1 * 60,      // 簡単: 1分
    medium: 2 * 60,    // 程よい: 2分
    hard: 4 * 60       // 難しい: 4分
  };

  const timeLimit = timeLimits[difficulty] || 600;
  const [remainingTime, setRemainingTime] = useState(timeLimit);
  const [isRunning, setIsRunning] = useState(true);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  const stop = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const start = useCallback(() => {
    setIsRunning(true);
    startTimeRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, timeLimit - elapsed);

      setRemainingTime(remaining);

      if (remaining === 0) {
        setIsRunning(false);
        if (onTimeUp) {
          onTimeUp();
        }
      }
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLimit, onTimeUp]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    remainingTime,
    formattedTime: formatTime(remainingTime),
    isRunning,
    stop,
    start,
    timeLimit
  };
};

export default useGameTimer;
