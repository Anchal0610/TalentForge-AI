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

      const missingSkills = data.gaps.map(g => g.skill_name);
      localStorage.setItem('missingSkills', JSON.stringify(missingSkills));

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
        return 'text-white bg-zinc-900 border-zinc-700';
      case 'medium':
        return 'text-zinc-300 bg-zinc-950 border-zinc-800';
      default:
        return 'text-zinc-400 bg-transparent border-zinc-850';
    }
  };

  const getPercentTextColor = (pct: number) => {
    if (pct > 50) return 'text-white';
    if (pct > 20) return 'text-zinc-300';
    return 'text-zinc-450';
  };

  const getPercentBorderColor = (pct: number) => {
    if (pct > 50) return 'border-white/40';
    if (pct > 20) return 'border-zinc-700';
    return 'border-zinc-850';
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2 uppercase">Skill Gap Analysis</h1>
        <Card className="border border-zinc-850 bg-[#09090b]">
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold text-slate-200 mb-1.5 uppercase">Identify What is Keeping You From Your Next Role</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Select your target engineering title and compare your capabilities. The engine maps missing tech stacks, libraries, tools, and estimates study time to help prioritize your learning schedule.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Input Form Column */}
        <form onSubmit={calculateGaps} className="lg:col-span-1">
          <Card className="border border-zinc-850 bg-[#09090b] hover:border-zinc-750 transition-colors">
            <CardHeader className="border-b border-zinc-900 pb-3">
              <CardTitle className="text-white text-sm font-bold uppercase tracking-wider">Select Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                  Which role are you targeting?
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full h-10 px-3 bg-zinc-950 border border-zinc-850 rounded text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 transition-colors"
                >
                  {roleChoices.map((choice, idx) => (
                    <option key={idx} value={choice} className="bg-black text-slate-200">
                      {choice}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                  Current Skill Inventory (comma separated)
                </label>
                <Textarea
                  value={currentSkills}
                  onChange={(e) => setCurrentSkills(e.target.value)}
                  className="bg-zinc-950 border-zinc-850 text-white min-h-[120px] focus-visible:border-zinc-500 text-xs"
                />
              </div>

              {error && (
                <div className="text-zinc-300 text-xs font-semibold">
                  Error: {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-white hover:bg-zinc-200 text-black font-bold h-9 text-xs uppercase tracking-wider transition-colors rounded"
              >
                {loading ? 'Assessing Matrix...' : 'Calculate Skill Gap Matrix'}
              </Button>
            </CardContent>
          </Card>
        </form>

        {/* Output Column */}
        <Card className="border border-zinc-850 bg-[#09090b] lg:col-span-2 min-h-[400px]">
          <CardHeader className="border-b border-zinc-900 pb-3">
            <CardTitle className="text-white text-sm font-bold uppercase tracking-wider">Gap Diagnostics</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="text-center py-24">
                <div className="text-white text-sm font-bold animate-pulse uppercase tracking-wider">
                  Analyzing target role competency requirements...
                </div>
                <p className="text-zinc-500 text-[10px] mt-1.5 uppercase font-mono">
                  Mapping capability sets and calculating study durations
                </p>
              </div>
            ) : results ? (
              <div className="space-y-6">
                {/* Coefficient Badge */}
                <div className={cn(
                  "text-center border rounded p-6 bg-zinc-950/40",
                  getPercentBorderColor(results.overall_gap_percentage)
                )}>
                  <div className="text-zinc-500 text-[10px] tracking-widest uppercase font-semibold">SKILL GAP COEFFICIENT</div>
                  <div className={cn(
                    "text-5xl font-extrabold mt-2 font-mono",
                    getPercentTextColor(results.overall_gap_percentage)
                  )}>
                    {results.overall_gap_percentage}% Missing
                  </div>
                </div>

                {/* Gaps table */}
                <div className="border border-zinc-850 rounded overflow-hidden bg-zinc-950/20">
                  <Table>
                    <TableHeader className="bg-zinc-950 border-b border-zinc-850">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-zinc-300 font-bold px-4 uppercase text-[10px] tracking-wide">Skill / Tool</TableHead>
                        <TableHead className="text-zinc-300 font-bold px-4 uppercase text-[10px] tracking-wide">Current</TableHead>
                        <TableHead className="text-zinc-300 font-bold px-4 uppercase text-[10px] tracking-wide">Required</TableHead>
                        <TableHead className="text-zinc-300 font-bold px-4 uppercase text-[10px] tracking-wide">Study Hours</TableHead>
                        <TableHead className="text-zinc-300 font-bold px-4 uppercase text-[10px] tracking-wide">Priority</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.gaps.map((gap, idx) => (
                        <TableRow key={idx} className="border-b border-zinc-900 hover:bg-white/5 transition-colors">
                          <TableCell className="font-semibold text-white px-4 py-3 text-xs uppercase font-mono">{gap.skill_name}</TableCell>
                          <TableCell className="text-zinc-400 px-4 py-3 text-xs">{gap.current_proficiency}</TableCell>
                          <TableCell className="text-zinc-400 px-4 py-3 text-xs">{gap.required_proficiency}</TableCell>
                          <TableCell className="text-zinc-400 px-4 py-3 text-xs font-mono">~{gap.estimated_learning_hours} hrs</TableCell>
                          <TableCell className="px-4 py-3 text-xs">
                            <span className={cn(
                              "px-2 py-0.5 text-[9px] font-semibold border rounded",
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
                <div className="border-t border-zinc-900 pt-5">
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Recommended Study Order</h5>
                  <ol className="space-y-2 text-zinc-450 text-xs pl-0.5">
                    {results.gaps.map((gap, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-white font-mono font-bold">{idx + 1}.</span>
                        <span>
                          <strong className="text-zinc-200 font-semibold uppercase text-[10px] tracking-wide">{gap.skill_name}</strong> –{" "}
                          <span className="text-zinc-400">{gap.priority} Priority</span> (Requires ~{gap.estimated_learning_hours} hrs of learning)
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ) : (
              <div className="text-center py-28 text-zinc-500 text-xs uppercase tracking-wider font-mono">
                Select a target role to visualize competency gaps.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
