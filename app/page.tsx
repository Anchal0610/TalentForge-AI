'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

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

  return (
    <div className="space-y-10">
      {/* App Header */}
      <header className="text-center mt-8 mb-12">
        <h1 className="text-5xl font-extrabold mb-3 tracking-tight bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Nexora AI
        </h1>
        <p className="text-base text-slate-400 font-light tracking-widest uppercase">
          Analyze. Learn. Upgrade. Get Interview Ready.
        </p>
      </header>

      {/* Main Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Platform Intro */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md hover:border-indigo-500/40 hover:shadow-[0_8px_32px_rgba(99,102,241,0.15)] transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="inline-block px-3 py-1 text-[10px] font-semibold tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/30 rounded-full w-fit uppercase mb-2">
                Platform Overview
              </div>
              <CardTitle className="text-2xl font-bold text-white">Welcome to the Next-Gen Career Ecosystem</CardTitle>
              <CardDescription className="text-slate-400 text-sm leading-relaxed mt-2">
                Nexora AI leverages advanced multi-agent systems, deep RAG pipelines, and high-dimensional vector embeddings to construct a hyper-personalized roadmap tailored for your engineering journey. Scan your resume, explore target requirements, learn from intelligent summaries, practice mock sessions, and visualize your skillset in 3D.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-4 space-y-4">
              <p className="text-slate-200 font-semibold flex items-center gap-2">
                <span>🚀</span> Available Modules:
              </p>
              <ul className="text-slate-400 text-sm leading-relaxed space-y-3 pl-1">
                <li className="flex items-start gap-2.5">
                  <span className="text-blue-500 mt-1">✓</span>
                  <div>
                    <strong className="text-slate-200">Resume Intelligence & ATS Analysis</strong>: Check resume match rates and retrieve targeted optimization feedback.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-purple-500 mt-1">✓</span>
                  <div>
                    <strong className="text-slate-200">Career Advisor & Recommendations</strong>: Discover high-growth roles and real-time market insights.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-pink-500 mt-1">✓</span>
                  <div>
                    <strong className="text-slate-200">Skill Gap Analysis</strong>: Maintain a precise checklist of missing libraries, tools, and system architectures.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-500 mt-1">✓</span>
                  <div>
                    <strong className="text-slate-200">Document Intelligence</strong>: Parse PDF documents to auto-generate structured learning concepts and exams.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-orange-500 mt-1">✓</span>
                  <div>
                    <strong className="text-slate-200">Interview Prep Suite</strong>: Practice with tier-specific responses (Beginner to Expert) and interactive grading feedback.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-amber-500 mt-1">✓</span>
                  <div>
                    <strong className="text-slate-200">3D Vector & Knowledge Graph Explorers</strong>: Discover semantic correlations in your skillset using immersive visual graphs.
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/resume" className="group">
              <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md group-hover:border-blue-500/40 group-hover:shadow-[0_8px_32px_rgba(59,130,246,0.15)] transition-all duration-300 h-full">
                <CardHeader>
                  <CardTitle className="text-blue-400 group-hover:text-blue-300 transition-colors flex items-center gap-2">
                    <span>📄</span> Optimize Resume
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-sm mt-1">
                    Scan compatibility indices and retrieve custom corrections instantly.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/roadmap" className="group">
              <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md group-hover:border-purple-500/40 group-hover:shadow-[0_8px_32px_rgba(139,92,246,0.15)] transition-all duration-300 h-full">
                <CardHeader>
                  <CardTitle className="text-purple-400 group-hover:text-purple-300 transition-colors flex items-center gap-2">
                    <span>🗺️</span> Weekly Syllabus
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-sm mt-1">
                    Explore week-by-week study milestones, targets, and credentials.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>

        {/* Right Column: Profile Analytics */}
        <div className="space-y-6">
          <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md hover:border-emerald-500/40 hover:shadow-[0_8px_32px_rgba(16,185,129,0.15)] transition-all duration-300 text-center">
            <CardHeader className="items-center pb-2">
              <div className="inline-block px-3 py-1 text-[10px] font-semibold tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full w-fit uppercase mb-2">
                Candidate Health
              </div>
              <CardTitle className="text-lg font-bold text-white">Active Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="py-2">
                <div className="text-slate-400 text-xs tracking-widest uppercase">OVERALL READINESS</div>
                <div className="text-5xl font-extrabold text-emerald-400 mt-2 font-mono">
                  {readiness.toFixed(1)}%
                </div>
              </div>

              <div className="border-t border-white/10 pt-5 space-y-3.5 text-left">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">ATS Score:</span>
                  <span className="text-blue-400 font-semibold font-mono">{atsScore.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Skill Match Fit:</span>
                  <span className="text-purple-400 font-semibold font-mono">{(100 - gapPercentage).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Mock Interview:</span>
                  <span className="text-orange-400 font-semibold">Completed</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md hover:border-blue-500/40 hover:shadow-[0_8px_32px_rgba(59,130,246,0.15)] transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <span>📈</span> MLOps Proximity Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-xs leading-relaxed">
                Your high-dimensional capability vector indicates close proximity to standard backend patterns, with gaps remaining in distributed container orchestration scheduling.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center mt-20 pt-6 pb-8 border-t border-white/5 text-xs text-slate-500">
        Nexora AI &copy; 2026. Made with &hearts; for Hackathon Excellence.
      </footer>
    </div>
  );
}
