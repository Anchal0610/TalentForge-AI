'use client';

import React, { useState, useEffect } from 'react';
import { useCareer } from '@/components/CareerContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  Map, 
  Clock, 
  Award, 
  Code,
  Layers,
  CheckCircle,
  TrendingUp,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';

export default function RoadmapPage() {
  const { sessionData, loading, loadSession } = useCareer();
  const [emailInput, setEmailInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!emailInput) return;
    const found = await loadSession(emailInput);
    if (!found) {
      setErrorMsg('No session record found for this email. Please upload your resume first.');
    }
  };

  // Helper score color mapper
  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5';
    if (score >= 60) return 'text-amber-400 border-amber-500/30 bg-amber-500/5';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/5';
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/30 pb-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
            <Map className="text-accent w-6 h-6" /> Study Roadmap & Readiness
          </h1>
          <p className="text-xs text-muted">Review your personalized technical study curriculum and target readiness metrics</p>
        </div>
      </div>

      {/* 2. No Session State */}
      {!sessionData ? (
        <Card className="bg-surface border-border p-8 text-center max-w-xl mx-auto space-y-6 mt-10 shadow-lg">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto text-accent select-none">
            <Map className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white uppercase tracking-wide">Resume Analysis Required</h2>
            <p className="text-xs text-muted leading-relaxed">
              Nexora AI needs your parsed capabilities to compile a customized weekly study plan. Please upload your resume in the Document Hub to start generating your study curriculum.
            </p>
          </div>

          <div className="border-t border-border/30 pt-6">
            <Link href="/document-hub">
              <Button
                className="w-full bg-accent hover:bg-accent-glow text-white font-bold h-9 text-xs uppercase tracking-wider transition-colors rounded cursor-pointer"
              >
                Go to Document Hub
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        /* 3. Active Session View */
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          
          {/* Left Column: Weekly syllabus roadmap */}
          <Card className="bg-surface border-border lg:col-span-3 p-5 space-y-4">
            <CardHeader className="p-0 pb-3 border-b border-border/30 flex flex-row justify-between items-center">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-white">Weekly Study Curriculum</CardTitle>
              <Badge className="bg-accent/15 text-accent border border-accent/25 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                {sessionData.roadmap.length} Weeks Plan
              </Badge>
            </CardHeader>

            <div className="space-y-3.5 pt-2">
              {sessionData.roadmap.map((weekStep) => (
                <div 
                  key={weekStep.week_number}
                  className="border border-border/60 rounded overflow-hidden bg-zinc-950/20"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedWeek(expandedWeek === weekStep.week_number ? null : weekStep.week_number)}
                    className="w-full text-left bg-zinc-950/45 px-4 py-3 text-slate-100 font-semibold text-xs hover:bg-zinc-900/50 flex justify-between items-center transition-colors cursor-pointer outline-none uppercase font-mono"
                  >
                    <span>Week {weekStep.week_number}: {weekStep.topic}</span>
                    <span className="text-zinc-500 text-[10px]">{expandedWeek === weekStep.week_number ? '▲' : '▼'}</span>
                  </button>

                  {expandedWeek === weekStep.week_number && (
                    <div className="p-4 space-y-4 text-xs leading-relaxed border-t border-border bg-zinc-955/20">
                      <div>
                        <strong className="text-zinc-400 block mb-1 uppercase text-[10px] tracking-wide">Core Learning Resources</strong>
                        <div className="flex items-center gap-1">
                          <span className="text-muted">Study Tutorial:</span>
                          <a 
                            href={weekStep.resource_link} 
                            target="_blank" 
                            rel="noreferrer"
                            className="underline text-accent hover:text-accent-glow font-bold"
                          >
                            Link Reference
                          </a>
                        </div>
                      </div>

                      <div>
                        <strong className="text-zinc-400 block mb-1 uppercase text-[10px] tracking-wide">Weekly Project Milestone</strong>
                        <p className="text-zinc-300 font-medium pl-0.5">💻 {weekStep.milestone}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Right Column: Readiness Scoring */}
          <Card className="bg-surface border-border lg:col-span-2 p-5 space-y-6">
            <CardHeader className="p-0 pb-3 border-b border-border/30">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-white">Composite Readiness Analysis</CardTitle>
            </CardHeader>

            <div className="space-y-6 pt-2">
              {/* Readiness rating badge */}
              <div className={cn(
                "text-center border rounded p-6 bg-zinc-950/40",
                getScoreColorClass(sessionData.readiness_score)
              )}>
                <div className="text-zinc-500 text-[9px] tracking-widest uppercase font-semibold">OVERALL READY LEVEL</div>
                <div className="text-5xl font-extrabold mt-2 font-mono text-white">
                  {sessionData.readiness_score}%
                </div>
              </div>

              {/* Weight Details */}
              <div className="text-xs space-y-2.5 border-t border-border/30 pt-4 uppercase tracking-wider text-muted font-sans">
                <strong className="text-zinc-400 block mb-1 text-[10px] tracking-widest">Readiness Index Formula Weighting</strong>
                <div className="flex justify-between items-center">
                  <span>ATS Match Fit (30%):</span>
                  <span className="text-white font-mono font-bold">{sessionData.ats_score}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Skills Mapped (30%):</span>
                  <span className="text-white font-mono font-bold">
                    {Math.round((sessionData.skills_present.length / (sessionData.skills_present.length + sessionData.skills_missing.length)) * 100)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Mock Interview (40%):</span>
                  <span className="text-white font-mono font-bold">75.0%</span>
                </div>
              </div>

              {/* Study Action Recommendations */}
              <div className="border-t border-border/30 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Priority Study Recommendations</h4>
                <div className="space-y-2">
                  {sessionData.skills_missing.slice(0, 3).map((gap, idx) => (
                    <div 
                      key={idx}
                      className="p-2.5 bg-zinc-950/40 border border-border/40 rounded flex items-center gap-2.5 text-xs"
                    >
                      <Award className="w-4 h-4 text-accent shrink-0" />
                      <div>
                        <span>Learn <strong>{gap.skill_name}</strong></span>
                        <span className="text-[10px] text-muted block">Expected time commitment: {gap.estimated_learning_hours} hours.</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
