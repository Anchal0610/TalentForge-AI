'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Compass,
  TrendingUp,
  Database,
  MessageSquare,
  Network,
  ArrowRight,
  Sparkles,
  Layers,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkle
} from 'lucide-react';

export default function HomePage() {
  const [readiness, setReadiness] = useState(74.5);
  const [atsScore, setAtsScore] = useState(79.0);
  const [gapPercentage, setGapPercentage] = useState(40.0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedReadiness = localStorage.getItem('overallReadiness');
      if (savedReadiness) setReadiness(parseFloat(savedReadiness));
      
      const savedAts = localStorage.getItem('atsScore');
      if (savedAts) setAtsScore(parseFloat(savedAts));

      const savedGap = localStorage.getItem('gapPercentage');
      if (savedGap) setGapPercentage(parseFloat(savedGap));
    }
  }, []);

  const skillMatch = 100 - gapPercentage;

  // Circular Progress Details
  const radius = 60;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (readiness / 100) * circumference;

  const features = [
    {
      title: 'Resume ATS',
      description: 'Scan compatibility indices and retrieve custom corrections instantly.',
      href: '/resume',
      icon: FileText,
    },
    {
      title: 'Career Advisor',
      description: 'Discover high-growth roles and real-time market insights.',
      href: '/career',
      icon: Compass,
    },
    {
      title: 'Skill Gap',
      description: 'Maintain a precise checklist of missing libraries, tools, and system architectures.',
      href: '/skills',
      icon: TrendingUp,
    },
    {
      title: 'Document RAG',
      description: 'Parse PDF documents to auto-generate structured learning concepts and exams.',
      href: '/document',
      icon: Database,
    },
    {
      title: 'Interview Prep',
      description: 'Practice with tier-specific responses (Beginner to Expert) and interactive grading feedback.',
      href: '/interview',
      icon: MessageSquare,
    },
    {
      title: 'Knowledge Graph',
      description: 'Discover semantic correlations in your skillset using immersive visual graphs.',
      href: '/graph',
      icon: Network,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. HERO BANNER */}
      <Card className="relative overflow-hidden bg-gradient-to-r from-blue-950 via-zinc-900 to-zinc-950 border border-blue-900/50 rounded-xl p-8 select-none">
        {/* Decorative Blurs */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-10 bottom-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-4 max-w-2xl">
          <Badge variant="outline" className="text-cyan-400 border-cyan-400/30 bg-cyan-400/10 text-[10px] tracking-wider font-semibold py-0.5 px-2">
            AI-POWERED
          </Badge>
          
          <h1 className="text-4xl font-bold tracking-tight text-white leading-tight uppercase font-sans">
            GET INTERVIEW READY.
          </h1>
          
          <p className="text-sm text-muted leading-relaxed max-w-xl">
            Nexora AI leverages advanced multi-agent systems, deep RAG pipelines, and high-dimensional vector embeddings to construct a hyper-personalized roadmap tailored for your engineering journey.
          </p>
          
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/resume">
              <Button className="bg-accent hover:bg-accent-glow text-white font-medium px-4 h-9 rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer">
                Analyze Resume
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" className="border-border text-white hover:bg-surface-2 font-medium px-4 h-9 rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer">
                Explore Features
              </Button>
            </a>
          </div>
        </div>
      </Card>

      {/* 2. STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Overall Readiness */}
        <Card className="bg-surface border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-accent/10 p-2.5 rounded-lg shrink-0">
              <Sparkles className="text-accent w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono tracking-tight text-white">
                {readiness.toFixed(1)}%
              </p>
              <p className="text-xs text-muted font-medium uppercase tracking-wider">
                Overall Readiness
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stat 2: ATS Score */}
        <Card className="bg-surface border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-accent/10 p-2.5 rounded-lg shrink-0">
              <FileText className="text-accent w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono tracking-tight text-white">
                {atsScore.toFixed(1)}%
              </p>
              <p className="text-xs text-muted font-medium uppercase tracking-wider">
                ATS Score
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stat 3: Skills Mapped */}
        <Card className="bg-surface border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-accent/10 p-2.5 rounded-lg shrink-0">
              <Layers className="text-accent w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono tracking-tight text-white">
                {skillMatch.toFixed(0)}%
              </p>
              <p className="text-xs text-muted font-medium uppercase tracking-wider">
                Skills Mapped
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stat 4: Days to Interview */}
        <Card className="bg-surface border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-accent/10 p-2.5 rounded-lg shrink-0">
              <Calendar className="text-accent w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono tracking-tight text-white">
                12 Days
              </p>
              <p className="text-xs text-muted font-medium uppercase tracking-wider">
                Days to Interview
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. MAIN CONTENTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Double-Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* FEATURE CARDS */}
          <section id="features" className="space-y-3">
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-white uppercase tracking-tight">Available Modules</h2>
              <p className="text-xs text-muted">Leverage specialized intelligent agents to guide your prep process</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <Link href={feature.href} key={i} className="outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl">
                    <Card className="bg-surface border-border hover:border-accent/50 hover:bg-zinc-800/80 transition-all duration-200 group cursor-pointer h-full flex flex-col justify-between">
                      <CardContent className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3 group-hover:bg-accent/20 transition-colors">
                            <Icon className="text-accent w-5 h-5" />
                          </div>
                          <h3 className="font-semibold text-sm text-white mb-1.5 uppercase tracking-wide">
                            {feature.title}
                          </h3>
                          <p className="text-xs text-muted leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                        <div className="mt-4 text-accent text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all uppercase tracking-wider select-none">
                          Launch <ArrowRight className="w-3 h-3" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* WEEKLY SYLLABUS */}
          <Card className="bg-surface border-border">
            <CardHeader className="pb-4 border-b border-border/30">
              <CardTitle className="text-xs font-bold text-muted uppercase tracking-widest">
                Weekly Syllabus
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Stepper Timeline */}
              <div className="relative border-l border-border/50 pl-6 ml-3 space-y-6">
                
                {/* Week 1 */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-success ring-4 ring-success/20" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-success uppercase tracking-wider">Week 1</span>
                      <h4 className="text-sm font-semibold text-white mt-0.5">Resume Calibration & Setup</h4>
                      <p className="text-xs text-muted mt-0.5">Initialize your profile mapping and calibrate your resume to target roles.</p>
                    </div>
                    <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/15 w-fit">
                      100% Complete
                    </Badge>
                  </div>
                </div>

                {/* Week 2 */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-success ring-4 ring-success/20" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-success uppercase tracking-wider">Week 2</span>
                      <h4 className="text-sm font-semibold text-white mt-0.5">Core Engineering Diagnostics</h4>
                      <p className="text-xs text-muted mt-0.5">Solve core algorithms, system design benchmarks, and identify tech debt.</p>
                    </div>
                    <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/15 w-fit">
                      100% Complete
                    </Badge>
                  </div>
                </div>

                {/* Week 3 (Active) */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-accent ring-4 ring-accent/30 animate-pulse" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Week 3 (Active)</span>
                      <h4 className="text-sm font-semibold text-white mt-0.5">High-Dimensional Knowledge Graph</h4>
                      <p className="text-xs text-muted mt-0.5">Explore semantic correlations in your skillset and map embeddings in 3D.</p>
                    </div>
                    <Badge className="bg-warning/10 text-warning border-warning/20 hover:bg-warning/15 w-fit">
                      In Progress
                    </Badge>
                  </div>
                </div>

                {/* Week 4 */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-surface-2 border border-border" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Week 4</span>
                      <h4 className="text-sm font-semibold text-white mt-0.5">Mock Interview Suite & Verification</h4>
                      <p className="text-xs text-muted mt-0.5">Practice live sessions, review grading responses, and finalize readiness scores.</p>
                    </div>
                    <Badge variant="outline" className="border-border text-muted w-fit">
                      Upcoming
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Single-Column (Sticky Health Card) */}
        <div className="lg:col-span-1 lg:sticky lg:top-22 space-y-6">
          <Card className="bg-surface border-border rounded-xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/30 pb-4">
              <CardTitle className="text-sm font-semibold text-white uppercase tracking-wider">
                Candidate Health
              </CardTitle>
              <Badge className="bg-success/10 text-success border border-success/20 hover:bg-success/15 font-mono text-[10px] py-0.5 px-2">
                Active Profile
              </Badge>
            </div>

            {/* Circular Progress Ring */}
            <div className="relative flex flex-col items-center justify-center py-6">
              <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                  stroke="#27272A" /* surface-2 */
                  fill="transparent"
                  strokeWidth={stroke}
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                />
                {/* Foreground progress circle */}
                <circle
                  stroke="#3B82F6" /* accent */
                  fill="transparent"
                  strokeWidth={stroke}
                  strokeDasharray={circumference + ' ' + circumference}
                  style={{ strokeDashoffset }}
                  strokeLinecap="round"
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              {/* Text inside Ring */}
              <div className="absolute text-center flex flex-col">
                <span className="text-xl font-extrabold text-white font-mono leading-none">
                  {readiness.toFixed(1)}%
                </span>
                <span className="text-[8px] text-muted uppercase tracking-widest font-semibold mt-1">
                  Readiness
                </span>
              </div>
            </div>

            {/* Metrics Checklist with Progress Components */}
            <div className="space-y-4 pt-2">
              {/* Metric 1: ATS Score */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wide">
                  <span className="text-muted">ATS Score</span>
                  <span className="text-success font-mono">{atsScore.toFixed(0)}%</span>
                </div>
                <Progress
                  value={atsScore}
                  className="h-1.5 bg-surface-2 [&_[data-slot=progress-indicator]]:bg-success w-full"
                />
              </div>

              {/* Metric 2: Skill Match */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wide">
                  <span className="text-muted">Skill Match</span>
                  <span className="text-warning font-mono">{skillMatch.toFixed(0)}%</span>
                </div>
                <Progress
                  value={skillMatch}
                  className="h-1.5 bg-surface-2 [&_[data-slot=progress-indicator]]:bg-warning w-full"
                />
              </div>

              {/* Metric 3: Mock Interview */}
              <div className="pt-2 flex justify-between items-center text-xs font-semibold uppercase tracking-wide border-t border-border/30">
                <span className="text-muted">Mock Interview</span>
                <Badge className="bg-accent/15 text-accent border border-accent/20 hover:bg-accent/20 text-[9px] font-semibold px-2 py-0.5 rounded">
                  Completed
                </Badge>
              </div>
            </div>

            {/* Proximity Insights Block */}
            <div className="mt-6 pt-4 border-t border-border/30 space-y-2">
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted uppercase tracking-widest">
                <Clock className="w-3 h-3 text-accent" />
                <span>Vector Proximity Insights</span>
              </div>
              <div className="bg-surface-2/40 border border-border/40 rounded-lg p-3 text-xs text-muted leading-relaxed">
                Your high-dimensional capability vector indicates close proximity to standard backend patterns, with gaps remaining in distributed container orchestration scheduling.
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      {/* 4. FOOTER */}
      <footer className="text-center pt-8 pb-4 border-t border-border/30 text-[10px] text-muted tracking-widest uppercase font-mono">
        Nexora AI &copy; 2026. Made with Hackathon Excellence.
      </footer>
    </div>
  );
}
