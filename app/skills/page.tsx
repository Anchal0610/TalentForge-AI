'use client';

import React, { useState, useEffect } from 'react';

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

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'var(--color-red)';
      case 'medium': return 'var(--color-orange)';
      default: return 'var(--color-green)';
    }
  };

  const getPercentColor = (pct: number) => {
    if (pct > 50) return 'var(--color-red)';
    if (pct > 20) return 'var(--color-orange)';
    return 'var(--color-green)';
  };

  return (
    <div>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>⚖️ Skill Gap Analysis</h1>

      <div className="glass-card">
        <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Identify What is Keeping You From Your Next Role</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Select your target engineering title and compare your capabilities. The engine maps missing tech stacks, libraries, tools, and estimates study time to help prioritize your learning schedule.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px', alignItems: 'start' }}>
        {/* Input Form Column */}
        <form onSubmit={calculateGaps} className="glass-card">
          <h4 style={{ marginBottom: '16px' }}>Select Parameters</h4>

          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            WHICH ROLE ARE YOU TARGETING?
          </label>
          <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>
            {roleChoices.map((choice, idx) => (
              <option key={idx} value={choice}>{choice}</option>
            ))}
          </select>

          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            CURRENT SKILL INVENTORY (comma separated)
          </label>
          <textarea
            value={currentSkills}
            onChange={(e) => setCurrentSkills(e.target.value)}
            style={{ height: '140px' }}
          />

          {error && <div style={{ color: 'var(--color-red)', fontSize: '0.9rem', marginBottom: '16px' }}>⚠️ {error}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? '🔮 Assessing Competency Matrix...' : '⚖️ Calculate Skill Gap Matrix'}
          </button>
        </form>

        {/* Output Column */}
        <div className="glass-card" style={{ minHeight: '400px' }}>
          <h4 style={{ marginBottom: '16px' }}>Gap Diagnostics</h4>

          {loading ? (
            <div style={{ textAlign: 'center', marginTop: '100px' }}>
              <div className="gradient-text" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Analyzing target role competency requirements...</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>Mapping capability sets and calculating study durations</p>
            </div>
          ) : results ? (
            <div>
              {/* Coefficient Badge */}
              <div style={{
                textAlign: 'center',
                border: `1px solid ${getPercentColor(results.overall_gap_percentage)}`,
                background: 'rgba(15, 23, 42, 0.45)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>SKILL GAP COEFFICIENT</div>
                <div style={{
                  fontSize: '3.5rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-title)',
                  color: getPercentColor(results.overall_gap_percentage)
                }}>
                  {results.overall_gap_percentage}% Missing
                </div>
              </div>

              {/* Gaps table */}
              <div style={{ overflowX: 'auto', marginBottom: '25px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <th style={{ padding: '10px 8px', color: 'var(--text-bright)' }}>Skill / Tool</th>
                      <th style={{ padding: '10px 8px', color: 'var(--text-bright)' }}>Current</th>
                      <th style={{ padding: '10px 8px', color: 'var(--text-bright)' }}>Required</th>
                      <th style={{ padding: '10px 8px', color: 'var(--text-bright)' }}>Study Hours</th>
                      <th style={{ padding: '10px 8px', color: 'var(--text-bright)' }}>Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.gaps.map((gap, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--text-bright)' }}>{gap.skill_name}</td>
                        <td style={{ padding: '12px 8px' }}>{gap.current_proficiency}</td>
                        <td style={{ padding: '12px 8px' }}>{gap.required_proficiency}</td>
                        <td style={{ padding: '12px 8px' }}>~{gap.estimated_learning_hours} hrs</td>
                        <td style={{ padding: '12px 8px', color: getPriorityColor(gap.priority), fontWeight: 'bold' }}>{gap.priority}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Priority list */}
              <div>
                <strong style={{ color: 'var(--text-bright)', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>
                  🎯 Recommended Study Order:
                </strong>
                <ol style={{ paddingLeft: '20px', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px', lineHeight: '1.5' }}>
                  {results.gaps.map((gap, idx) => (
                    <li key={idx}>
                      <span style={{ color: 'var(--text-bright)', fontWeight: 600 }}>{gap.skill_name}</span> – {gap.priority} Priority (Requires ~{gap.estimated_learning_hours} hrs of learning)
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '120px', color: 'var(--text-muted)' }}>
              Select a target role and click "Calculate Skill Gap Matrix" to visualize competency differences.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
