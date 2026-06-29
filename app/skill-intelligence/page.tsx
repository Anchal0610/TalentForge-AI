'use client';

import React, { useState, useEffect } from 'react';
import { useCareer } from '@/components/CareerContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  Network, 
  Binary, 
  RefreshCw,
  Compass,
  Layers,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import InteractiveKnowledgeGraph from '@/components/InteractiveKnowledgeGraph';
import Interactive3DScatter from '@/components/Interactive3DScatter';

export default function SkillIntelligencePage() {
  const { sessionData, loading, loadSession } = useCareer();
  const [emailInput, setEmailInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'graph' | '3d'>('graph');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!emailInput) return;
    const found = await loadSession(emailInput);
    if (!found) {
      setErrorMsg('No session record found for this email. Please upload your resume first.');
    }
  };

  // Helper lists for Interactive3DScatter
  const labels = sessionData?.vector_embeddings.map(v => v.label) || [];
  const categories = sessionData?.vector_embeddings.map(v => v.category) || [];
  const embeddings = sessionData?.vector_embeddings.map(v => v.embedding || Array(1024).fill(0)) || [];

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/30 pb-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
            <Network className="text-accent w-6 h-6" /> Skill Intelligence
          </h1>
          <p className="text-xs text-muted">Explore semantic visual relationship mappings and high-dimensional vector embeddings of your skillset</p>
        </div>
      </div>

      {/* 2. No Session State */}
      {!sessionData ? (
        <Card className="bg-surface border-border p-8 text-center max-w-xl mx-auto space-y-6 mt-10 shadow-lg">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto text-accent select-none">
            <Network className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white uppercase tracking-wide">Resume Analysis Required</h2>
            <p className="text-xs text-muted leading-relaxed">
              Nexora AI needs your parsed capabilities to assemble the Knowledge Graph and compute Three.js projections. Please upload your resume in the Document Hub to start generating your skill intelligence dashboard.
            </p>
          </div>

          <div className="border-t border-border/30 pt-6">
            <Link href="/document-hub">
              <Button
                className="w-full bg-accent hover:bg-accent-glow text-white font-bold h-9 text-xs uppercase tracking-wider transition-colors rounded cursor-pointer"
              >
                Go to Document Hub
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        /* 3. Session Active - Show Visualizers with Tabs */
        <div className="space-y-6">
          {/* Tab Selector */}
          <div className="flex border-b border-border/30 gap-4">
            <button
              onClick={() => setActiveTab('graph')}
              className={cn(
                "pb-3 text-xs tracking-wider uppercase font-bold border-b-2 px-1 transition-all cursor-pointer",
                activeTab === 'graph' 
                  ? "text-accent border-accent font-extrabold" 
                  : "text-muted border-transparent hover:text-white"
              )}
            >
              2D Knowledge Graph
            </button>
            <button
              onClick={() => setActiveTab('3d')}
              className={cn(
                "pb-3 text-xs tracking-wider uppercase font-bold border-b-2 px-1 transition-all cursor-pointer",
                activeTab === '3d' 
                  ? "text-accent border-accent font-extrabold" 
                  : "text-muted border-transparent hover:text-white"
              )}
            >
              3D Embeddings Space
            </button>
          </div>

          {/* Render Area */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            
            {/* Visualizer Panel */}
            <Card className="bg-surface border-border lg:col-span-3 p-2 overflow-hidden">
              <CardHeader className="p-4 border-b border-border/30">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  {activeTab === 'graph' ? (
                    <>
                      <Network className="w-4 h-4 text-accent animate-pulse" />
                      <span>Interactive Career Knowledge Graph (2D D3)</span>
                    </>
                  ) : (
                    <>
                      <Binary className="w-4 h-4 text-accent animate-pulse" />
                      <span>Interactive High-Dimensional Vector Embeddings (3D)</span>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {activeTab === 'graph' ? (
                  <div className="w-full">
                    <InteractiveKnowledgeGraph
                      userName={sessionData.name}
                      targetRole={sessionData.target_role}
                      skills={sessionData.skills_present}
                      gaps={sessionData.skills_missing.map(g => g.skill_name)}
                      projects={sessionData.projects}
                    />
                  </div>
                ) : (
                  <div className="w-full">
                    <Interactive3DScatter
                      labels={labels}
                      categories={categories}
                      embeddings={embeddings}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Legend / Legend Controls */}
            <div className="space-y-4">
              <Card className="bg-surface border-border p-5">
                <CardHeader className="p-0 pb-3 border-b border-border/30">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-white">Visualizer Legend</CardTitle>
                </CardHeader>
                <CardContent className="p-0 pt-4 space-y-4">
                  <ul className="space-y-3 text-xs text-muted leading-normal">
                    <li className="flex items-center gap-2">
                      <span className="text-rose-500 font-extrabold text-sm shrink-0">•</span>
                      <span><strong className="text-zinc-200">Candidate Node</strong>: Represents you.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-sky-400 font-extrabold text-sm shrink-0">•</span>
                      <span><strong className="text-zinc-200">Target Role</strong>: The career path you aim for.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-400 font-extrabold text-sm shrink-0">•</span>
                      <span><strong className="text-zinc-200">Acquired Skill</strong>: Validated competencies.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-amber-400 font-extrabold text-sm shrink-0">•</span>
                      <span><strong className="text-zinc-200">Technology Gap</strong>: Skills missing from resume.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-fuchsia-400 font-extrabold text-sm shrink-0">•</span>
                      <span><strong className="text-zinc-200">Study Guides</strong>: Syllabus links to close gaps.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-yellow-400 font-extrabold text-sm shrink-0">•</span>
                      <span><strong className="text-zinc-200">Projects</strong>: Core portfolio details.</span>
                    </li>
                  </ul>

                  <div className="border-t border-border/30 pt-4 text-xs text-muted space-y-1">
                    <div className="flex justify-between">
                      <span>Mapped Elements:</span>
                      <strong className="text-white font-mono">{labels.length} nodes</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Projections:</span>
                      <strong className="text-white font-mono">{activeTab === 'graph' ? 'Force Direct 2D' : 'UMAP 3D Space'}</strong>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {activeTab === '3d' && (
                <Card className="bg-surface border-border p-4 text-xs text-muted leading-relaxed">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-accent uppercase tracking-widest mb-1">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>How to Navigate 3D</span>
                  </div>
                  Drag with mouse to rotate coordinates. Use scroll wheel to zoom. Hover over nodes to trigger description tags and coordinate outputs.
                </Card>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
