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
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">🧭 AI Career Recommendations</h1>
        <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md mt-4">
          <CardContent className="pt-6">
            <h3 className="text-base font-semibold text-slate-200 mb-1.5">Discover Optimal Job Pathways</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Leverage our multi-agent career intelligence engine to predict matching roles, check industry trends, and determine high-growth pathways suited to your unique skillset.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Input Column */}
        <form onSubmit={generateRecommendations}>
          <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md hover:border-violet-500/20 transition-colors">
            <CardHeader>
              <CardTitle className="text-white text-lg font-bold">Your Profile Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  Your Technical Skills (comma separated)
                </label>
                <Textarea
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="bg-slate-950/40 border-white/10 text-white min-h-[100px] focus-visible:border-violet-500/50"
                />
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  <span>Years of Experience</span>
                  <span className="text-violet-400 font-mono text-sm">{experience} Years</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={experience}
                  onChange={(e) => setExperience(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-950/60 border border-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  Interests / Career Goals
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Cloud scale, AI, MLOps"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  className="bg-slate-950/40 border-white/10 text-white focus-visible:border-violet-500/50"
                />
              </div>

              {error && (
                <div className="text-rose-400 text-sm font-medium flex items-center gap-1.5">
                  <span>⚠️</span> {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold h-10 transition-all duration-200"
              >
                {loading ? '🔮 Plotting Pathways...' : '🧭 Generate Recommendations'}
              </Button>
            </CardContent>
          </Card>
        </form>

        {/* Output Column */}
        <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md min-h-[400px]">
          <CardHeader>
            <CardTitle className="text-white text-lg font-bold">Recommended Pathways</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-24">
                <div className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-lg font-bold animate-pulse">
                  Analyzing technical capabilities against market trends...
                </div>
                <p className="text-slate-500 text-xs mt-2">
                  Resolving role indexing and parsing salary vectors
                </p>
              </div>
            ) : results ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-3">Role Fit Recommendations:</h3>
                  <div className="flex flex-col gap-2">
                    {results.predicted_roles.map((role, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 text-slate-300 text-sm">
                        <span className="text-amber-400">★</span>
                        <strong className="text-white font-semibold">{role}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-5">
                  <h5 className="text-sm font-semibold text-slate-200 mb-2">Fit Alignment Reasoning:</h5>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    {results.alignment_reasoning}
                  </p>
                </div>

                <div className="border-t border-white/10 pt-5">
                  <h5 className="text-sm font-semibold text-slate-200 mb-2">Market Demand & Salary Trends:</h5>
                  <ul className="space-y-2 text-slate-400 text-xs pl-1">
                    {Object.entries(results.growth_trends).map(([role, trend], idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="text-violet-400 font-bold">•</span>
                        <span>
                          <strong className="text-slate-200 font-semibold">{role}</strong>: {trend}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-28 text-slate-500 text-sm">
                Input your profile details and click "Generate Recommendations" to calculate pathway trends.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
