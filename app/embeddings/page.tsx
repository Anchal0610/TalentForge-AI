'use client';

import React, { useState, useEffect } from 'react';
import Interactive3DScatter from '@/components/Interactive3DScatter';

export default function EmbeddingsPage() {
  const [reducerChoice, setReducerChoice] = useState('UMAP');
  const [showSkills, setShowSkills] = useState(true);
  const [showGaps, setShowGaps] = useState(true);
  const [showResources, setShowResources] = useState(true);

  const [userName, setUserName] = useState('Jane Doe');
  const [targetRole, setTargetRole] = useState('MLOps Engineer');
  const [userSkills, setUserSkills] = useState<string[]>(['Python', 'SQL', 'Flask', 'Docker']);
  const [missingSkills, setMissingSkills] = useState<string[]>(['Kubernetes', 'CI/CD Pipelines', 'Pinecone / Vector Databases']);

  const [filteredLabels, setFilteredLabels] = useState<string[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  const [embeddings, setEmbeddings] = useState<number[][]>([]);
  const [loading, setLoading] = useState(true);

  // Load localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('userName') || 'Jane Doe';
      setUserName(savedName);

      const savedRole = localStorage.getItem('targetRole') || 'MLOps Engineer';
      setTargetRole(savedRole);

      const savedSkillsStr = localStorage.getItem('currentSkills');
      if (savedSkillsStr) {
        setUserSkills(savedSkillsStr.split(',').map(s => s.trim()).filter(Boolean));
      }

      const savedGapsStr = localStorage.getItem('missingSkills');
      if (savedGapsStr) {
        try {
          setMissingSkills(JSON.parse(savedGapsStr));
        } catch {
          // ignore
        }
      }
    }
  }, []);

  // Recalculate node items and trigger batch embedding load
  useEffect(() => {
    setLoading(true);

    const labels = ['Candidate Profile', targetRole];
    const categories = ['User', 'Role'];

    if (showSkills) {
      userSkills.forEach(s => {
        labels.push(s);
        categories.push('Skill');
      });
    }

    if (showGaps) {
      missingSkills.forEach(s => {
        labels.push(s);
        categories.push('Technology');
      });
    }

    if (showResources) {
      missingSkills.slice(0, 2).forEach(s => {
        labels.push(`Accelerated ${s} Guide`);
        categories.push('Resource');
      });
    }

    // Load embeddings from API route
    const fetchEmbeddings = async () => {
      try {
        const res = await fetch('/api/embeddings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texts: labels })
        });
        if (!res.ok) throw new Error('Failed to load embeddings');
        const data = await res.json();
        setEmbeddings(data.embeddings);
        setFilteredLabels(labels);
        setFilteredCategories(categories);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmbeddings();
  }, [targetRole, userSkills, missingSkills, showSkills, showGaps, showResources]);

  return (
    <div>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>🔮 3D Vector Embedding Space Explorer</h1>

      <div className="glass-card">
        <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>High-Dimensional Skill & Role Clustering</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Visualize your skills in semantic relation to target roles, libraries, resources, and question banks. High-dimensional vector embeddings are computed and projected down to 3D components. 
          You can visually see the proximity vector between your candidate profile and target job roles.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '30px', alignItems: 'start' }}>
        {/* Left Column: 3D Scatter Render */}
        <div className="glass-card" style={{ padding: '12px' }}>
          <div style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4>Projected 3D Vector Space ({reducerChoice})</h4>
            <select
              value={reducerChoice}
              onChange={(e) => setReducerChoice(e.target.value)}
              style={{ width: '130px', marginBottom: 0, padding: '6px 12px', fontSize: '0.8rem' }}
            >
              <option value="UMAP">UMAP</option>
              <option value="t-SNE">t-SNE</option>
            </select>
          </div>

          {loading ? (
            <div style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="gradient-text" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Generating embeddings and running vector projections...</div>
            </div>
          ) : (
            <Interactive3DScatter
              labels={filteredLabels}
              categories={filteredCategories}
              embeddings={embeddings}
            />
          )}
        </div>

        {/* Right Column: Filters and proximity details */}
        <div>
          {/* Filters Card */}
          <div className="glass-card" style={{ fontSize: '0.85rem' }}>
            <h4 style={{ marginBottom: '16px' }}>Filter Workspace Nodes</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={showSkills} onChange={(e) => setShowSkills(e.target.checked)} />
                Show Acquired Skills
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={showGaps} onChange={(e) => setShowGaps(e.target.checked)} />
                Show Missing Skill Gaps
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={showResources} onChange={(e) => setShowResources(e.target.checked)} />
                Show Learning Resources
              </label>
            </div>
          </div>

          {/* Details Card */}
          <div className="glass-card" style={{ fontSize: '0.85rem', lineHeight: '1.5' }}>
            <h4 style={{ marginBottom: '12px' }}>Proximity Insights</h4>
            <p style={{ color: 'var(--text-muted)', marginBottom: '15px' }}>
              Similar concepts cluster together. The dotted line draws the proximity vector between your capabilities and the target role requirements.
            </p>

            {missingSkills.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '15px' }}>
                <strong style={{ color: 'var(--text-bright)', display: 'block', marginBottom: '8px' }}>Actionable Next Steps:</strong>
                <ol style={{ paddingLeft: '20px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li>Close distance to <strong>{missingSkills[0]}</strong> by building a target code project.</li>
                  <li>Check recommendations adjacent to missing clusters.</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
