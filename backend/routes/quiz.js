const express = require("express");
const router = express.Router();

// サンプルクイズデータ
// 形式：難易度ごとに4択選択式のクイズを配列で管理
const quizzes = {
  easy: [
    // 簡単な問題（5問）
    {
      id: 1,
      question: "次のうち、空を飛べる動物はどれでしょう?",
      options: ["ゾウ", "スズメ", "ライオン", "カバ"],
      correctAnswer: 1,
    },
    {
      id: 2,
      question: "2 + 3 = ?",
      options: ["4", "5", "6", "7"],
      correctAnswer: 1,
    },
    {
      id: 3,
      question: "日本の首都はどこでしょう?",
      options: ["大阪", "東京", "京都", "名古屋"],
      correctAnswer: 1,
    },
    {
      id: 4,
      question: "四角形には角がいくつありますか?",
      options: ["2つ", "3つ", "4つ", "5つ"],
      correctAnswer: 2,
    },
    {
      id: 5,
      question: "日本は何という惑星にありますか?",
      options: ["火星", "地球", "金星", "木星"],
      correctAnswer: 1,
    },
  ],
  medium: [
    // 程よい難易度（7問）
    {
      id: 101,
      question: "x² - 5x + 6 = 0 を解いたとき、xの値の組み合わせは?",
      options: ["x = 1, 6", "x = 2, 3", "x = -2, -3", "x = 1, 5"],
      correctAnswer: 1,
    },
    {
      id: 102,
      question:
        "次の英文の空欄に入る適切な語は?「I have lived in Tokyo ( ) five years.」",
      options: ["since", "for", "during", "while"],
      correctAnswer: 1,
    },
    {
      id: 103,
      question: "江戸幕府を開いたのは誰?",
      options: ["織田信長", "豊臣秀吉", "徳川家康", "徳川綱吉"],
      correctAnswer: 2,
    },
    {
      id: 104,
      question: "水の化学式はどれ?",
      options: ["H₂O", "CO₂", "O₂", "NaCl"],
      correctAnswer: 0,
    },
    {
      id: 105,
      question: "物体に力を加えて移動させたとき、した仕事を表す式は?(F:力、s:移動距離)",
      options: ["W = F + s", "W = F × s", "W = F ÷ s", "W = F - s"],
      correctAnswer: 1,
    },
    {
      id: 106,
      question: "「憂鬱」の読み方は?",
      options: ["ゆうえん", "ゆううつ", "いううつ", "ゆうきゅう"],
      correctAnswer: 1,
    },
    {
      id: 107,
      question: "日本で一番面積が大きい都道府県は?",
      options: ["東京都", "北海道", "沖縄県", "長野県"],
      correctAnswer: 1,
    },
  ],
  hard: [
    // 難しい問題（10問）
    {
      id: 201,
      question: "10人の中から3人の委員を選ぶとき、特定の2人AとBが両方とも選ばれない選び方は何通り?",
      options: ["28通り", "35通り", "56通り", "84通り"],
      correctAnswer: 2,
    },
    {
      id: 202,
      question: "「すべての猫は動物である」「一部の動物は飛べる」が真のとき、必ず真といえるのは?",
      options: ["すべての猫は飛べる", "一部の猫は飛べる", "すべての猫は飛べない", "どれも必ずしも真とはいえない"],
      correctAnswer: 3,
    },
    {
      id: 203,
      question: "質量mの物体を高さhから自由落下させたとき、地面に到達する直前の速度は?(重力加速度g)",
      options: ["v = √(gh)", "v = √(2gh)", "v = 2gh", "v = mgh"],
      correctAnswer: 1,
    },
    {
      id: 204,
      question: "サイコロを3回振って、少なくとも1回は6が出る確率は?",
      options: ["1/2", "91/216", "125/216", "1/6"],
      correctAnswer: 1,
    },
    {
      id: 205,
      question: "「x > 5」は「x > 3」の何条件?",
      options: ["必要条件", "十分条件", "必要十分条件", "どちらでもない"],
      correctAnswer: 1,
    },
    {
      id: 206,
      question: "5人を円形のテーブルに座らせる方法は何通り?",
      options: ["12通り", "24通り", "60通り", "120通り"],
      correctAnswer: 1,
    },
    {
      id: 207,
      question: "抵抗4Ωと6Ωを並列につないだときの合成抵抗は?",
      options: ["2.4Ω", "2.5Ω", "5Ω", "10Ω"],
      correctAnswer: 0,
    },
    {
      id: 208,
      question: "sin²θ + cos²θ = ?",
      options: ["0", "1", "2", "θによって変わる"],
      correctAnswer: 1,
    },
    {
      id: 209,
      question: "3人の容疑者A, B, Cがいる。犯人は1人で、犯人だけが嘘をつく。A「Bが犯人だ」B「Cが犯人だ」C「私は犯人ではない」誰が犯人?",
      options: ["A", "B", "C", "判定不能"],
      correctAnswer: 0,
    },
    {
      id: 210,
      question: "log₂8 = ?",
      options: ["2", "3", "4", "8"],
      correctAnswer: 1,
    },
  ],
};

// 難易度ごとのクイズを取得
router.get("/difficulty/:difficulty", (req, res) => {
  const { difficulty } = req.params;

  if (!quizzes[difficulty]) {
    return res.status(400).json({ error: "Invalid difficulty level" });
  }

  // クイズをシャッフル（必要に応じて）
  const shuffledQuizzes = [...quizzes[difficulty]].sort(
    () => Math.random() - 0.5
  );

  res.json({
    difficulty,
    quizzes: shuffledQuizzes,
    count: shuffledQuizzes.length,
  });
});

// クイズの回答を検証
router.post("/verify", (req, res) => {
  const { difficulty, quizId, selectedAnswer } = req.body;

  if (!quizzes[difficulty]) {
    return res.status(400).json({ error: "Invalid difficulty level" });
  }

  const quiz = quizzes[difficulty].find((q) => q.id === quizId);

  if (!quiz) {
    return res.status(404).json({ error: "Quiz not found" });
  }

  const isCorrect = quiz.correctAnswer === selectedAnswer;

  res.json({
    quizId,
    isCorrect,
    correctAnswer: quiz.correctAnswer,
  });
});

module.exports = router;
