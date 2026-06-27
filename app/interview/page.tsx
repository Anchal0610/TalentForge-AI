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
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2 uppercase">AI Interview Preparation Suite</h1>
        <Card className="border border-zinc-850 bg-[#09090b]">
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold text-slate-200 mb-1.5 uppercase">Prepare for Live Assessments</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Generate target-focused questions, study multi-tiered responses (Beginner, Intermediate, Expert), and simulate an interactive mock evaluation. The engine analyzes your answer's keywords and coverage, suggesting key improvement steps.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-4 border-b border-zinc-850 pb-px">
        <button
          onClick={() => setActiveTab('guide')}
          className={cn(
            "px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-150 outline-none",
            activeTab === 'guide'
              ? "border-white text-white"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          )}
        >
          Question & Answer Bank
        </button>
        <button
          onClick={() => setActiveTab('mock')}
          className={cn(
            "px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-150 outline-none",
            activeTab === 'mock'
              ? "border-white text-white"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          )}
        >
          Mock Interview Sim
        </button>
      </div>

      {activeTab === 'guide' ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Q&A Parameters Form */}
          <form onSubmit={generateGuide} className="lg:col-span-2">
            <Card className="border border-zinc-850 bg-[#09090b] hover:border-zinc-750 transition-colors">
              <CardHeader className="border-b border-zinc-900 pb-3">
                <CardTitle className="text-white text-sm font-bold uppercase tracking-wider">Generate Study Guides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                    Difficulty Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full h-10 px-3 bg-zinc-950 border border-zinc-850 rounded text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 transition-colors"
                  >
                    <option value="All Levels" className="bg-black text-slate-200">All Levels</option>
                    <option value="Easy" className="bg-black text-slate-200">Easy</option>
                    <option value="Medium" className="bg-black text-slate-200">Medium</option>
                    <option value="Hard" className="bg-black text-slate-200">Hard</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                    Question Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 px-3 bg-zinc-950 border border-zinc-850 rounded text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 transition-colors"
                  >
                    <option value="Technical" className="bg-black text-slate-200">Technical</option>
                    <option value="HR / Behavioral" className="bg-black text-slate-200">HR / Behavioral</option>
                    <option value="System Design" className="bg-black text-slate-200">System Design</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={loadingGuide}
                  className="w-full bg-white hover:bg-zinc-200 text-black font-bold h-9 text-xs uppercase tracking-wider transition-colors rounded"
                >
                  {loadingGuide ? 'Compiling guide...' : 'Generate Q&A Guide'}
                </Button>
              </CardContent>
            </Card>
          </form>

          {/* Guide list output */}
          <Card className="border border-zinc-850 bg-[#09090b] lg:col-span-3 min-h-[350px]">
            <CardHeader className="border-b border-zinc-900 pb-3">
              <CardTitle className="text-white text-sm font-bold uppercase tracking-wider">Study Guide Questions</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {loadingGuide ? (
                <div className="text-center py-20">
                  <div className="text-white text-sm font-bold animate-pulse uppercase tracking-wider">
                    Compiling technical interview checklist...
                  </div>
                  <p className="text-zinc-500 text-[10px] mt-1.5 uppercase font-mono">
                    Structuring answers for three experience tiers
                  </p>
                </div>
              ) : guideQuestions.length > 0 ? (
                <div className="space-y-4">
                  {guideQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className="border border-zinc-850 rounded overflow-hidden bg-zinc-950/20"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                        className="w-full text-left bg-zinc-950/40 px-4 py-3 text-slate-100 font-semibold text-xs hover:bg-zinc-900/50 flex justify-between items-center transition-colors cursor-pointer outline-none uppercase font-mono"
                      >
                        <span>Question {idx + 1}: {q.question}</span>
                        <span className="text-zinc-500 text-[10px]">{expandedIndex === idx ? '▲' : '▼'}</span>
                      </button>

                      {expandedIndex === idx && (
                        <div className="p-4 space-y-4 text-xs leading-relaxed border-t border-zinc-900 bg-zinc-955/20">
                          <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider">
                            <span className="text-zinc-500">Category:</span>
                            <span className="px-2 py-0.5 text-zinc-300 bg-zinc-900 border border-zinc-800 rounded">
                              {q.category}
                            </span>
                          </div>
                          <div>
                            <span className="text-white font-bold block mb-1 uppercase text-[10px] tracking-wider">
                              Beginner Response
                            </span>
                            <p className="text-zinc-400 bg-zinc-950 p-2.5 rounded border border-zinc-900">{q.beginner_answer}</p>
                          </div>
                          <div>
                            <span className="text-zinc-300 font-bold block mb-1 uppercase text-[10px] tracking-wider">
                              Intermediate Response
                            </span>
                            <p className="text-zinc-400 bg-zinc-950 p-2.5 rounded border border-zinc-900">{q.intermediate_answer}</p>
                          </div>
                          <div>
                            <span className="text-zinc-400 font-bold block mb-1 uppercase text-[10px] tracking-wider">
                              Expert Response
                            </span>
                            <p className="text-zinc-450 bg-zinc-950 p-2.5 rounded border border-zinc-900">{q.expert_answer}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 text-zinc-500 text-xs uppercase tracking-wider font-mono">
                  Click "Generate Q&A Guide" to compile guide cards.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Tab 2: Mock simulator */
        <div className="max-w-3xl mx-auto">
          {mockIndex < mockQuestions.length ? (
            <Card className="border border-zinc-850 border-l-4 border-l-white bg-[#09090b]">
              <CardHeader className="pb-3 border-b border-zinc-900">
                <div className="text-[10px] tracking-wider text-zinc-500 mb-1.5 uppercase font-bold">
                  Mock Question {mockIndex + 1} of {mockQuestions.length}
                </div>
                <CardTitle className="text-base text-white font-bold uppercase tracking-wide">{mockQuestions[mockIndex]}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-4">
                <form onSubmit={submitAnswer} className="space-y-4">
                  <Textarea
                    placeholder="Type your explanation here..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="bg-zinc-950 border-zinc-850 text-white min-h-[160px] focus-visible:border-zinc-500 text-xs"
                    disabled={loadingEval || !!currentEval}
                  />

                  {!currentEval ? (
                    <Button
                      type="submit"
                      disabled={loadingEval || !userAnswer}
                      className="w-full bg-white hover:bg-zinc-200 text-black font-bold h-9 text-xs uppercase tracking-wider transition-colors rounded"
                    >
                      {loadingEval ? 'Evaluating Response...' : 'Submit Answer'}
                    </Button>
                  ) : (
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={restartMock}
                        className="flex-1 text-slate-200 border-zinc-850 hover:bg-zinc-900 h-9 text-xs uppercase tracking-wider rounded"
                      >
                        Restart Session
                      </Button>
                      <Button
                        type="button"
                        onClick={nextQuestion}
                        className="flex-[1.5] bg-white hover:bg-zinc-200 text-black font-bold h-9 text-xs uppercase tracking-wider rounded"
                      >
                        Next Question
                      </Button>
                    </div>
                  )}
                </form>

                {currentEval && (
                  <div className="border-t border-zinc-900 pt-5 space-y-4">
                    <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <span>Grade Score:</span>
                      <span className="text-white font-mono text-base font-bold">{currentEval.score}/100</span>
                    </div>
                    <div>
                      <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Missing Keywords</h5>
                      <div className="flex flex-wrap gap-1.5">
                        {currentEval.missing_keywords.map((term, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-0.5 text-[9px] font-semibold text-zinc-350 bg-zinc-900 border border-zinc-800 rounded uppercase font-mono"
                          >
                            {term}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Suggestions</h5>
                      <p className="text-zinc-400 text-xs leading-relaxed bg-zinc-955 p-3 rounded border border-zinc-900 font-sans">
                        {currentEval.improvements}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            /* Mock Recap */
            <Card className="border border-zinc-850 bg-[#09090b] text-center">
              <CardHeader className="items-center pb-2">
                <div className="inline-block px-2.5 py-0.5 text-[9px] font-bold tracking-wider text-zinc-300 bg-zinc-900 border border-zinc-850 rounded uppercase mb-2">
                  Recap
                </div>
                <CardTitle className="text-lg font-bold text-white uppercase tracking-wider">Mock Interview Completed</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-6xl font-extrabold text-white font-mono py-4">
                  {getAvgScore()}%
                </div>

                <div className="space-y-4 text-left">
                  {history.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-zinc-950/40 border border-zinc-900 rounded space-y-2.5"
                    >
                      <strong className="text-white text-xs block uppercase font-mono">
                        Q{idx + 1}: {item.question}
                      </strong>
                      <p className="text-xs text-zinc-400 italic">
                        Your Answer: "{item.user_answer}"
                      </p>
                      <div className="text-xs font-semibold text-zinc-300 flex justify-between">
                        <span>Evaluation:</span>
                        <span className="text-white font-mono font-bold">{item.evaluation.score}/100</span>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={restartMock}
                  className="bg-white hover:bg-zinc-200 text-black font-bold h-9 w-48 mt-4 text-xs uppercase tracking-wider rounded"
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
