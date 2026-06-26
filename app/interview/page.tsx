'use client';

import React, { useState, useEffect } from 'react';

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
    <div>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>🎤 AI Interview Preparation Suite</h1>

      <div className="glass-card">
        <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Prepare for Live Assessments</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Generate target-focused questions, study multi-tiered responses (Beginner, Intermediate, Expert), and simulate an interactive mock evaluation. The engine analyzes your answer's keywords and coverage, suggesting key improvement steps.
        </p>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <button
          onClick={() => setActiveTab('guide')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'guide' ? '2px solid var(--color-purple)' : '2px solid transparent',
            color: activeTab === 'guide' ? 'var(--text-bright)' : 'var(--text-muted)',
            padding: '10px 15px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          📚 Question & Answer Bank
        </button>
        <button
          onClick={() => setActiveTab('mock')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'mock' ? '2px solid var(--color-purple)' : '2px solid transparent',
            color: activeTab === 'mock' ? 'var(--text-bright)' : 'var(--text-muted)',
            padding: '10px 15px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          🤖 Mock Interview Sim
        </button>
      </div>

      {activeTab === 'guide' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px', alignItems: 'start' }}>
          {/* Q&A Parameters Form */}
          <form onSubmit={generateGuide} className="glass-card">
            <h4 style={{ marginBottom: '16px' }}>Generate Study Guides</h4>

            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              DIFFICULTY LEVEL
            </label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="All Levels">All Levels</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              QUESTION CATEGORY
            </label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="Technical">Technical</option>
              <option value="HR / Behavioral">HR / Behavioral</option>
              <option value="System Design">System Design</option>
            </select>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loadingGuide}
              style={{ width: '100%' }}
            >
              {loadingGuide ? '🔮 Compiling guide...' : '🚀 Generate Q&A Guide'}
            </button>
          </form>

          {/* Guide list output */}
          <div className="glass-card" style={{ minHeight: '350px' }}>
            <h4 style={{ marginBottom: '16px' }}>Study Guide Questions</h4>

            {loadingGuide ? (
              <div style={{ textAlign: 'center', marginTop: '80px' }}>
                <div className="gradient-text" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Compiling technical interview checklist...</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>Structuring answers for three experience tiers</p>
              </div>
            ) : guideQuestions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {guideQuestions.map((q, idx) => (
                  <div key={idx} style={{
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    <button
                      onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        background: 'rgba(255,255,255,0.02)',
                        border: 'none',
                        padding: '14px 18px',
                        color: 'var(--text-bright)',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>Question {idx + 1}: {q.question}</span>
                      <span>{expandedIndex === idx ? '▲' : '▼'}</span>
                    </button>

                    {expandedIndex === idx && (
                      <div style={{
                        padding: '18px',
                        background: 'rgba(15, 23, 42, 0.3)',
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        fontSize: '0.85rem',
                        lineHeight: '1.6',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        <div>
                          <strong>Category:</strong> <span className="neon-badge badge-blue" style={{ marginBottom: 0 }}>{q.category}</span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--color-green)', fontWeight: 'bold' }}>🟢 Beginner Response:</span>
                          <p style={{ color: 'var(--text-muted)' }}>{q.beginner_answer}</p>
                        </div>
                        <div>
                          <span style={{ color: 'var(--color-orange)', fontWeight: 'bold' }}>🟡 Intermediate Response:</span>
                          <p style={{ color: 'var(--text-muted)' }}>{q.intermediate_answer}</p>
                        </div>
                        <div>
                          <span style={{ color: 'var(--color-red)', fontWeight: 'bold' }}>🔴 Expert Response:</span>
                          <p style={{ color: 'var(--text-muted)' }}>{q.expert_answer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', marginTop: '100px', color: 'var(--text-muted)' }}>
                Click "Generate Q&A Guide" to compile custom target Q&A guide cards.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Tab 2: Mock simulator */
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {mockIndex < mockQuestions.length ? (
            <div className="glass-card" style={{ borderLeft: '5px solid var(--color-purple)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                MOCK QUESTION {mockIndex + 1} OF {mockQuestions.length}
              </div>
              <h4 style={{ fontSize: '1.2rem', color: 'var(--text-bright)', marginBottom: '20px' }}>
                {mockQuestions[mockIndex]}
              </h4>

              <form onSubmit={submitAnswer}>
                <textarea
                  placeholder="Type your explanation here..."
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  style={{ height: '140px' }}
                  disabled={loadingEval || !!currentEval}
                />

                {!currentEval ? (
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loadingEval || !userAnswer}
                    style={{ width: '100%' }}
                  >
                    {loadingEval ? '🔮 Evaluating Response...' : 'Submit Answer'}
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={restartMock}
                      style={{ flex: 1 }}
                    >
                      Restart Session
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={nextQuestion}
                      style={{ flex: 1.5 }}
                    >
                      Next Question
                    </button>
                  </div>
                )}
              </form>

              {currentEval && (
                <div style={{
                  marginTop: '25px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ fontSize: '1.1rem' }}>
                    Grade Score: <strong style={{ color: 'var(--color-green)' }}>{currentEval.score}/100</strong>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-bright)', fontSize: '0.9rem' }}>Missing Keywords:</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {currentEval.missing_keywords.map((term, i) => (
                        <span key={i} className="neon-badge badge-orange" style={{ marginBottom: 0 }}>{term}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-bright)', fontSize: '0.9rem' }}>Suggestions:</strong>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px', lineHeight: '1.5' }}>
                      {currentEval.improvements}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Mock Recap */
            <div className="glass-card" style={{ textAlign: 'center' }}>
              <div className="neon-badge badge-green">Recap</div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Mock Interview Completed!</h3>

              <div style={{
                fontSize: '3.5rem',
                fontWeight: 700,
                color: 'var(--color-green)',
                fontFamily: 'var(--font-title)',
                marginBottom: '30px'
              }}>
                {getAvgScore()}%
              </div>

              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
                {history.map((item, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    padding: '16px',
                    borderRadius: '8px'
                  }}>
                    <strong style={{ color: 'var(--text-bright)', display: 'block', marginBottom: '6px' }}>
                      Q{idx + 1}: {item.question}
                    </strong>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      Your Answer: <em>"{item.user_answer}"</em>
                    </p>
                    <div style={{ fontSize: '0.85rem' }}>
                      Score: <strong style={{ color: 'var(--color-green)' }}>{item.evaluation.score}/100</strong>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={restartMock} className="btn btn-primary" style={{ width: '200px' }}>
                Restart Session
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
