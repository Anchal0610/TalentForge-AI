'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface GapItem {
  skill_name: string;
  current_proficiency: string;
  required_proficiency: string;
  estimated_learning_hours: number;
  priority: string;
}

interface SkillGapResults {
  target_role: string;
  gaps: GapItem[];
  overall_gap_percentage: number;
}

export default function SkillGapPage() {
  const [roleChoices, setRoleChoices] = useState<string[]>(['MLOps Engineer', 'Data Engineer', 'Backend Developer', 'DevOps Specialist']);
  const [targetRole, setTargetRole] = useState('MLOps Engineer');
  const [currentSkills, setCurrentSkills] = useState('Python, Docker, SQLite, Git, SQL, Flask');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SkillGapResults | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedRoles = localStorage.getItem('predictedRoles');
      if (savedRoles) {
        try {
          const parsed = JSON.parse(savedRoles);
          setRoleChoices(parsed);
          setTargetRole(parsed[0]);
        } catch {
          // ignore
        }
      }
      const savedSkills = localStorage.getItem('currentSkills');
      if (savedSkills) setCurrentSkills(savedSkills);

      const savedGaps = localStorage.getItem('gapResults');
      if (savedGaps) {
        try {
          setResults(JSON.parse(savedGaps));
        } catch {
          // ignore
        }
      }
    }
  }, []);

  const calculateGaps = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResults(null);
    setLoading(true);

    try {
      const res = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole, currentSkills })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Server failed to calculate skill gap.');
      }

      const data: SkillGapResults = await res.json();
      setResults(data);
      localStorage.setItem('gapResults', JSON.stringify(data));
      localStorage.setItem('gapPercentage', data.overall_gap_percentage.toString());
      localStorage.setItem('targetRole', targetRole);

      // Save raw skills array to localStorage
      const missingSkills = data.gaps.map(g => g.skill_name);
      localStorage.setItem('missingSkills', JSON.stringify(missingSkills));

      // Update overall readiness indices
      const atsScore = parseFloat(localStorage.getItem('atsScore') || '79.0');
      const readiness = Math.round(((atsScore + (100 - data.overall_gap_percentage)) / 2) * 10) / 10;
      localStorage.setItem('overallReadiness', readiness.toString());

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'medium':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default:
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  const getPercentTextColor = (pct: number) => {
    if (pct > 50) return 'text-rose-400';
    if (pct > 20) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const getPercentBorderColor = (pct: number) => {
    if (pct > 50) return 'border-rose-500/30';
    if (pct > 20) return 'border-amber-500/30';
    return 'border-emerald-500/30';
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">⚖️ Skill Gap Analysis</h1>
        <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md mt-4">
          <CardContent className="pt-6">
            <h3 className="text-base font-semibold text-slate-200 mb-1.5">Identify What is Keeping You From Your Next Role</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Select your target engineering title and compare your capabilities. The engine maps missing tech stacks, libraries, tools, and estimates study time to help prioritize your learning schedule.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Input Form Column */}
        <form onSubmit={calculateGaps} className="lg:col-span-1">
          <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md hover:border-violet-500/20 transition-colors">
            <CardHeader>
              <CardTitle className="text-white text-lg font-bold">Select Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  Which role are you targeting?
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-950/40 border border-white/10 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                >
                  {roleChoices.map((choice, idx) => (
                    <option key={idx} value={choice} className="bg-[#050811] text-slate-200">
                      {choice}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  Current Skill Inventory (comma separated)
                </label>
                <Textarea
                  value={currentSkills}
                  onChange={(e) => setCurrentSkills(e.target.value)}
                  className="bg-slate-950/40 border-white/10 text-white min-h-[120px] focus-visible:border-violet-500/50"
                />
              </div>

              {error && (
                <div className="text-rose-400 text-sm font-medium flex items-center gap-1.5">
                  <span>⚠️</span> {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold h-10 transition-all duration-200"
              >
                {loading ? '🔮 Assessing Competencies...' : '⚖️ Calculate Skill Gap Matrix'}
              </Button>
            </CardContent>
          </Card>
        </form>

        {/* Output Column */}
        <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md lg:col-span-2 min-h-[400px]">
          <CardHeader>
            <CardTitle className="text-white text-lg font-bold">Gap Diagnostics</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-24">
                <div className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-lg font-bold animate-pulse">
                  Analyzing target role competency requirements...
                </div>
                <p className="text-slate-500 text-xs mt-2">
                  Mapping capability sets and calculating study durations
                </p>
              </div>
            ) : results ? (
              <div className="space-y-6">
                {/* Coefficient Badge */}
                <div className={cn(
                  "text-center border rounded-xl p-6 bg-slate-950/40 backdrop-blur-sm",
                  getPercentBorderColor(results.overall_gap_percentage)
                )}>
                  <div className="text-slate-400 text-xs tracking-widest uppercase">SKILL GAP COEFFICIENT</div>
                  <div className={cn(
                    "text-5xl font-extrabold mt-2 font-mono",
                    getPercentTextColor(results.overall_gap_percentage)
                  )}>
                    {results.overall_gap_percentage}% Missing
                  </div>
                </div>

                {/* Gaps table */}
                <div className="border border-white/10 rounded-lg overflow-hidden bg-slate-950/30">
                  <Table>
                    <TableHeader className="bg-slate-950/60 border-b border-white/10">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-slate-200 font-semibold px-4">Skill / Tool</TableHead>
                        <TableHead className="text-slate-200 font-semibold px-4">Current</TableHead>
                        <TableHead className="text-slate-200 font-semibold px-4">Required</TableHead>
                        <TableHead className="text-slate-200 font-semibold px-4">Study Hours</TableHead>
                        <TableHead className="text-slate-200 font-semibold px-4">Priority</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.gaps.map((gap, idx) => (
                        <TableRow key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <TableCell className="font-semibold text-slate-100 px-4 py-3">{gap.skill_name}</TableCell>
                          <TableCell className="text-slate-300 px-4 py-3">{gap.current_proficiency}</TableCell>
                          <TableCell className="text-slate-300 px-4 py-3">{gap.required_proficiency}</TableCell>
                          <TableCell className="text-slate-300 px-4 py-3">~{gap.estimated_learning_hours} hrs</TableCell>
                          <TableCell className="px-4 py-3">
                            <span className={cn(
                              "px-2 py-0.5 text-xs font-semibold border rounded-full",
                              getPriorityBadgeClass(gap.priority)
                            )}>
                              {gap.priority}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Priority list */}
                <div className="border-t border-white/10 pt-5">
                  <h5 className="text-sm font-semibold text-slate-200 mb-3">🎯 Recommended Study Order:</h5>
                  <ol className="space-y-2 text-slate-400 text-xs pl-1">
                    {results.gaps.map((gap, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="text-violet-400 font-bold font-mono">{idx + 1}.</span>
                        <span>
                          <strong className="text-slate-200 font-semibold">{gap.skill_name}</strong> –{" "}
                          <span className="text-slate-300">{gap.priority} Priority</span> (Requires ~{gap.estimated_learning_hours} hrs of learning)
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ) : (
              <div className="text-center py-28 text-slate-500 text-sm">
                Select a target role and click "Calculate Skill Gap Matrix" to visualize competency differences.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
