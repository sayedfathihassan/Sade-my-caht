import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Trophy, Brain, Timer, CheckCircle2, XCircle, Coins, Star, ArrowRight } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  reward: number;
  xp: number;
}

const TRIVIA_QUESTIONS: Question[] = [
  {
    id: "q1",
    text: "ما هي عاصمة المملكة العربية السعودية؟",
    options: ["جدة", "الرياض", "مكة المكرمة", "الدمام"],
    correctAnswer: 1,
    reward: 50,
    xp: 20
  },
  {
    id: "q2",
    text: "كم عدد ألوان قوس قزح؟",
    options: ["5", "6", "7", "8"],
    correctAnswer: 2,
    reward: 50,
    xp: 20
  },
  {
    id: "q3",
    text: "ما هو أكبر كوكب في المجموعة الشمسية؟",
    options: ["الأرض", "المريخ", "زحل", "المشتري"],
    correctAnswer: 3,
    reward: 100,
    xp: 40
  },
  {
    id: "q4",
    text: "من هو مخترع المصباح الكهربائي؟",
    options: ["نيكولا تسلا", "توماس إديسون", "ألكسندر جراهام بيل", "ألبرت أينشتاين"],
    correctAnswer: 1,
    reward: 100,
    xp: 40
  },
  {
    id: "q5",
    text: "ما هو أطول نهر في العالم؟",
    options: ["نهر النيل", "نهر الأمازون", "نهر المسيسيبي", "نهر اليانغتسي"],
    correctAnswer: 0,
    reward: 150,
    xp: 60
  },
  {
    id: "q6",
    text: "كم عدد القارات في العالم؟",
    options: ["5", "6", "7", "8"],
    correctAnswer: 2,
    reward: 50,
    xp: 20
  },
  {
    id: "q7",
    text: "ما هو الحيوان الذي يلقب بسفينة الصحراء؟",
    options: ["الحصان", "الجمل", "الفيل", "الأسد"],
    correctAnswer: 1,
    reward: 50,
    xp: 20
  },
  {
    id: "q8",
    text: "ما هي أصغر دولة في العالم من حيث المساحة؟",
    options: ["موناكو", "الفاتيكان", "سان مارينو", "المالديف"],
    correctAnswer: 1,
    reward: 200,
    xp: 80
  }
];

interface TriviaGameProps {
  isOpen: boolean;
  onClose: () => void;
  onPlay?: () => Promise<boolean>;
  onWin: (reward: { coins: number, xp: number }) => void;
  userCoins: number;
  cost: number;
}

export function TriviaGame({ isOpen, onClose, onPlay, onWin, userCoins, cost }: TriviaGameProps) {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'result'>('start');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = TRIVIA_QUESTIONS[currentQuestionIndex];

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0 && isCorrect === null) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isCorrect === null) {
      handleAnswer(-1); // Time out
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, timeLeft, isCorrect]);

  const startGame = async () => {
    if (userCoins < cost) {
      alert(`عذراً، رصيدك غير كافٍ. تكلفة اللعب هي ${cost} عملة.`);
      return;
    }

    if (onPlay) {
      const success = await onPlay();
      if (!success) return;
    }

    setGameState('playing');
    setCurrentQuestionIndex(0);
    setScore(0);
    setTotalCoins(0);
    setTotalXp(0);
    setTimeLeft(15);
    setSelectedOption(null);
    setIsCorrect(null);
  };

  const handleAnswer = (optionIndex: number) => {
    if (isCorrect !== null) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedOption(optionIndex);
    const correct = optionIndex === currentQuestion.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      setScore(prev => prev + 1);
      setTotalCoins(prev => prev + currentQuestion.reward);
      setTotalXp(prev => prev + currentQuestion.xp);
    }

    setTimeout(() => {
      if (currentQuestionIndex < TRIVIA_QUESTIONS.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedOption(null);
        setIsCorrect(null);
        setTimeLeft(15);
      } else {
        setGameState('result');
        onWin({ coins: totalCoins + (correct ? currentQuestion.reward : 0), xp: totalXp + (correct ? currentQuestion.xp : 0) });
      }
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" dir="rtl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-lg bg-neutral-900 rounded-[40px] border border-white/10 overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-neutral-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-xl">
                  <Brain className="w-6 h-6 text-purple-500" />
                </div>
                <h2 className="text-xl font-bold">تحدي العباقرة</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8">
              {gameState === 'start' && (
                <div className="text-center space-y-6">
                  <div className="w-24 h-24 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto">
                    <Brain className="w-12 h-12 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black mb-2">هل أنت مستعد؟</h3>
                    <p className="text-neutral-400 text-sm">أجب على الأسئلة بأسرع ما يمكن لتربح مكافآت قيمة!</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-right">
                    <div className="bg-neutral-800/50 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-neutral-500 mb-1">عدد الأسئلة</p>
                      <p className="font-bold text-lg">{TRIVIA_QUESTIONS.length}</p>
                    </div>
                    <div className="bg-neutral-800/50 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-neutral-500 mb-1">تكلفة اللعب</p>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Coins className="w-4 h-4" />
                        <p className="font-bold text-lg">{cost}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={startGame}
                    className="w-full py-4 bg-purple-500 hover:bg-purple-400 text-white rounded-2xl font-black text-lg shadow-lg shadow-purple-500/20 transition-all"
                  >
                    ابدأ التحدي
                  </button>
                </div>
              )}

              {gameState === 'playing' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-500">السؤال {currentQuestionIndex + 1} من {TRIVIA_QUESTIONS.length}</span>
                    </div>
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors",
                      timeLeft <= 5 ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-neutral-800 border-white/5 text-neutral-400"
                    )}>
                      <Timer className={cn("w-4 h-4", timeLeft <= 5 && "animate-pulse")} />
                      <span className="text-sm font-mono font-bold">{timeLeft}s</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-bold leading-relaxed">{currentQuestion.text}</h3>
                    <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: "100%" }}
                        animate={{ width: `${(timeLeft / 15) * 100}%` }}
                        className={cn(
                          "h-full transition-colors",
                          timeLeft <= 5 ? "bg-red-500" : "bg-purple-500"
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {currentQuestion.options.map((option, index) => {
                      const isSelected = selectedOption === index;
                      const isCorrectAnswer = index === currentQuestion.correctAnswer;
                      
                      let buttonClass = "bg-neutral-800 border-white/5 text-neutral-300 hover:bg-neutral-700";
                      if (isCorrect !== null) {
                        if (isCorrectAnswer) {
                          buttonClass = "bg-green-500/20 border-green-500/50 text-green-500";
                        } else if (isSelected && !isCorrect) {
                          buttonClass = "bg-red-500/20 border-red-500/50 text-red-500";
                        } else {
                          buttonClass = "bg-neutral-800/50 border-white/5 text-neutral-600 opacity-50";
                        }
                      }

                      return (
                        <motion.button
                          key={index}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleAnswer(index)}
                          disabled={isCorrect !== null}
                          className={cn(
                            "w-full p-4 rounded-2xl border text-right font-bold transition-all flex items-center justify-between",
                            buttonClass
                          )}
                        >
                          <span>{option}</span>
                          {isCorrect !== null && isCorrectAnswer && <CheckCircle2 className="w-5 h-5" />}
                          {isCorrect !== null && isSelected && !isCorrect && <XCircle className="w-5 h-5" />}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {gameState === 'result' && (
                <div className="text-center space-y-8">
                  <div className="relative inline-block">
                    <div className="w-32 h-32 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
                      <Trophy className="w-16 h-16 text-amber-500" />
                    </div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 bg-amber-500 text-black w-10 h-10 rounded-full flex items-center justify-center font-black border-4 border-neutral-900"
                    >
                      {Math.round((score / TRIVIA_QUESTIONS.length) * 100)}%
                    </motion.div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-black mb-2">انتهى التحدي!</h3>
                    <p className="text-neutral-400 text-sm">لقد أجبت على {score} من أصل {TRIVIA_QUESTIONS.length} أسئلة بشكل صحيح</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20 flex flex-col items-center gap-1">
                      <Coins className="w-5 h-5 text-amber-500" />
                      <p className="text-[10px] text-amber-500/60 font-bold">العملات المكتسبة</p>
                      <p className="text-xl font-black text-amber-500">+{totalCoins}</p>
                    </div>
                    <div className="bg-purple-500/10 p-4 rounded-2xl border border-purple-500/20 flex flex-col items-center gap-1">
                      <Star className="w-5 h-5 text-purple-500" />
                      <p className="text-[10px] text-purple-500/60 font-bold">الخبرة المكتسبة</p>
                      <p className="text-xl font-black text-purple-500">+{totalXp}</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={onClose}
                      className="flex-1 py-4 bg-neutral-800 hover:bg-neutral-700 text-white rounded-2xl font-bold transition-all"
                    >
                      إغلاق
                    </button>
                    <button
                      onClick={startGame}
                      className="flex-1 py-4 bg-purple-500 hover:bg-purple-400 text-white rounded-2xl font-black shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      إعادة المحاولة
                      <ArrowRight className="w-5 h-5 rotate-180" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
