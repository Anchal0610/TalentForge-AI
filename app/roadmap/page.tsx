'use client';

import React, { useState, useEffect } from 'react';

interface WeeklyPlanStep {
  week: number;
  topic: string;
  resources: string[];
  project_milestone: string;
  certification_suggestion: string | null;
}

interface LearningRoadmap {
  target_role: string;
  weekly_plan: WeeklyPlanStep[];
  estimated_completion_weeks: number;
}

interface CareerReadiness {
  overall_percentage: number;
  profile_strength: number;
  skill_match_strength: number;
  mock_interview_strength: number;
  next_steps: string[];
}

export default function RoadmapPage() {
  const [targetRole, setTargetRole] = useState('MLOps Engineer');
  const [missingSkills, setMissingSkills] = useState<string[]>(['Kubernetes', 'CI/CD Pipelines', 'Pinecone / Vector Databases']);
  const [currentSkills, setCurrentSkills] = useState('Python, Docker, SQL, Flask');
  
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [roadmap, setRoadmap] = useState<LearningRoadmap | null>(null);
  
  const [loadingReadiness, setLoadingReadiness] = useState(false);
  const [readiness, setReadiness] = useState<CareerReadiness | null>(null);
  
  const [error, setError] = useState('');
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedRole = localStorage.getItem('targetRole') || 'MLOps Engineer';
      setTargetRole(savedRole);

      const savedSkills = localStorage.getItem('currentSkills') || 'Python, Docker, SQL, Flask';
      setCurrentSkills(savedSkills);

      const savedGaps = localStorage.getItem('missingSkills');
      if (savedGaps) {
        try {
          setMissingSkills(JSON.parse(savedGaps));
        } catch {
          // ignore
        }
      }

      // Load saved roadmap if exists
      const savedRoadmap = localStorage.getItem('learningRoadmap');
      if (savedRoadmap) {
        try {
          setRoadmap(JSON.parse(savedRoadmap));
        } catch {
          // ignore
        }
      }

      // Load saved readiness if exists
      const savedReadiness = localStorage.getItem('careerReadiness');
      if (savedReadiness) {
        try {
          setReadiness(JSON.parse(savedReadiness));
        } catch {
          // ignore
        }
      }
    }
  }, []);

  const generateRoadmap = async () => {
    setLoadingRoadmap(true);
    setError('');
    setRoadmap(null);
    setExpandedWeek(null);

    try {
      const res = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'roadmap',
          targetRole,
          missingSkills
        })
      });

      if (!res.ok) throw new Error('Failed to generate roadmap curriculum.');
      const data: LearningRoadmap = await res.json();
      setRoadmap(data);
      localStorage.setItem('learningRoadmap', JSON.stringify(data));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingRoadmap(false);
    }
  };

  const computeReadiness = async () => {
    setLoadingReadiness(true);
    setError('');
    setReadiness(null);

    try {
      // Find average score from mock interview logs
      let mockScore = 80;
      const historyStr = localStorage.getItem('mockHistory');
      if (historyStr) {
        try {
          const hist = JSON.parse(historyStr);
          if (hist.length > 0) {
            mockScore = Math.round(hist.reduce((acc: number, h: any) => acc + h.evaluation.score, 0) / hist.length);
          }
        } catch {
          // ignore
        }
      }

      const res = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'readiness',
          targetRole,
          currentSkills,
          missingSkills,
          mockScore
        })
      });

      if (!res.ok) throw new Error('Failed to compute readiness indices.');
      const data: CareerReadiness = await res.json();
      setReadiness(data);
      localStorage.setItem('careerReadiness', JSON.stringify(data));
      localStorage.setItem('overallReadiness', data.overall_percentage.toString());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingReadiness(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--color-green)';
    if (score >= 60) return 'var(--color-orange)';
    return 'var(--color-red)';
  };

  return (
    <div>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>🛣️ Learning Roadmaps & Career Readiness</h1>

      <div className="glass-card">
        <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Plan Your Skill Transition & Trace Success</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Explore your week-by-week custom syllabus complete with milestones and certifications. Monitor your Career Readiness score, structured using weighted profiles, mock transcripts, and core skills match metrics.
        </p>
      </div>

      {error && <div style={{ color: 'var(--color-red)', fontSize: '0.95rem', marginBottom: '20px' }}>⚠️ {error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px', alignItems: 'start' }}>
        {/* Left Column: Weekly syllabus */}
        <div className="glass-card" style={{ minHeight: '350px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h4 style={{ margin: 0 }}>Your Custom Weekly Learning Syllabus</h4>
            <button
              onClick={generateRoadmap}
              className="btn btn-primary"
              disabled={loadingRoadmap}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              {loadingRoadmap ? 'Assembling...' : 'Create Learning Roadmap'}
            </button>
          </div>

          {loadingRoadmap ? (
            <div style={{ textAlign: 'center', marginTop: '80px' }}>
              <div className="gradient-text" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Assembling custom curriculum and projects...</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>Stitching technical tutorials and certification milestones</p>
            </div>
          ) : roadmap ? (
            <div>
              <div style={{ marginBottom: '15px', color: 'var(--color-green)', fontWeight: 600, fontSize: '0.9rem' }}>
                ✓ Target Duration: {roadmap.estimated_completion_weeks} Weeks
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {roadmap.weekly_plan.map((step) => (
                  <div key={step.week} style={{
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    <button
                      onClick={() => setExpandedWeek(expandedWeek === step.week ? null : step.week)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        background: 'rgba(255,255,255,0.02)',
                        border: 'none',
                        padding: '12px 16px',
                        color: 'var(--text-bright)',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>📅 WEEK {step.week}: {step.topic}</span>
                      <span>{expandedWeek === step.week ? '▲' : '▼'}</span>
                    </button>

                    {expandedWeek === step.week && (
                      <div style={{
                        padding: '16px',
                        background: 'rgba(15,23,42,0.3)',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        fontSize: '0.85rem',
                        lineHeight: '1.5',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}>
                        <div>
                          <strong>Core Learning Resources:</strong>
                          <ul style={{ paddingLeft: '20px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {step.resources.map((res, i) => (
                              <li key={i}>📖 {res}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <strong>Weekly Code Milestone:</strong>
                          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }}>💻 {step.project_milestone}</p>
                        </div>
                        {step.certification_suggestion && (
                          <div>
                            <strong>Recommended Certification:</strong>
                            <span className="neon-badge badge-blue" style={{ marginLeft: '8px', marginBottom: 0 }}>{step.certification_suggestion}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '100px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Click "Create Learning Roadmap" to compile a weekly study curriculum.
            </div>
          )}
        </div>

        {/* Right Column: Readiness Scoring */}
        <div className="glass-card" style={{ minHeight: '350px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h4 style={{ margin: 0 }}>Career Readiness & Analytics</h4>
            <button
              onClick={computeReadiness}
              className="btn btn-primary"
              disabled={loadingReadiness}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              {loadingReadiness ? 'Computing...' : 'Compute Readiness Score'}
            </button>
          </div>

          {loadingReadiness ? (
            <div style={{ textAlign: 'center', marginTop: '80px' }}>
              <div className="gradient-text" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Analyzing candidate performance profiles...</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>Querying DB entries and compiling capability scales</p>
            </div>
          ) : readiness ? (
            <div>
              {/* Readiness Grade badge */}
              <div style={{
                textAlign: 'center',
                border: `1px solid ${getScoreColor(readiness.overall_percentage)}`,
                background: 'rgba(15, 23, 42, 0.45)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>INDEX LEVEL</div>
                <div style={{
                  fontSize: '3.5rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-title)',
                  color: getScoreColor(readiness.overall_percentage)
                }}>
                  {readiness.overall_percentage}%
                </div>
              </div>

              {/* Breakdown */}
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                <strong>Assessment Weights Breakdown:</strong>
                <div>- Resume strength weight: <code style={{ color: 'var(--text-bright)' }}>{readiness.profile_strength}%</code></div>
                <div>- Technical skills fit weight: <code style={{ color: 'var(--text-bright)' }}>{readiness.skill_match_strength}%</code></div>
                <div>- Mock interview proficiency weight: <code style={{ color: 'var(--text-bright)' }}>{readiness.mock_interview_strength}%</code></div>
              </div>

              {/* Next Steps */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '15px' }}>
                <strong style={{ color: 'var(--text-bright)', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>
                  Next Immediate Steps:
                </strong>
                <ul style={{ paddingLeft: '20px', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px', lineHeight: '1.5' }}>
                  {readiness.next_steps.map((step, i) => (
                    <li key={i}>📈 {step}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '100px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Click "Compute Readiness Score" to calculate candidate analytics coefficients.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
