'use client';

import React, { useState, useEffect } from 'react';
import { useCareer } from '@/components/CareerContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  MessageSquare, 
  BookOpen, 
  PlayCircle, 
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Award
} from 'lucide-react';
import Link from 'next/link';

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
  const { sessionData, loading, loadSession } = useCareer();
  const [emailInput, setEmailInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'guide' | 'mock'>('guide');

  // Parameters
  const [categoryType, setCategoryType] = useState<'Technical' | 'Behavioral'>('Technical');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Mock simulator state
  const [mockIndex, setMockIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [loadingEval, setLoadingEval] = useState(false);
  const [currentEval, setCurrentEval] = useState<EvaluationResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Auto-fill questions from context
  const guideQuestions: QuestionGuide[] = sessionData
    ? categoryType === 'Technical'
      ? sessionData.interview_questions.technical
      : sessionData.interview_questions.behavioral
    : [];

  const mockQuestions: string[] = sessionData
    ? [
        ...sessionData.interview_questions.technical.slice(0, 3).map(q => q.question),
        ...sessionData.interview_questions.behavioral.slice(0, 2).map(q => q.question)
      ]
    : [];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!emailInput) return;
    const found = await loadSession(emailInput);
    if (!found) {
      setErrorMsg('No session record found for this email. Please upload your resume first.');
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEval(false);
    }
  };

  const nextQuestion = () => {
    setMockIndex(prev => prev + 1);
    setUserAnswer('');
    setCurrentEval(null);
  };

  const restartMock = () => {
    setMockIndex(0);
    setUserAnswer('');
    setCurrentEval(null);
    setHistory([]);
  };

  const getAvgScore = () => {
    if (history.length === 0) return 0;
    const total = history.reduce((acc, h) => acc + h.evaluation.score, 0);
    return Math.round(total / history.length);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/30 pb-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
            <MessageSquare className="text-accent w-6 h-6" /> Interview Prep
          </h1>
          <p className="text-xs text-muted">Practice role-specific technical and behavioral questions graded instantly by AI experts</p>
        </div>
      </div>

      {/* 2. No Session State */}
      {!sessionData ? (
        <Card className="bg-surface border-border p-8 text-center max-w-xl mx-auto space-y-6 mt-10">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto text-accent">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white uppercase tracking-wide">No Active Profile Session</h2>
            <p className="text-xs text-muted leading-relaxed">
              Nexora AI needs your target role and skills to compile custom interview guides. Upload your resume or restore a previous session to start.
            </p>
          </div>

          <div className="border-t border-border/30 pt-6">
            <form onSubmit={handleLoginSubmit} className="space-y-3 max-w-sm mx-auto">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Email Address</label>
                <Input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="bg-zinc-950 border-border text-white text-xs h-9"
                />
              </div>
              {errorMsg && (
                <p className="text-rose-400 text-[11px] font-medium text-left">{errorMsg}</p>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-white hover:bg-zinc-200 text-black font-bold h-9 text-xs uppercase tracking-wider transition-colors rounded cursor-pointer"
              >
                {loading ? 'Searching...' : 'Restore Session'}
              </Button>
            </form>
          </div>

          <div className="text-xs text-muted">
            OR{' '}
            <Link href="/document-hub" className="text-accent underline font-semibold hover:text-accent-glow">
              Upload Resume in Document Hub
            </Link>
          </div>
        </Card>
      ) : (
        /* 3. Session Active View */
        <div className="space-y-6">
          {/* Tab Selector */}
          <div className="flex border-b border-border/30 gap-4">
            <button
              onClick={() => setActiveTab('guide')}
              className={cn(
                "pb-3 text-xs tracking-wider uppercase font-bold border-b-2 px-1 transition-all cursor-pointer",
                activeTab === 'guide' 
                  ? "text-accent border-accent font-extrabold" 
                  : "text-muted border-transparent hover:text-white"
              )}
            >
              Q&A Study Guide
            </button>
            <button
              onClick={() => setActiveTab('mock')}
              className={cn(
                "pb-3 text-xs tracking-wider uppercase font-bold border-b-2 px-1 transition-all cursor-pointer",
                activeTab === 'mock' 
                  ? "text-accent border-accent font-extrabold" 
                  : "text-muted border-transparent hover:text-white"
              )}
            >
              Mock Interview Simulator
            </button>
          </div>

          {activeTab === 'guide' ? (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
              {/* Left Column Controls */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="bg-surface border-border p-5 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">Guide Settings</h3>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Select Category</label>
                    <select
                      value={categoryType}
                      onChange={(e) => {
                        setCategoryType(e.target.value as any);
                        setExpandedIndex(null);
                      }}
                      className="w-full h-9 px-3 bg-zinc-950 border border-border rounded text-xs text-white focus:outline-none focus:border-accent transition-colors"
                    >
                      <option value="Technical">Technical (10 Questions)</option>
                      <option value="Behavioral">Behavioral (5 Questions)</option>
                    </select>
                  </div>

                  <div className="p-3 bg-zinc-950 border border-border rounded text-[11px] text-muted leading-relaxed">
                    These questions are custom generated by Mistral LLM to target your gaps in <strong>{sessionData.target_role}</strong>.
                  </div>
                </Card>
              </div>

              {/* Right Column List */}
              <Card className="bg-surface border-border lg:col-span-3 p-5 min-h-[350px]">
                <CardHeader className="p-0 pb-3 border-b border-border/30">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1">
                    <BookOpen className="w-4 h-4 text-accent" /> Custom Questions Guide
                  </CardTitle>
                </CardHeader>
                <div className="pt-4 space-y-3">
                  {guideQuestions.map((q, idx) => (
                    <div 
                      key={idx}
                      className="border border-border/85 rounded overflow-hidden bg-zinc-950/20"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                        className="w-full text-left bg-zinc-950/40 px-4 py-3 text-slate-100 font-semibold text-xs hover:bg-zinc-900/50 flex justify-between items-center transition-colors cursor-pointer outline-none uppercase font-mono"
                      >
                        <span>Q{idx + 1}: {q.question}</span>
                        <span className="text-zinc-500 text-[10px]">{expandedIndex === idx ? '▲' : '▼'}</span>
                      </button>

                      {expandedIndex === idx && (
                        <div className="p-4 space-y-4 text-xs leading-relaxed border-t border-border bg-zinc-955/20">
                          <div>
                            <strong className="text-emerald-400 font-bold block mb-1 uppercase text-[9px] tracking-wider">Beginner Answer</strong>
                            <p className="text-zinc-350 bg-zinc-950 p-2.5 rounded border border-border/60">{q.beginner_answer}</p>
                          </div>
                          <div>
                            <strong className="text-amber-400 font-bold block mb-1 uppercase text-[9px] tracking-wider">Intermediate Answer</strong>
                            <p className="text-zinc-350 bg-zinc-950 p-2.5 rounded border border-border/60">{q.intermediate_answer}</p>
                          </div>
                          <div>
                            <strong className="text-fuchsia-400 font-bold block mb-1 uppercase text-[9px] tracking-wider">Expert Answer</strong>
                            <p className="text-zinc-350 bg-zinc-950 p-2.5 rounded border border-border/60">{q.expert_answer}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            /* Simulator Tab */
            <div className="max-w-3xl mx-auto">
              {mockIndex < mockQuestions.length ? (
                <Card className="bg-surface border-border border-l-4 border-l-accent p-5 space-y-4">
                  <div className="text-[10px] tracking-wider text-muted font-bold uppercase">
                    Mock Question {mockIndex + 1} of {mockQuestions.length}
                  </div>
                  <h3 className="text-base text-white font-extrabold uppercase tracking-wide">
                    {mockQuestions[mockIndex]}
                  </h3>

                  <form onSubmit={submitAnswer} className="space-y-4 pt-2">
                    <Textarea
                      required
                      placeholder="Input your explanation answer here..."
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      className="bg-zinc-950 border-border text-white min-h-[150px] text-xs"
                      disabled={loadingEval || !!currentEval}
                    />

                    {!currentEval ? (
                      <Button
                        type="submit"
                        disabled={loadingEval || !userAnswer}
                        className="w-full bg-accent hover:bg-accent-glow text-white font-bold h-9 text-xs uppercase tracking-wider transition-colors rounded cursor-pointer"
                      >
                        {loadingEval ? 'Evaluating Answer...' : 'Submit Response'}
                      </Button>
                    ) : (
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={restartMock}
                          className="flex-1 text-slate-200 border-border hover:bg-zinc-900 h-9 text-xs uppercase tracking-wider rounded cursor-pointer"
                        >
                          Restart Simulator
                        </Button>
                        <Button
                          type="button"
                          onClick={nextQuestion}
                          className="flex-[1.5] bg-white hover:bg-zinc-200 text-black font-bold h-9 text-xs uppercase tracking-wider rounded cursor-pointer"
                        >
                          Next Question
                        </Button>
                      </div>
                    )}
                  </form>

                  {currentEval && (
                    <div className="border-t border-border/30 pt-4 space-y-3.5">
                      <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Award className="w-4 h-4 text-accent" />
                        <span>AI Interview Evaluation Score:</span>
                        <Badge className="bg-accent/15 text-accent border border-accent/25 font-mono text-xs font-bold py-0.5 px-2">
                          {currentEval.score} / 100
                        </Badge>
                      </div>
                      <div>
                        <h5 className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Key Missing Keywords</h5>
                        <div className="flex flex-wrap gap-1.5">
                          {currentEval.missing_keywords.map((term, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 text-[9px] font-semibold text-rose-400 bg-rose-500/5 border border-rose-500/25 rounded uppercase font-mono"
                            >
                              {term}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h5 className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Suggested Improvements</h5>
                        <p className="text-zinc-350 text-xs leading-relaxed bg-zinc-950 p-3 rounded border border-border">
                          {currentEval.improvements}
                        </p>
                      </div>
                    </div>
                  )}
                </Card>
              ) : (
                /* Mock Recap View */
                <Card className="bg-surface border-border p-5 text-center space-y-6">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto text-accent">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white uppercase">Mock Interview Simulation Completed</h3>
                    <p className="text-xs text-muted mt-1">Below is the analysis recap of your practice session</p>
                  </div>

                  <div className="text-5xl font-extrabold text-white font-mono py-2">
                    {getAvgScore()}%
                  </div>

                  <div className="space-y-4 text-left border-t border-border/30 pt-4">
                    {history.map((item, idx) => (
                      <div 
                        key={idx}
                        className="p-4 bg-zinc-950/40 border border-border/55 rounded space-y-2"
                      >
                        <strong className="text-white text-xs block uppercase font-mono">Q{idx + 1}: {item.question}</strong>
                        <p className="text-xs text-muted italic">"{item.user_answer}"</p>
                        <div className="flex justify-between text-xs font-semibold text-zinc-300">
                          <span>Grade Score:</span>
                          <span className="text-accent font-bold font-mono">{item.evaluation.score} / 100</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={restartMock}
                    className="bg-white hover:bg-zinc-200 text-black font-bold h-9 px-6 text-xs uppercase tracking-wider rounded cursor-pointer"
                  >
                    Restart Mock Session
                  </Button>
                </Card>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
