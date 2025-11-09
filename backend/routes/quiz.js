const express = require('express');
const router = express.Router();

// サンプルクイズデータ
// 形式：難易度ごとに4択選択式のクイズを配列で管理
const quizzes = {
  easy: [
    // 簡単な問題（5問）
    {
      id: 1,
      question: "2 + 2 = ?",
      options: ["3", "4", "5", "6"],
      correctAnswer: 1
    },
    {
      id: 2,
      question: "日本の首都は?",
      options: ["大阪", "東京", "京都", "横浜"],
      correctAnswer: 1
    },
    {
      id: 3,
      question: "虹は通常、何色の光で構成されていますか?",
      options: ["5色", "6色", "7色", "8色"],
      correctAnswer: 2
    },
    {
      id: 4,
      question: "水の沸騰温度は?",
      options: ["90度", "100度", "110度", "120度"],
      correctAnswer: 1
    },
    {
      id: 5,
      question: "10 × 5 = ?",
      options: ["40", "50", "60", "70"],
      correctAnswer: 1
    }
  ],
  medium: [
    // 程よい難易度（7問）
    {
      id: 101,
      question: "光速は秒速何キロメートルですか?",
      options: ["30万km", "150万km", "300万km", "3,000万km"],
      correctAnswer: 0
    },
    {
      id: 102,
      question: "太陽系で最も大きな惑星は?",
      options: ["土星", "木星", "天王星", "海王星"],
      correctAnswer: 1
    },
    {
      id: 103,
      question: "ピタゴラスの定理では、a² + b² = ?",
      options: ["c", "c²", "2c", "c³"],
      correctAnswer: 1
    },
    {
      id: 104,
      question: "DNAの二重らせんを発見したのは誰ですか?",
      options: ["ダーウィン", "ワトソンとクリック", "メンデル", "ガリレオ"],
      correctAnswer: 1
    },
    {
      id: 105,
      question: "化学元素で金を表す記号は?",
      options: ["Go", "Gd", "Au", "Ag"],
      correctAnswer: 2
    },
    {
      id: 106,
      question: "∫ x dx の不定積分は?",
      options: ["x", "x²/2", "x²", "x²/2 + C"],
      correctAnswer: 3
    },
    {
      id: 107,
      question: "地球の直径は約何キロメートル?",
      options: ["6,371km", "8,000km", "10,000km", "12,742km"],
      correctAnswer: 3
    }
  ],
  hard: [
    // 難しい問題（20問）
    {
      id: 201,
      question: "シュレーディンガーの方程式で表現される量子力学の基本は何ですか?",
      options: ["波動関数", "確率分布", "エネルギー準位", "スピン"],
      correctAnswer: 0
    },
    {
      id: 202,
      question: "相対性理論のE=mc²式のcは何を表していますか?",
      options: ["電荷", "光速", "加速度", "容量"],
      correctAnswer: 1
    },
    {
      id: 203,
      question: "ラプラス変換の主な用途は?",
      options: ["微分方程式", "積分方程式", "線形システムの解析", "すべて正解"],
      correctAnswer: 3
    },
    {
      id: 204,
      question: "フェルマーの最終定理はいつ解かれましたか?",
      options: ["1995年", "1997年", "1999年", "2001年"],
      correctAnswer: 0
    },
    {
      id: 205,
      question: "コッホ雪片のフラクタル次元は?",
      options: ["1.26", "1.50", "1.66", "1.89"],
      correctAnswer: 0
    },
    {
      id: 206,
      question: "グリーンの定理はどの積分に関連していますか?",
      options: ["線積分と面積分", "面積分と体積分", "曲線積分のみ", "表面積分のみ"],
      correctAnswer: 0
    },
    {
      id: 207,
      question: "ブラックホールの中心に存在するのは?",
      options: ["中性子", "特異点", "光子", "クォーク"],
      correctAnswer: 1
    },
    {
      id: 208,
      question: "量子コンピュータの基本単位は?",
      options: ["ビット", "キューピット", "トリット", "バイト"],
      correctAnswer: 1
    },
    {
      id: 209,
      question: "超伝導は何度以下で発生しますか？",
      options: ["臨界温度以下", "100K以下", "0K", "超伝導体によって異なる"],
      correctAnswer: 3
    },
    {
      id: 210,
      question: "ナビエ・ストークス方程式が記述するのは?",
      options: ["流体力学", "熱力学", "電磁気学", "光学"],
      correctAnswer: 0
    },
    {
      id: 211,
      question: "カオス理論での初期条件の敏感性を何と呼びますか?",
      options: ["蝶効果", "分岐", "アトラクター", "揺動"],
      correctAnswer: 0
    },
    {
      id: 212,
      question: "リーマン予想は何に関する未解決問題ですか?",
      options: ["素数分布", "円周率", "完全数", "完璧数"],
      correctAnswer: 0
    },
    {
      id: 213,
      question: "バンディング理論が説明するのは?",
      options: ["結晶構造", "固体中の電子エネルギーバンド", "光の回折", "熱伝導"],
      correctAnswer: 1
    },
    {
      id: 214,
      question: "プランク定数hの値は約？",
      options: ["6.63×10⁻³⁴ J·s", "6.63×10⁻²⁴ J·s", "3.14×10⁻³⁴ J·s", "9.81×10⁻³⁴ J·s"],
      correctAnswer: 0
    },
    {
      id: 215,
      question: "アボガドロ数の値は約？",
      options: ["6.02×10²³", "6.02×10²⁴", "3.14×10²³", "9.81×10²²"],
      correctAnswer: 0
    },
    {
      id: 216,
      question: "ファインマンパスの積分は何に関するものですか？",
      options: ["古典力学", "量子力学", "統計力学", "流体力学"],
      correctAnswer: 1
    },
    {
      id: 217,
      question: "ハミルトニアンが表現するのは？",
      options: ["運動量", "トータルエネルギー", "角運動量", "ポテンシャルエネルギー"],
      correctAnswer: 1
    },
    {
      id: 218,
      question: "弦理論が提唱する基本的な物質の構成要素は？",
      options: ["粒子", "弦", "ブレーン", "フィールド"],
      correctAnswer: 1
    },
    {
      id: 219,
      question: "デバイ温度はどの物質の性質を表しますか？",
      options: ["導電率", "比熱", "硬度", "光学的性質"],
      correctAnswer: 1
    },
    {
      id: 220,
      question: "ベル不等式が関連する量子力学の問題は？",
      options: ["測定問題", "局所性とエンタングルメント", "解釈問題", "確率性"],
      correctAnswer: 1
    }
  ]
};

// 難易度ごとのクイズを取得
router.get('/difficulty/:difficulty', (req, res) => {
  const { difficulty } = req.params;

  if (!quizzes[difficulty]) {
    return res.status(400).json({ error: 'Invalid difficulty level' });
  }

  // クイズをシャッフル（必要に応じて）
  const shuffledQuizzes = [...quizzes[difficulty]].sort(() => Math.random() - 0.5);

  res.json({
    difficulty,
    quizzes: shuffledQuizzes,
    count: shuffledQuizzes.length
  });
});

// クイズの回答を検証
router.post('/verify', (req, res) => {
  const { difficulty, quizId, selectedAnswer } = req.body;

  if (!quizzes[difficulty]) {
    return res.status(400).json({ error: 'Invalid difficulty level' });
  }

  const quiz = quizzes[difficulty].find(q => q.id === quizId);

  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  const isCorrect = quiz.correctAnswer === selectedAnswer;

  res.json({
    quizId,
    isCorrect,
    correctAnswer: quiz.correctAnswer
  });
});

module.exports = router;
