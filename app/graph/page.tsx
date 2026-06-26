'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">🕸️ Career Knowledge Graph Explorer</h1>
        <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md mt-4">
          <CardContent className="pt-6">
            <h3 className="text-base font-semibold text-slate-200 mb-1.5">Semantic Mapping of Skills & Resources</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Visualize how your capabilities link to target engineering roles, technologies, projects, study guides, and mock interviews. Red connections indicate critical missing skills (gaps) to acquire.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Graph Render */}
        <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md lg:col-span-3 overflow-hidden p-2">
          <CardHeader className="p-4">
            <CardTitle className="text-white text-base font-semibold">Interactive Skill Graph Map</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="h-[450px] flex items-center justify-center">
                <div className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-sm font-bold animate-pulse">
                  Stitching nodes and assembling visual relationships...
                </div>
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
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="space-y-6">
          <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white text-base font-semibold">Graph Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <ul className="space-y-3.5 text-xs text-slate-400 leading-normal">
                <li className="flex items-center gap-2">
                  <span className="text-red-500 font-extrabold text-sm">•</span>
                  <span><strong className="text-slate-200">User Node</strong>: Represents you.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-sky-400 font-extrabold text-sm">•</span>
                  <span><strong className="text-slate-200">Target Role</strong>: The title you are pursuing.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-extrabold text-sm">•</span>
                  <span><strong className="text-slate-200">Acquired Skill</strong>: Your parsed/validated capabilities.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400 font-extrabold text-sm">•</span>
                  <span><strong className="text-slate-200">Technology Category</strong>: Broad stack classifications.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-fuchsia-400 font-extrabold text-sm">•</span>
                  <span><strong className="text-slate-200">Study Guides</strong>: Resources to close gaps.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-400 font-extrabold text-sm">•</span>
                  <span><strong className="text-slate-200">Interview Questions</strong>: Practice files.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-yellow-400 font-extrabold text-sm">•</span>
                  <span><strong className="text-slate-200">Project Node</strong>: Portfolio builds.</span>
                </li>
              </ul>
              
              <div className="border-t border-white/10 pt-4 text-xs text-slate-400 space-y-1.5 font-sans">
                <div className="flex justify-between">
                  <span>Total Nodes:</span>
                  <strong className="text-slate-200 font-semibold font-mono">{2 + skills.length + gaps.length * 3 + projects.length}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Total Edges:</span>
                  <strong className="text-slate-200 font-semibold font-mono">{1 + skills.length + gaps.length * 3 + projects.length * 2}</strong>
                </div>
              </div>

              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full text-slate-200 border-white/10 hover:bg-white/5 font-semibold text-xs mt-2"
              >
                Refresh Graph Nodes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
