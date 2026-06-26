'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

  const getScoreTextColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getScoreBorderColor = (score: number) => {
    if (score >= 80) return 'border-emerald-500/30';
    if (score >= 60) return 'border-amber-500/30';
    return 'border-rose-500/30';
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">📄 Resume Intelligence & ATS Checker</h1>
        <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md mt-4">
          <CardContent className="pt-6">
            <h3 className="text-base font-semibold text-slate-200 mb-1.5">Optimize Your Resume for ATS Algorithms</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Upload your resume (PDF, DOCX, PPTX, or TXT) and compare it against your target job description. Nexora AI's multi-agent parsing extracts your core skills, education, and milestones, scoring them directly against industry benchmarks.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Form Column */}
        <form onSubmit={runDiagnostics}>
          <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md hover:border-violet-500/20 transition-colors">
            <CardHeader>
              <CardTitle className="text-white text-lg font-bold">Diagnostic Inputs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  Upload Resume File
                </label>
                <div className="relative border border-dashed border-white/10 rounded-lg p-4 bg-slate-950/40 text-center hover:border-violet-500/30 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.docx,.pptx,.txt"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-slate-400 text-xs py-2">
                    {file ? (
                      <span className="text-emerald-400 font-medium flex items-center justify-center gap-1.5">
                        <span>📄</span> {file.name}
                      </span>
                    ) : (
                      <span>Drag & drop or click to upload PDF, DOCX, PPTX, or TXT</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  Your Email (saves records)
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-950/40 border-white/10 text-white focus-visible:border-violet-500/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  Target Job Description
                </label>
                <Textarea
                  placeholder="We are looking for a backend software engineer skilled in Python, Docker, Qdrant..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="bg-slate-950/40 border-white/10 text-white min-h-[200px] focus-visible:border-violet-500/50"
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
                {loading ? '🔮 Executing Diagnostics...' : '🚀 Run ATS Diagnostics'}
              </Button>
            </CardContent>
          </Card>
        </form>

        {/* Right Output Column */}
        <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md min-h-[400px]">
          <CardHeader>
            <CardTitle className="text-white text-lg font-bold">Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-24">
                <div className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-lg font-bold animate-pulse">
                  Analyzing resume text and checking alignment...
                </div>
                <p className="text-slate-500 text-xs mt-2">
                  Ingesting parser tables & querying model completing metrics
                </p>
              </div>
            ) : results ? (
              <div className="space-y-6">
                {/* ATS compatibility rating badge */}
                <div className={cn(
                  "text-center border rounded-xl p-6 bg-slate-950/40 backdrop-blur-sm",
                  getScoreBorderColor(results.ats_score)
                )}>
                  <div className="text-slate-400 text-xs tracking-widest uppercase">COMPATIBILITY INDEX</div>
                  <div className={cn(
                    "text-6xl font-extrabold mt-2 font-mono",
                    getScoreTextColor(results.ats_score)
                  )}>
                    {results.ats_score}%
                  </div>
                </div>

                {results.file_url && (
                  <div className="text-xs text-blue-400 flex items-center gap-1">
                    <span>✓</span> Uploaded cloud backup:{" "}
                    <a
                      href={results.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline font-medium text-blue-300 hover:text-blue-200"
                    >
                      File URL Link
                    </a>
                  </div>
                )}

                <div className="space-y-5">
                  <div>
                    <h5 className="text-sm font-semibold text-slate-200 mb-2">Extracted Skills:</h5>
                    <div className="flex flex-wrap gap-2">
                      {results.skills_extracted.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2.5 py-1 text-xs font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/30 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-semibold text-slate-200 mb-2">Candidate Strengths:</h5>
                    <ul className="space-y-1.5 text-slate-400 text-xs pl-1">
                      {results.strengths.map((str, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-sm font-semibold text-slate-200 mb-2">ATS Optimization Areas:</h5>
                    <ul className="space-y-1.5 text-slate-400 text-xs pl-1">
                      {results.weaknesses_improvements.map((weak, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-rose-500 font-bold">!</span>
                          <span className="text-slate-300">{weak}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-28 text-slate-500 text-sm">
                Upload your resume and paste a job description, then click "Run ATS Diagnostics" to begin.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
