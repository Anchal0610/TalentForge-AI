'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuestionGuide {
  question: string;
  category: string;
  beginner_answer: string;
  intermediate_answer: string;
  expert_answer: string;
}

interface EvaluationResult {
  score: number;
  missing_keywords: string[];
  improvements: string;
}

interface HistoryItem {
  question: string;
  user_answer: string;
  evaluation: EvaluationResult;
}

export default function InterviewPage() {
  const [activeTab, setActiveTab] = useState<'guide' | 'mock'>('guide');
  
  // Tab 1: Q&A guide state
  const [targetRole, setTargetRole] = useState('MLOps Engineer');
  const [missingSkills, setMissingSkills] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState('All Levels');
  const [category, setCategory] = useState('Technical');
  const [loadingGuide, setLoadingGuide] = useState(false);
  const [guideQuestions, setGuideQuestions] = useState<QuestionGuide[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Tab 2: Mock simulator state
  const [mockQuestions] = useState<string[]>([
    'What is a Kubernetes pod, and how does it relate to container scheduling?',
    'How do you approach fine-tuning or optimizing text embeddings for RAG pipelines?'
  ]);
  const [mockIndex, setMockIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [loadingEval, setLoadingEval] = useState(false);
  const [currentEval, setCurrentEval] = useState<EvaluationResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedRole = localStorage.getItem('targetRole') || 'MLOps Engineer';
      setTargetRole(savedRole);
      
      const savedGaps = localStorage.getItem('missingSkills');
      if (savedGaps) {
        try {
          setMissingSkills(JSON.parse(savedGaps));
        } catch {
          // ignore
        }
      }

      // Load guide if exists
      const savedGuide = localStorage.getItem('guideQuestions');
      if (savedGuide) {
        try {
          setGuideQuestions(JSON.parse(savedGuide));
        } catch {
          // ignore
        }
      }

      // Load mock state if exists
      const savedMockIndex = localStorage.getItem('mockIndex');
      if (savedMockIndex) setMockIndex(parseInt(savedMockIndex, 10));

      const savedHistory = localStorage.getItem('mockHistory');
      if (savedHistory) {
        try {
          setHistory(JSON.parse(savedHistory));
        } catch {
          // ignore
        }
      }
    }
  }, []);

  const generateGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingGuide(true);
    setGuideQuestions([]);
    setExpandedIndex(null);

    try {
      const res = await fetch('/api/interview/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole, missingSkills, difficulty, category })
      });

      if (!res.ok) throw new Error('Failed to compile guide.');
      const data = await res.json();
      setGuideQuestions(data);
      localStorage.setItem('guideQuestions', JSON.stringify(data));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGuide(false);
    }
  };

  const submitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer) return;
    setLoadingEval(true);
    setCurrentEval(null);

    try {
      const currentQuestion = mockQuestions[mockIndex];
      const res = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: currentQuestion, candidateResponse: userAnswer })
      });

      if (!res.ok) throw new Error('Evaluation failed.');
      const evaluation: EvaluationResult = await res.json();
      setCurrentEval(evaluation);

      const nextHistory = [...history, {
        question: currentQuestion,
        user_answer: userAnswer,
        evaluation
      }];
      setHistory(nextHistory);
      localStorage.setItem('mockHistory', JSON.stringify(nextHistory));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEval(false);
    }
  };

  const nextQuestion = () => {
    const nextIdx = mockIndex + 1;
    setMockIndex(nextIdx);
    localStorage.setItem('mockIndex', nextIdx.toString());
    setUserAnswer('');
    setCurrentEval(null);
  };

  const restartMock = () => {
    setMockIndex(0);
    localStorage.setItem('mockIndex', '0');
    setUserAnswer('');
    setCurrentEval(null);
    setHistory([]);
    localStorage.removeItem('mockHistory');
  };

  const getAvgScore = () => {
    if (history.length === 0) return 0;
    const total = history.reduce((acc, h) => acc + h.evaluation.score, 0);
    return Math.round(total / history.length);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">🎤 AI Interview Preparation Suite</h1>
        <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md mt-4">
          <CardContent className="pt-6">
            <h3 className="text-base font-semibold text-slate-200 mb-1.5">Prepare for Live Assessments</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Generate target-focused questions, study multi-tiered responses (Beginner, Intermediate, Expert), and simulate an interactive mock evaluation. The engine analyzes your answer's keywords and coverage, suggesting key improvement steps.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-4 border-b border-white/10 pb-px">
        <button
          onClick={() => setActiveTab('guide')}
          className={cn(
            "px-4 py-2.5 text-sm font-semibold border-b-2 transition-all duration-200 outline-none",
            activeTab === 'guide'
              ? "border-purple-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          📚 Question & Answer Bank
        </button>
        <button
          onClick={() => setActiveTab('mock')}
          className={cn(
            "px-4 py-2.5 text-sm font-semibold border-b-2 transition-all duration-200 outline-none",
            activeTab === 'mock'
              ? "border-purple-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          🤖 Mock Interview Sim
        </button>
      </div>

      {activeTab === 'guide' ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Q&A Parameters Form */}
          <form onSubmit={generateGuide} className="lg:col-span-2">
            <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md hover:border-violet-500/20 transition-colors">
              <CardHeader>
                <CardTitle className="text-white text-lg font-bold">Generate Study Guides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                    Difficulty Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-950/40 border border-white/10 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-violet-500 transition-colors"
                  >
                    <option value="All Levels" className="bg-[#050811] text-slate-200">All Levels</option>
                    <option value="Easy" className="bg-[#050811] text-slate-200">Easy</option>
                    <option value="Medium" className="bg-[#050811] text-slate-200">Medium</option>
                    <option value="Hard" className="bg-[#050811] text-slate-200">Hard</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                    Question Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-950/40 border border-white/10 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-violet-500 transition-colors"
                  >
                    <option value="Technical" className="bg-[#050811] text-slate-200">Technical</option>
                    <option value="HR / Behavioral" className="bg-[#050811] text-slate-200">HR / Behavioral</option>
                    <option value="System Design" className="bg-[#050811] text-slate-200">System Design</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={loadingGuide}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold h-10 transition-all duration-200"
                >
                  {loadingGuide ? '🔮 Compiling guide...' : '🚀 Generate Q&A Guide'}
                </Button>
              </CardContent>
            </Card>
          </form>

          {/* Guide list output */}
          <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md lg:col-span-3 min-h-[350px]">
            <CardHeader>
              <CardTitle className="text-white text-lg font-bold">Study Guide Questions</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingGuide ? (
                <div className="text-center py-20">
                  <div className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-lg font-bold animate-pulse">
                    Compiling technical interview checklist...
                  </div>
                  <p className="text-slate-500 text-xs mt-2">
                    Structuring answers for three experience tiers
                  </p>
                </div>
              ) : guideQuestions.length > 0 ? (
                <div className="space-y-4">
                  {guideQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className="border border-white/10 rounded-lg overflow-hidden bg-slate-950/20"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                        className="w-full text-left bg-slate-950/40 px-4 py-3 text-slate-100 font-semibold text-sm hover:bg-slate-900/50 flex justify-between items-center transition-colors cursor-pointer outline-none"
                      >
                        <span>Question {idx + 1}: {q.question}</span>
                        <span className="text-slate-500 text-xs">{expandedIndex === idx ? '▲' : '▼'}</span>
                      </button>

                      {expandedIndex === idx && (
                        <div className="p-4 space-y-4 text-xs leading-relaxed border-t border-white/5 bg-slate-950/20">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-300">Category:</span>
                            <span className="px-2 py-0.5 text-[10px] font-semibold text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-full">
                              {q.category}
                            </span>
                          </div>
                          <div>
                            <span className="text-emerald-400 font-bold flex items-center gap-1 mb-1">
                              <span>🟢</span> Beginner Response
                            </span>
                            <p className="text-slate-400 bg-slate-950/40 p-2.5 rounded border border-white/5">{q.beginner_answer}</p>
                          </div>
                          <div>
                            <span className="text-amber-400 font-bold flex items-center gap-1 mb-1">
                              <span>🟡</span> Intermediate Response
                            </span>
                            <p className="text-slate-400 bg-slate-950/40 p-2.5 rounded border border-white/5">{q.intermediate_answer}</p>
                          </div>
                          <div>
                            <span className="text-rose-400 font-bold flex items-center gap-1 mb-1">
                              <span>🔴</span> Expert Response
                            </span>
                            <p className="text-slate-400 bg-slate-950/40 p-2.5 rounded border border-white/5">{q.expert_answer}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 text-slate-500 text-sm">
                  Click "Generate Q&A Guide" to compile custom target Q&A guide cards.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Tab 2: Mock simulator */
        <div className="max-w-3xl mx-auto">
          {mockIndex < mockQuestions.length ? (
            <Card className="border border-white/10 border-l-4 border-l-purple-500 bg-slate-900/40 backdrop-blur-md">
              <CardHeader className="pb-3">
                <div className="text-[10px] tracking-wider text-slate-400 mb-1.5 uppercase font-semibold">
                  Mock Question {mockIndex + 1} of {mockQuestions.length}
                </div>
                <CardTitle className="text-xl text-white font-bold">{mockQuestions[mockIndex]}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <form onSubmit={submitAnswer} className="space-y-4">
                  <Textarea
                    placeholder="Type your explanation here..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="bg-slate-950/40 border-white/10 text-white min-h-[160px] focus-visible:border-violet-500/50"
                    disabled={loadingEval || !!currentEval}
                  />

                  {!currentEval ? (
                    <Button
                      type="submit"
                      disabled={loadingEval || !userAnswer}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold h-10 transition-all duration-200"
                    >
                      {loadingEval ? '🔮 Evaluating Response...' : 'Submit Answer'}
                    </Button>
                  ) : (
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={restartMock}
                        className="flex-1 text-slate-200 border-white/10 hover:bg-white/5 h-10"
                      >
                        Restart Session
                      </Button>
                      <Button
                        type="button"
                        onClick={nextQuestion}
                        className="flex-[1.5] bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold h-10"
                      >
                        Next Question
                      </Button>
                    </div>
                  )}
                </form>

                {currentEval && (
                  <div className="border-t border-white/10 pt-5 space-y-4">
                    <div className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                      <span>Grade Score:</span>
                      <span className="text-emerald-400 font-mono text-lg font-bold">{currentEval.score}/100</span>
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold text-slate-300 mb-2">Missing Keywords:</h5>
                      <div className="flex flex-wrap gap-2">
                        {currentEval.missing_keywords.map((term, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-[10px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-full"
                          >
                            {term}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold text-slate-300 mb-1">Suggestions:</h5>
                      <p className="text-slate-450 text-xs leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-white/5">
                        {currentEval.improvements}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            /* Mock Recap */
            <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md text-center">
              <CardHeader className="items-center pb-2">
                <div className="inline-block px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full uppercase mb-2">
                  Recap
                </div>
                <CardTitle className="text-2xl font-bold text-white">Mock Interview Completed!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-6xl font-extrabold text-emerald-400 font-mono py-4">
                  {getAvgScore()}%
                </div>

                <div className="space-y-4 text-left">
                  {history.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-950/40 border border-white/5 rounded-xl space-y-2.5"
                    >
                      <strong className="text-slate-100 text-sm block">
                        Q{idx + 1}: {item.question}
                      </strong>
                      <p className="text-xs text-slate-400 italic">
                        Your Answer: "{item.user_answer}"
                      </p>
                      <div className="text-xs font-semibold text-slate-300">
                        Score: <span className="text-emerald-400 font-mono font-bold">{item.evaluation.score}/100</span>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={restartMock}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold h-10 w-48 mt-4"
                >
                  Restart Session
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
