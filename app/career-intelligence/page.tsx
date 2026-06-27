'use client';

import React, { useState, useEffect } from 'react';
import { useCareer } from '@/components/CareerContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Compass, 
  TrendingUp, 
  BookOpen, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  UserCheck,
  CheckCircle,
  HelpCircle,
  Database
} from 'lucide-react';
import Link from 'next/link';

export default function CareerIntelligencePage() {
  const { sessionData, loading, loadSession } = useCareer();
  const [emailInput, setEmailInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!emailInput) return;
    const found = await loadSession(emailInput);
    if (!found) {
      setErrorMsg('No session record found for this email. Please upload your resume first.');
    }
  };

  // Calculations for Gap Percentage
  const skillsCount = sessionData?.skills_present.length || 0;
  const missingCount = sessionData?.skills_missing.length || 0;
  const totalCount = skillsCount + missingCount;
  const matchPercentage = totalCount > 0 ? Math.round((skillsCount / totalCount) * 100) : 0;
  const gapPercentage = 100 - matchPercentage;

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/30 pb-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
            <Compass className="text-accent w-6 h-6" /> Career Intelligence
          </h1>
          <p className="text-xs text-muted">Leverage senior tech recruitment advisors to align your skill gaps with high-growth engineering roles</p>
        </div>
      </div>

      {/* 2. No Session State */}
      {!sessionData ? (
        <Card className="bg-surface border-border p-8 text-center max-w-xl mx-auto space-y-6 mt-10">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto text-accent">
            <Compass className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white uppercase tracking-wide">No Active Profile Session</h2>
            <p className="text-xs text-muted leading-relaxed">
              Nexora AI needs your parsed capabilities and skills list to recommend target roles. Upload your resume or restore a previous session to start.
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
        /* 3. Session Active - Show the Two Panels */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* Panel 1: Career Advisor Predictions */}
          <Card className="bg-surface border-border p-5 space-y-6">
            <CardHeader className="p-0 pb-3 border-b border-border/30">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-accent" /> Recommended Career Pathways
              </CardTitle>
            </CardHeader>

            <div className="space-y-4">
              <div className="p-3.5 bg-zinc-950 border border-border rounded space-y-2">
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-accent uppercase tracking-widest">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Primary Recommendation Match</span>
                </div>
                <h3 className="text-base font-extrabold text-white uppercase">{sessionData.target_role}</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Based on your {sessionData.skills_extracted.length} extracted skills and years of experience, the platform recommends aligning credentials with a {sessionData.target_role} profile.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-muted uppercase tracking-wider">Top 3 Job Roles & Growth Potential</h4>
                
                <div className="space-y-3">
                  {sessionData.career_recommendations.map((role, idx) => (
                    <div 
                      key={idx}
                      className="p-3 bg-zinc-950/40 border border-border/60 hover:border-border rounded transition-all space-y-1.5"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-white uppercase">{role.role_name}</span>
                        <Badge className="bg-accent/15 text-accent border border-accent/25 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded">
                          {role.growth_trend}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted leading-normal">{role.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Panel 2: Skill Gap Comparison */}
          <Card className="bg-surface border-border p-5 space-y-6">
            <CardHeader className="p-0 pb-3 border-b border-border/30">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-accent" /> Capability Skill Gap Analysis
              </CardTitle>
            </CardHeader>

            <div className="space-y-5">
              
              {/* Progress Ring Summary */}
              <div className="p-3.5 bg-zinc-950 border border-border rounded space-y-3">
                <div className="flex justify-between items-center text-xs uppercase font-semibold">
                  <span className="text-muted">Target Role Coverage Match</span>
                  <span className="text-accent font-mono font-bold">{matchPercentage}%</span>
                </div>
                <Progress 
                  value={matchPercentage} 
                  className="h-2 bg-surface-2 [&_[data-slot=progress-indicator]]:bg-accent w-full"
                />
                <div className="text-[10px] text-muted leading-relaxed">
                  You possess {skillsCount} out of {totalCount} total required stack libraries for this role, yielding a skill deficit of {gapPercentage}%.
                </div>
              </div>

              {/* Present Skills */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Validated Skills ({skillsCount})</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {sessionData.skills_present.map((skill, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-0.5 text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 rounded uppercase"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing Skills list */}
              <div className="space-y-3 border-t border-border/30 pt-4">
                <h4 className="text-[10px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Missing Competencies ({missingCount})</span>
                </h4>
                
                <div className="space-y-2.5">
                  {sessionData.skills_missing.map((gap, idx) => (
                    <div 
                      key={idx}
                      className="p-3 bg-zinc-950/40 border border-border/50 rounded flex justify-between items-center text-xs"
                    >
                      <div className="space-y-1">
                        <strong className="text-white uppercase font-sans tracking-wide block">{gap.skill_name}</strong>
                        <div className="flex items-center gap-2.5 text-[10px] text-muted">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-accent" /> {gap.estimated_learning_hours} hrs needed</span>
                          <span>Proficiency: {gap.current_proficiency} → {gap.required_proficiency}</span>
                        </div>
                      </div>
                      <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-bold px-1.5 py-0.5 rounded">
                        High Priority
                      </Badge>
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
