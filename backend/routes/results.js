const express = require('express');
const router = express.Router();
const metricsController = require('../controllers/metricsController');

// セッションの結果と計測指標を計算
router.post('/calculate', (req, res) => {
  const { sessionData } = req.body;

  try {
    const metrics = metricsController.calculateMetrics(sessionData);
    const accuracy = metricsController.calculateAccuracy(sessionData.quizResponses);

    res.json({
      accuracy,
      metrics,
      totalDuration: sessionData.endTime - sessionData.startTime
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 計測指標の詳細情報
router.get('/metrics/:sessionId', (req, res) => {
  // TODO: セッションIDからセッションデータを取得して計測指標を計算
  res.json({ message: 'Metrics endpoint' });
});

module.exports = router;
