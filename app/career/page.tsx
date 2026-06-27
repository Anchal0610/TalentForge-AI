'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2 uppercase">AI Career Recommendations</h1>
        <Card className="border border-zinc-850 bg-[#09090b]">
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold text-slate-200 mb-1.5 uppercase">Discover Optimal Job Pathways</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Leverage our multi-agent career intelligence engine to predict matching roles, check industry trends, and determine high-growth pathways suited to your unique skillset.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Input Column */}
        <form onSubmit={generateRecommendations}>
          <Card className="border border-zinc-850 bg-[#09090b] hover:border-zinc-750 transition-colors">
            <CardHeader className="border-b border-zinc-900 pb-3">
              <CardTitle className="text-white text-sm font-bold uppercase tracking-wider">Profile Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                  Technical Skills (comma separated)
                </label>
                <Textarea
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="bg-zinc-950 border-zinc-850 text-white min-h-[100px] focus-visible:border-zinc-500 text-xs"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                  <span>Years of Experience</span>
                  <span className="text-white font-mono text-xs">{experience} Years</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={experience}
                  onChange={(e) => setExperience(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-zinc-950 border border-zinc-850 rounded appearance-none cursor-pointer accent-white focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                  Interests / Career Goals
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Cloud scale, AI, MLOps"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  className="bg-zinc-950 border-zinc-850 text-white focus-visible:border-zinc-500 h-9 text-xs"
                />
              </div>

              {error && (
                <div className="text-zinc-300 text-xs font-semibold">
                  Error: {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-white hover:bg-zinc-200 text-black font-bold h-9 text-xs uppercase tracking-wider transition-colors rounded"
              >
                {loading ? 'Plotting Pathways...' : 'Generate Recommendations'}
              </Button>
            </CardContent>
          </Card>
        </form>

        {/* Output Column */}
        <Card className="border border-zinc-850 bg-[#09090b] min-h-[400px]">
          <CardHeader className="border-b border-zinc-900 pb-3">
            <CardTitle className="text-white text-sm font-bold uppercase tracking-wider">Recommended Pathways</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="text-center py-24">
                <div className="text-white text-sm font-bold animate-pulse uppercase tracking-wider">
                  Analyzing technical capabilities against market trends...
                </div>
                <p className="text-zinc-500 text-[10px] mt-1.5 uppercase font-mono">
                  Resolving role indexing and parsing salary vectors
                </p>
              </div>
            ) : results ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Role Fit Recommendations</h3>
                  <div className="flex flex-col gap-2">
                    {results.predicted_roles.map((role, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-zinc-300 text-xs font-semibold uppercase">
                        <span className="text-white font-mono font-bold">-</span>
                        <span className="text-white">{role}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-zinc-900 pt-5">
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Fit Alignment Reasoning</h5>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    {results.alignment_reasoning}
                  </p>
                </div>

                <div className="border-t border-zinc-900 pt-5">
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Market Demand & Salary Trends</h5>
                  <ul className="space-y-2 text-zinc-400 text-xs pl-0.5">
                    {Object.entries(results.growth_trends).map(([role, trend], idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-white font-mono font-bold">*</span>
                        <span>
                          <strong className="text-zinc-200 font-semibold uppercase text-[10px] tracking-wide block mb-0.5">{role}</strong>
                          {trend}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-28 text-zinc-500 text-xs uppercase tracking-wider font-mono">
                Input profile details to calculate recommended career paths.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
