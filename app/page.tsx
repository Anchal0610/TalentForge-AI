'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

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
    <div>
      {/* App Header */}
      <header style={{ textAlign: 'center', marginTop: '2rem', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '0.2rem' }} className="gradient-text">
          Nexora AI
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontWeight: 300, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Analyze. Learn. Upgrade. Get Interview Ready.
        </p>
      </header>

      {/* Main Dashboard Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        {/* Left Column: Platform Intro */}
        <div>
          <div className="glass-card">
            <div className="neon-badge badge-blue">Platform Overview</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>Welcome to the Next-Gen Career Ecosystem</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
              Nexora AI leverages advanced multi-agent systems, deep RAG pipelines, and high-dimensional vector embeddings to construct a hyper-personalized roadmap tailored for your engineering journey. Scan your resume, explore target requirements, learn from intelligent summaries, practice mock sessions, and visualize your skillset in 3D.
            </p>
            
            <div style={{ marginTop: '1.5rem' }}>
              <p style={{ color: 'var(--text-bright)', fontWeight: 600, marginBottom: '12px' }}>🚀 Available Modules:</p>
              <ul style={{ color: 'var(--text-muted)', lineHeight: 1.8, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><b>Resume Intelligence & ATS Analysis</b>: Check resume match rates and optimization items.</li>
                <li><b>Career Advisor & Recommendations</b>: Discover top titles and market growth insights.</li>
                <li><b>Skill Gap Analysis</b>: Detailed checklist of missing libraries, tools, and algorithms.</li>
                <li><b>Document Intelligence</b>: Summarize documents and auto-extract core exam concepts.</li>
                <li><b>Interview Prep Suite</b>: Tiered answers (Beginner to Expert) and interactive mock evaluations.</li>
                <li><b>3D Vector & Knowledge Graph Explorers</b>: Interact with skills mapped to job clusters.</li>
              </ul>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <Link href="/resume" className="glass-card" style={{ textDecoration: 'none', display: 'block', padding: '20px' }}>
              <h4 style={{ color: 'var(--color-blue)', marginBottom: '6px' }}>📄 Optimize Resume</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Scan compatibility indices and retrieve custom corrections.</p>
            </Link>
            <Link href="/roadmap" className="glass-card" style={{ textDecoration: 'none', display: 'block', padding: '20px' }}>
              <h4 style={{ color: 'var(--color-magenta)', marginBottom: '6px' }}>🗺️ Weekly Syllabus</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Explore week-by-week study milestones and credentials.</p>
            </Link>
          </div>
        </div>

        {/* Right Column: Profile Analytics */}
        <div>
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <div className="neon-badge badge-green">Candidate Health</div>
            <h4 style={{ fontSize: '1.25rem', marginBottom: '15px' }}>Active Profile</h4>
            
            <div style={{ margin: '1.5rem 0' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '0.05em' }}>OVERALL READINESS</div>
              <div className="metric-value" style={{ color: 'var(--color-green)' }}>
                {readiness.toFixed(1)}%
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>ATS Score:</span>
                <span style={{ color: 'var(--color-blue)', fontWeight: 600 }}>{atsScore.toFixed(1)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Skill Match Fit:</span>
                <span style={{ color: 'var(--color-purple)', fontWeight: 600 }}>{(100 - gapPercentage).toFixed(1)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Mock Interview:</span>
                <span style={{ color: 'var(--color-orange)', fontWeight: 600 }}>Completed</span>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <h4 style={{ marginBottom: '12px', fontSize: '1rem' }}>📈 MLOps Proximity Insights</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Your high-dimensional capability vector indicates close proximity to standard backend patterns, with gaps remaining in distributed container orchestration scheduling.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        marginTop: '5rem',
        paddingBottom: '2rem',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        paddingTop: '1.5rem',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        Nexora AI &copy; 2026. Made with &hearts; for Hackathon Excellence.
      </footer>
    </div>
  );
}
