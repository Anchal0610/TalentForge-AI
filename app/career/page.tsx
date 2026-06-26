'use client';

import React, { useState, useEffect } from 'react';

interface CareerRecommendation {
  predicted_roles: string[];
  alignment_reasoning: string;
  growth_trends: { [role: string]: string };
}

export default function CareerPage() {
  const [skills, setSkills] = useState('Python, Docker, SQLite, Git, basic Machine Learning');
  const [experience, setExperience] = useState(2);
  const [interests, setInterests] = useState('MLOps, automated deployment, microservices');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CareerRecommendation | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSkills = localStorage.getItem('currentSkills');
      if (savedSkills) setSkills(savedSkills);

      const savedRecs = localStorage.getItem('careerRecommendations');
      if (savedRecs) {
        try {
          setResults(JSON.parse(savedRecs));
        } catch {
          // ignore
        }
      }
    }
  }, []);

  const generateRecommendations = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResults(null);
    setLoading(true);

    try {
      const res = await fetch('/api/career', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills, experience, interests })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Server failed to calculate pathway matches.');
      }

      const data: CareerRecommendation = await res.json();
      setResults(data);
      localStorage.setItem('careerRecommendations', JSON.stringify(data));
      
      if (data.predicted_roles && data.predicted_roles.length > 0) {
        localStorage.setItem('predictedRoles', JSON.stringify(data.predicted_roles));
        localStorage.setItem('targetRole', data.predicted_roles[0]);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>🧭 AI Career Recommendations</h1>

      <div className="glass-card">
        <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Discover Optimal Job Pathways</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Leverage our multi-agent career intelligence engine to predict matching roles, check industry trends, and determine high-growth pathways suited to your unique skillset.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>
        {/* Input Column */}
        <form onSubmit={generateRecommendations} className="glass-card">
          <h4 style={{ marginBottom: '16px' }}>Your Profile Parameters</h4>

          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            YOUR TECHNICAL SKILLS (comma separated)
          </label>
          <textarea
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            style={{ height: '90px' }}
          />

          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            YEARS OF EXPERIENCE ({experience} Years)
          </label>
          <input
            type="range"
            min="0"
            max="15"
            value={experience}
            onChange={(e) => setExperience(parseInt(e.target.value))}
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.1)',
              height: '6px',
              borderRadius: '4px',
              outline: 'none',
              marginBottom: '25px',
              cursor: 'pointer'
            }}
          />

          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            INTERESTS / CAREER GOALS
          </label>
          <input
            type="text"
            placeholder="e.g. Cloud scale, AI, MLOps"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
          />

          {error && <div style={{ color: 'var(--color-red)', fontSize: '0.9rem', marginBottom: '16px' }}>⚠️ {error}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? '🔮 Plotting Pathways...' : '🧭 Generate Recommendations'}
          </button>
        </form>

        {/* Output Column */}
        <div className="glass-card" style={{ minHeight: '400px' }}>
          <h4 style={{ marginBottom: '16px' }}>Recommended Pathways</h4>

          {loading ? (
            <div style={{ textAlign: 'center', marginTop: '100px' }}>
              <div className="gradient-text" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Analyzing technical capabilities against market trends...</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>Resolving role indexing and parsing salary vectors</p>
            </div>
          ) : results ? (
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>Role Fit Recommendations:</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {results.predicted_roles.map((role, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--color-orange)' }}>🌟</span>
                    <strong style={{ color: 'var(--text-bright)' }}>{role}</strong>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '15px', marginBottom: '20px' }}>
                <strong style={{ color: 'var(--text-bright)', fontSize: '0.9rem', display: 'block', marginBottom: '6px' }}>
                  Fit Alignment Reasoning:
                </strong>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  {results.alignment_reasoning}
                </p>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '15px' }}>
                <strong style={{ color: 'var(--text-bright)', fontSize: '0.9rem', display: 'block', marginBottom: '6px' }}>
                  Market Demand & Salary Trends:
                </strong>
                <ul style={{ paddingLeft: '20px', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px', lineHeight: '1.5' }}>
                  {Object.entries(results.growth_trends).map(([role, trend], idx) => (
                    <li key={idx}>
                      <span style={{ color: 'var(--text-bright)', fontWeight: 600 }}>{role}</span>: {trend}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '120px', color: 'var(--text-muted)' }}>
              Input your profile details and click "Generate Recommendations" to calculate pathway trends.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
