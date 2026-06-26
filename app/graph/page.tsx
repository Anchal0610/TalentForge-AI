'use client';

import React, { useState, useEffect } from 'react';
import InteractiveKnowledgeGraph from '@/components/InteractiveKnowledgeGraph';

export default function GraphPage() {
  const [userName, setUserName] = useState('Jane Doe');
  const [targetRole, setTargetRole] = useState('MLOps Engineer');
  const [skills, setSkills] = useState<string[]>(['Python', 'SQL', 'Flask', 'Docker']);
  const [gaps, setGaps] = useState<string[]>(['Kubernetes', 'CI/CD Pipelines', 'Pinecone / Vector Databases']);
  const [projects] = useState<string[]>(['Churn Predictor API', 'Ingestion Engine']);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('userName') || 'Jane Doe';
      setUserName(savedName);

      const savedRole = localStorage.getItem('targetRole') || 'MLOps Engineer';
      setTargetRole(savedRole);

      const savedSkillsStr = localStorage.getItem('currentSkills');
      if (savedSkillsStr) {
        setSkills(savedSkillsStr.split(',').map(s => s.trim()).filter(Boolean));
      }

      const savedGapsStr = localStorage.getItem('missingSkills');
      if (savedGapsStr) {
        try {
          setGaps(JSON.parse(savedGapsStr));
        } catch {
          // ignore
        }
      }
      setLoading(false);
    }
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>🕸️ Career Knowledge Graph Explorer</h1>

      <div className="glass-card">
        <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Semantic Mapping of Skills & Resources</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Visualize how your capabilities link to target engineering roles, technologies, projects, study guides, and mock interviews. Red connections indicate critical missing skills (gaps) to acquire.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '30px', alignItems: 'start' }}>
        {/* Graph Render */}
        <div className="glass-card" style={{ padding: '12px' }}>
          <h4 style={{ marginBottom: '16px', paddingLeft: '12px', paddingTop: '12px' }}>Interactive Skill Graph Map</h4>
          {loading ? (
            <div style={{ height: '450px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="gradient-text" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Stitching nodes and assembling visual relationships...</div>
            </div>
          ) : (
            <InteractiveKnowledgeGraph
              userName={userName}
              targetRole={targetRole}
              skills={skills}
              gaps={gaps}
              projects={projects}
            />
          )}
        </div>

        {/* Legend */}
        <div className="glass-card" style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
          <h4 style={{ marginBottom: '16px' }}>Graph Legend</h4>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', listStyle: 'none' }}>
            <li><span style={{ color: '#FF4B4B', fontWeight: 'bold' }}>● User Node</span>: Represents you.</li>
            <li><span style={{ color: '#00C0F2', fontWeight: 'bold' }}>● Target Role</span>: The title you are pursuing.</li>
            <li><span style={{ color: '#00F294', fontWeight: 'bold' }}>● Acquired Skill</span>: Your parsed/validated capabilities.</li>
            <li><span style={{ color: '#FFAA00', fontWeight: 'bold' }}>● Technology Category</span>: Broad stack classifications.</li>
            <li><span style={{ color: '#D946EF', fontWeight: 'bold' }}>● Study Guides</span>: Resources to close gaps.</li>
            <li><span style={{ color: '#A855F7', fontWeight: 'bold' }}>● Interview Questions</span>: Interactive practice files.</li>
            <li><span style={{ color: '#EAB308', fontWeight: 'bold' }}>● Project Node</span>: Portfolio builds.</li>
          </ul>
          
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '15px 0', marginTop: '20px' }}>
            <div>Total Nodes: <strong>{2 + skills.length + gaps.length * 3 + projects.length}</strong></div>
            <div>Total Edges: <strong>{1 + skills.length + gaps.length * 3 + projects.length * 2}</strong></div>
          </div>

          <button onClick={() => window.location.reload()} className="btn btn-secondary" style={{ width: '100%', padding: '10px' }}>
            Refresh Graph Nodes
          </button>
        </div>
      </div>
    </div>
  );
}
