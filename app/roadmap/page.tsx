'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

  const getScoreTextColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getScoreBorderColor = (score: number) => {
    if (score >= 80) return 'border-emerald-500/30';
    if (score >= 60) return 'border-amber-500/30';
    return 'border-rose-500/30';
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">🛣️ Learning Roadmaps & Career Readiness</h1>
        <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md mt-4">
          <CardContent className="pt-6">
            <h3 className="text-base font-semibold text-slate-200 mb-1.5">Plan Your Skill Transition & Trace Success</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Explore your week-by-week custom syllabus complete with milestones and certifications. Monitor your Career Readiness score, structured using weighted profiles, mock transcripts, and core skills match metrics.
            </p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="text-rose-400 text-sm font-medium flex items-center gap-1.5">
          <span>⚠️</span> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Left Column: Weekly syllabus */}
        <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md lg:col-span-3 min-h-[350px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white text-lg font-bold">Your Weekly Learning Syllabus</CardTitle>
            <Button
              onClick={generateRoadmap}
              disabled={loadingRoadmap}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold h-9 px-4 text-xs transition-all duration-200"
            >
              {loadingRoadmap ? 'Assembling...' : 'Create Roadmap'}
            </Button>
          </CardHeader>
          <CardContent>
            {loadingRoadmap ? (
              <div className="text-center py-20">
                <div className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-lg font-bold animate-pulse">
                  Assembling custom curriculum and projects...
                </div>
                <p className="text-slate-500 text-xs mt-2">
                  Stitching technical tutorials and certification milestones
                </p>
              </div>
            ) : roadmap ? (
              <div className="space-y-4">
                <div className="text-emerald-400 font-semibold text-xs flex items-center gap-1">
                  <span>✓</span> Target Duration: {roadmap.estimated_completion_weeks} Weeks
                </div>

                <div className="space-y-3">
                  {roadmap.weekly_plan.map((step) => (
                    <div
                      key={step.week}
                      className="border border-white/10 rounded-lg overflow-hidden bg-slate-950/20"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedWeek(expandedWeek === step.week ? null : step.week)}
                        className="w-full text-left bg-slate-950/45 px-4 py-3 text-slate-100 font-semibold text-sm hover:bg-slate-900/50 flex justify-between items-center transition-colors cursor-pointer outline-none"
                      >
                        <span>📅 WEEK {step.week}: {step.topic}</span>
                        <span className="text-slate-500 text-xs">{expandedWeek === step.week ? '▲' : '▼'}</span>
                      </button>

                      {expandedWeek === step.week && (
                        <div className="p-4 space-y-3.5 text-xs leading-relaxed border-t border-white/5 bg-slate-950/20">
                          <div>
                            <strong className="text-slate-350 block mb-1">Core Learning Resources:</strong>
                            <ul className="space-y-1 text-slate-400 pl-1">
                              {step.resources.map((res, i) => (
                                <li key={i} className="flex items-center gap-1.5">
                                  <span className="text-blue-500">•</span>
                                  <span>{res}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <strong className="text-slate-355 block">Weekly Code Milestone:</strong>
                            <p className="text-slate-400 italic mt-1 pl-1">💻 {step.project_milestone}</p>
                          </div>
                          {step.certification_suggestion && (
                            <div className="flex items-center gap-2 pt-1">
                              <strong className="text-slate-350">Suggested Cert:</strong>
                              <span className="px-2 py-0.5 text-[10px] font-semibold text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-full">
                                {step.certification_suggestion}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-24 text-slate-500 text-sm">
                Click "Create Roadmap" to compile a weekly study curriculum.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Readiness Scoring */}
        <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md lg:col-span-2 min-h-[350px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white text-lg font-bold">Readiness Analytics</CardTitle>
            <Button
              onClick={computeReadiness}
              disabled={loadingReadiness}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold h-9 px-4 text-xs transition-all duration-200"
            >
              {loadingReadiness ? 'Computing...' : 'Compute Score'}
            </Button>
          </CardHeader>
          <CardContent>
            {loadingReadiness ? (
              <div className="text-center py-20">
                <div className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-lg font-bold animate-pulse">
                  Analyzing performance profiles...
                </div>
                <p className="text-slate-500 text-xs mt-2">
                  Querying database entries and compiling capability scales
                </p>
              </div>
            ) : readiness ? (
              <div className="space-y-6">
                {/* Readiness Grade badge */}
                <div className={cn(
                  "text-center border rounded-xl p-6 bg-slate-950/40 backdrop-blur-sm",
                  getScoreBorderColor(readiness.overall_percentage)
                )}>
                  <div className="text-slate-400 text-xs tracking-widest uppercase font-semibold">INDEX LEVEL</div>
                  <div className={cn(
                    "text-5xl font-extrabold mt-2 font-mono",
                    getScoreTextColor(readiness.overall_percentage)
                  )}>
                    {readiness.overall_percentage}%
                  </div>
                </div>

                {/* Breakdown */}
                <div className="text-xs space-y-2 border-t border-white/10 pt-4">
                  <strong className="text-slate-200 block mb-1">Assessment Weights Breakdown:</strong>
                  <div className="flex justify-between text-slate-400">
                    <span>Resume strength weight:</span>
                    <code className="text-slate-200 font-semibold">{readiness.profile_strength}%</code>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Technical skills fit weight:</span>
                    <code className="text-slate-200 font-semibold">{readiness.skill_match_strength}%</code>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Mock interview proficiency weight:</span>
                    <code className="text-slate-200 font-semibold">{readiness.mock_interview_strength}%</code>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="border-t border-white/10 pt-4">
                  <h5 className="text-sm font-semibold text-slate-200 mb-2.5">Next Immediate Steps:</h5>
                  <ul className="space-y-2 text-slate-400 text-xs pl-1">
                    {readiness.next_steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-24 text-slate-500 text-sm">
                Click "Compute Score" to calculate candidate analytics coefficients.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
