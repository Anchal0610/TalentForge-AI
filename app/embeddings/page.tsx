'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">🔮 3D Vector Embedding Space Explorer</h1>
        <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md mt-4">
          <CardContent className="pt-6">
            <h3 className="text-base font-semibold text-slate-200 mb-1.5">High-Dimensional Skill & Role Clustering</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Visualize your skills in semantic relation to target roles, libraries, resources, and question banks. High-dimensional vector embeddings are computed and projected down to 3D components. 
              You can visually see the proximity vector between your candidate profile and target job roles.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Column: 3D Scatter Render */}
        <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md lg:col-span-3 overflow-hidden p-2">
          <CardHeader className="p-4 flex flex-row items-center justify-between">
            <CardTitle className="text-white text-base font-semibold">Projected 3D Vector Space ({reducerChoice})</CardTitle>
            <select
              value={reducerChoice}
              onChange={(e) => setReducerChoice(e.target.value)}
              className="h-8 px-2 bg-slate-950/45 border border-white/10 rounded-md text-xs text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer"
            >
              <option value="UMAP" className="bg-[#050811] text-slate-200">UMAP</option>
              <option value="t-SNE" className="bg-[#050811] text-slate-200">t-SNE</option>
            </select>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="h-[500px] flex items-center justify-center">
                <div className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-sm font-bold animate-pulse">
                  Generating embeddings and running vector projections...
                </div>
              </div>
            ) : (
              <Interactive3DScatter
                labels={filteredLabels}
                categories={filteredCategories}
                embeddings={embeddings}
              />
            )}
          </CardContent>
        </Card>

        {/* Right Column: Filters and proximity details */}
        <div className="space-y-6">
          {/* Filters Card */}
          <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white text-base font-semibold">Filter Workspace Nodes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 text-xs text-slate-400">
                <label className="flex items-center gap-2.5 cursor-pointer hover:text-slate-200 transition-colors">
                  <input
                    type="checkbox"
                    checked={showSkills}
                    onChange={(e) => setShowSkills(e.target.checked)}
                    className="size-3.5 bg-slate-950 border-white/10 border rounded focus:ring-purple-500/20 text-purple-600 accent-purple-500"
                  />
                  <span>Show Acquired Skills</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer hover:text-slate-200 transition-colors">
                  <input
                    type="checkbox"
                    checked={showGaps}
                    onChange={(e) => setShowGaps(e.target.checked)}
                    className="size-3.5 bg-slate-950 border-white/10 border rounded focus:ring-purple-500/20 text-purple-600 accent-purple-500"
                  />
                  <span>Show Missing Skill Gaps</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer hover:text-slate-200 transition-colors">
                  <input
                    type="checkbox"
                    checked={showResources}
                    onChange={(e) => setShowResources(e.target.checked)}
                    className="size-3.5 bg-slate-950 border-white/10 border rounded focus:ring-purple-500/20 text-purple-600 accent-purple-500"
                  />
                  <span>Show Learning Resources</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white text-base font-semibold">Proximity Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-400 text-xs leading-relaxed">
                Similar concepts cluster together. The dotted line draws the proximity vector between your capabilities and the target role requirements.
              </p>

              {missingSkills.length > 0 && (
                <div className="border-t border-white/10 pt-4">
                  <strong className="text-slate-200 text-xs font-semibold block mb-2">Actionable Next Steps:</strong>
                  <ol className="space-y-2 text-slate-400 text-xs pl-1">
                    <li className="flex gap-2">
                      <span className="text-violet-400 font-bold font-mono">1.</span>
                      <span>
                        Close distance to <strong className="text-slate-200">{missingSkills[0]}</strong> by building a target code project.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-violet-400 font-bold font-mono">2.</span>
                      <span>Check recommendations adjacent to missing clusters.</span>
                    </li>
                  </ol>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
