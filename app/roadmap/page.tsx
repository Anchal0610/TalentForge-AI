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
    if (score >= 80) return 'text-white';
    if (score >= 60) return 'text-zinc-300';
    return 'text-zinc-450';
  };

  const getScoreBorderColor = (score: number) => {
    if (score >= 80) return 'border-white/40';
    if (score >= 60) return 'border-zinc-700';
    return 'border-zinc-850';
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2 uppercase">Learning Roadmaps & Career Readiness</h1>
        <Card className="border border-zinc-850 bg-[#09090b]">
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold text-slate-200 mb-1.5 uppercase">Plan Your Skill Transition & Trace Success</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Explore your week-by-week custom syllabus complete with milestones and certifications. Monitor your Career Readiness score, structured using weighted profiles, mock transcripts, and core skills match metrics.
            </p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="text-rose-450 text-xs font-semibold">
          Error: {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Left Column: Weekly syllabus */}
        <Card className="border border-zinc-850 bg-[#09090b] lg:col-span-3 min-h-[350px]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-900 pb-3">
            <CardTitle className="text-white text-sm font-bold uppercase tracking-wider">Weekly Learning Syllabus</CardTitle>
            <Button
              onClick={generateRoadmap}
              disabled={loadingRoadmap}
              className="bg-white hover:bg-zinc-200 text-black font-bold h-8 px-4 text-xs transition-colors rounded uppercase tracking-wider"
            >
              {loadingRoadmap ? 'Assembling...' : 'Create Roadmap'}
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {loadingRoadmap ? (
              <div className="text-center py-20">
                <div className="text-white text-sm font-bold animate-pulse uppercase tracking-wider">
                  Assembling custom curriculum and projects...
                </div>
                <p className="text-zinc-500 text-[10px] mt-1.5 uppercase font-mono">
                  Stitching technical tutorials and certification milestones
                </p>
              </div>
            ) : roadmap ? (
              <div className="space-y-4">
                <div className="text-zinc-300 font-semibold text-xs uppercase font-mono">
                  Target Duration: {roadmap.estimated_completion_weeks} Weeks
                </div>

                <div className="space-y-3">
                  {roadmap.weekly_plan.map((step) => (
                    <div
                      key={step.week}
                      className="border border-zinc-850 rounded overflow-hidden bg-zinc-950/20"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedWeek(expandedWeek === step.week ? null : step.week)}
                        className="w-full text-left bg-zinc-950/45 px-4 py-3 text-slate-100 font-semibold text-xs hover:bg-zinc-900/50 flex justify-between items-center transition-colors cursor-pointer outline-none uppercase font-mono"
                      >
                        <span>Week {step.week}: {step.topic}</span>
                        <span className="text-zinc-500 text-[10px]">{expandedWeek === step.week ? '▲' : '▼'}</span>
                      </button>

                      {expandedWeek === step.week && (
                        <div className="p-4 space-y-3.5 text-xs leading-relaxed border-t border-zinc-900 bg-zinc-955/20">
                          <div>
                            <strong className="text-zinc-350 block mb-1 uppercase text-[10px] tracking-wide">Core Learning Resources</strong>
                            <ul className="space-y-1 text-zinc-400 pl-0.5">
                              {step.resources.map((res, i) => (
                                <li key={i} className="flex items-center gap-2">
                                  <span className="text-white font-mono font-bold">-</span>
                                  <span>{res}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <strong className="text-zinc-355 block uppercase text-[10px] tracking-wide">Weekly Code Milestone</strong>
                            <p className="text-zinc-400 italic mt-1 pl-0.5">💻 {step.project_milestone}</p>
                          </div>
                          {step.certification_suggestion && (
                            <div className="flex items-center gap-2 pt-1 border-t border-zinc-900 mt-2">
                              <strong className="text-zinc-500 uppercase text-[9px] tracking-wide">Suggested Cert:</strong>
                              <span className="px-2 py-0.5 text-[10px] font-semibold text-zinc-300 bg-zinc-900 border border-zinc-800 rounded font-mono">
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
              <div className="text-center py-24 text-zinc-500 text-xs uppercase tracking-wider font-mono">
                Click "Create Roadmap" to compile a weekly study curriculum.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Readiness Scoring */}
        <Card className="border border-zinc-850 bg-[#09090b] lg:col-span-2 min-h-[350px]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-900 pb-3">
            <CardTitle className="text-white text-sm font-bold uppercase tracking-wider">Readiness Analytics</CardTitle>
            <Button
              onClick={computeReadiness}
              disabled={loadingReadiness}
              className="bg-white hover:bg-zinc-200 text-black font-bold h-8 px-4 text-xs transition-colors rounded uppercase tracking-wider"
            >
              {loadingReadiness ? 'Computing...' : 'Compute Score'}
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {loadingReadiness ? (
              <div className="text-center py-20">
                <div className="text-white text-sm font-bold animate-pulse uppercase tracking-wider">
                  Analyzing performance profiles...
                </div>
                <p className="text-zinc-500 text-[10px] mt-1.5 uppercase font-mono">
                  Querying database entries and compiling capability scales
                </p>
              </div>
            ) : readiness ? (
              <div className="space-y-6">
                {/* Readiness Grade badge */}
                <div className={cn(
                  "text-center border rounded p-6 bg-zinc-950/40",
                  getScoreBorderColor(readiness.overall_percentage)
                )}>
                  <div className="text-zinc-500 text-[10px] tracking-widest uppercase font-semibold">INDEX LEVEL</div>
                  <div className={cn(
                    "text-5xl font-extrabold mt-2 font-mono",
                    getScoreTextColor(readiness.overall_percentage)
                  )}>
                    {readiness.overall_percentage}%
                  </div>
                </div>

                {/* Breakdown */}
                <div className="text-xs space-y-2 border-t border-zinc-900 pt-4 uppercase tracking-wide">
                  <strong className="text-zinc-500 block mb-1 text-[10px]">Assessment Weights Breakdown</strong>
                  <div className="flex justify-between text-zinc-400">
                    <span>Resume strength:</span>
                    <code className="text-white font-bold font-mono">{readiness.profile_strength}%</code>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Technical skills fit:</span>
                    <code className="text-white font-bold font-mono">{readiness.skill_match_strength}%</code>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Mock interview:</span>
                    <code className="text-white font-bold font-mono">{readiness.mock_interview_strength}%</code>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="border-t border-zinc-900 pt-4">
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5">Next Immediate Steps</h5>
                  <ul className="space-y-2 text-zinc-400 text-xs pl-0.5">
                    {readiness.next_steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-white font-mono font-bold">-</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-24 text-zinc-500 text-xs uppercase tracking-wider font-mono">
                Click "Compute Score" to calculate candidate readiness indices.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
