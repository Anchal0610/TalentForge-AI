'use client';

import React, { useState, useEffect } from 'react';

interface ATSResults {
  ats_score: number;
  skills_extracted: string[];
  experience_summary: string;
  projects: string[];
  education: string[];
  strengths: string[];
  weaknesses_improvements: string[];
  overlap_percentage: number;
  file_url: string | null;
}

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ATSResults | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('userEmail') || '';
      setEmail(savedEmail);
      
      const savedResults = localStorage.getItem('atsResults');
      if (savedResults) {
        try {
          setResults(JSON.parse(savedResults));
        } catch {
          // ignore
        }
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const runDiagnostics = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResults(null);

    if (!file) {
      setError('Please upload a resume file first.');
      return;
    }
    if (!jobDescription) {
      setError('Please enter a target job description.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('jobDescription', jobDescription);
      if (email) {
        formData.append('email', email);
        localStorage.setItem('userEmail', email);
      }

      const res = await fetch('/api/ats', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Server error occurred during parsing.');
      }

      const data: ATSResults = await res.json();
      setResults(data);
      localStorage.setItem('atsResults', JSON.stringify(data));
      localStorage.setItem('atsScore', data.ats_score.toString());
      
      // Seed overall readiness updates
      const currentReadiness = parseFloat(localStorage.getItem('overallReadiness') || '74.5');
      const updatedReadiness = Math.round(((data.ats_score + currentReadiness) / 2) * 10) / 10;
      localStorage.setItem('overallReadiness', updatedReadiness.toString());

      // Seed default skills lists from parsed values for subsequent pages
      if (data.skills_extracted.length > 0) {
        localStorage.setItem('currentSkills', data.skills_extracted.slice(0, 5).join(', '));
      }
      if (data.weaknesses_improvements.length > 0) {
        const simulatedGaps = data.weaknesses_improvements.slice(0, 3).map(w => {
          if (w.includes('(')) {
            const match = w.match(/\(([^)]+)\)/);
            return match ? match[1] : w;
          }
          return w.split(' ').slice(-1)[0].replace(/[^a-zA-Z]/g, '');
        }).filter(Boolean);
        localStorage.setItem('missingSkills', JSON.stringify(simulatedGaps.length > 0 ? simulatedGaps : ['Kubernetes', 'CI/CD Pipelines', 'Pinecone / Vector Databases']));
      }

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--color-green)';
    if (score >= 60) return 'var(--color-orange)';
    return 'var(--color-red)';
  };

  return (
    <div>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>📄 Resume Intelligence & ATS Checker</h1>

      <div className="glass-card">
        <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Optimize Your Resume for ATS Algorithms</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Upload your resume (PDF, DOCX, PPTX, or TXT) and compare it against your target job description. Nexora AI's multi-agent parsing extracts your core skills, education, and milestones, scoring them directly against industry benchmarks.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>
        {/* Left Form Column */}
        <form onSubmit={runDiagnostics} className="glass-card">
          <h4 style={{ marginBottom: '16px' }}>Diagnostic Inputs</h4>
          
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            UPLOAD RESUME FILE
          </label>
          <input
            type="file"
            accept=".pdf,.docx,.pptx,.txt"
            onChange={handleFileChange}
            style={{
              marginBottom: '20px',
              border: '1px solid var(--glass-border)',
              padding: '10px',
              background: 'rgba(15,23,42,0.4)',
              width: '100%',
              borderRadius: '8px',
              color: 'var(--text-main)'
            }}
          />

          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            YOUR EMAIL (saves records)
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            TARGET JOB DESCRIPTION
          </label>
          <textarea
            placeholder="We are looking for a backend software engineer skilled in Python, Docker, Qdrant..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            style={{ height: '220px', resize: 'vertical' }}
          />

          {error && <div style={{ color: 'var(--color-red)', fontSize: '0.9rem', marginBottom: '16px' }}>⚠️ {error}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? '🔮 Executing Diagnostics...' : '🚀 Run ATS Diagnostics'}
          </button>
        </form>

        {/* Right Output Column */}
        <div className="glass-card" style={{ minHeight: '400px' }}>
          <h4 style={{ marginBottom: '16px' }}>Analysis Results</h4>

          {loading ? (
            <div style={{ textAlign: 'center', marginTop: '100px' }}>
              <div className="gradient-text" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Analyzing resume text and checking alignment...</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>Ingesting parser tables & querying model completing metrics</p>
            </div>
          ) : results ? (
            <div>
              {/* ATS compatibility rating badge */}
              <div style={{
                textAlign: 'center',
                border: `1px solid ${getScoreColor(results.ats_score)}`,
                background: 'rgba(15, 23, 42, 0.45)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>COMPATIBILITY INDEX</div>
                <div style={{
                  fontSize: '4rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-title)',
                  color: getScoreColor(results.ats_score)
                }}>
                  {results.ats_score}%
                </div>
              </div>

              {results.file_url && (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-blue)', marginBottom: '15px' }}>
                  ✓ Uploaded cloud backup: <a href={results.file_url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-blue)', textDecoration: 'underline' }}>File URL Link</a>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <strong style={{ color: 'var(--text-bright)', fontSize: '0.9rem' }}>Extracted Skills:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {results.skills_extracted.map((skill, index) => (
                      <span key={index} className="neon-badge badge-purple" style={{ marginBottom: 0 }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <strong style={{ color: 'var(--text-bright)', fontSize: '0.9rem' }}>Candidate Strengths:</strong>
                  <ul style={{ paddingLeft: '20px', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px', lineHeight: '1.6' }}>
                    {results.strengths.map((str, index) => (
                      <li key={index}>✅ {str}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <strong style={{ color: 'var(--text-bright)', fontSize: '0.9rem' }}>ATS Optimization Areas:</strong>
                  <ul style={{ paddingLeft: '20px', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px', lineHeight: '1.6' }}>
                    {results.weaknesses_improvements.map((weak, index) => (
                      <li key={index} style={{ color: 'rgba(255, 255, 255, 0.8)' }}>⚠️ {weak}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '120px', color: 'var(--text-muted)' }}>
              Upload your resume and paste a job description, then click "Run ATS Diagnostics" to begin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
