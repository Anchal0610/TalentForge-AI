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
      
      const currentReadiness = parseFloat(localStorage.getItem('overallReadiness') || '74.5');
      const updatedReadiness = Math.round(((data.ats_score + currentReadiness) / 2) * 10) / 10;
      localStorage.setItem('overallReadiness', updatedReadiness.toString());

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
    if (score >= 80) return 'text-white';
    if (score >= 60) return 'text-zinc-300';
    return 'text-zinc-450';
  };

  const getScoreBorderColor = (score: number) => {
    if (score >= 80) return 'border-white/40';
    if (score >= 60) return 'border-zinc-700';
    return 'border-zinc-850';
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2 uppercase">Resume Intelligence & ATS Checker</h1>
        <Card className="border border-zinc-850 bg-[#09090b]">
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold text-slate-200 mb-1.5 uppercase">Optimize Your Resume for ATS Algorithms</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Upload your resume (PDF, DOCX, PPTX, or TXT) and compare it against your target job description. Nexora AI's multi-agent parsing extracts your core skills, education, and milestones, scoring them directly against industry benchmarks.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Form Column */}
        <form onSubmit={runDiagnostics}>
          <Card className="border border-zinc-850 bg-[#09090b] hover:border-zinc-750 transition-colors">
            <CardHeader className="border-b border-zinc-900 pb-3">
              <CardTitle className="text-white text-sm font-bold uppercase tracking-wider">Diagnostic Inputs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                  Upload Resume File
                </label>
                <div className="relative border border-dashed border-zinc-800 rounded p-4 bg-zinc-950/40 text-center hover:border-zinc-550 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.docx,.pptx,.txt"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-zinc-450 text-[11px] py-1.5 font-medium">
                    {file ? (
                      <span className="text-white font-semibold">
                        Selected: {file.name}
                      </span>
                    ) : (
                      <span>Drag & drop or click to upload PDF, DOCX, PPTX, or TXT</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                  Your Email (saves records)
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-zinc-950 border-zinc-850 text-white focus-visible:border-zinc-500 h-9 text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                  Target Job Description
                </label>
                <Textarea
                  placeholder="We are looking for a backend software engineer skilled in Python, Docker, Qdrant..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="bg-zinc-950 border-zinc-850 text-white min-h-[180px] focus-visible:border-zinc-500 text-xs"
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
                {loading ? 'Executing Diagnostics...' : 'Run ATS Diagnostics'}
              </Button>
            </CardContent>
          </Card>
        </form>

        {/* Right Output Column */}
        <Card className="border border-zinc-850 bg-[#09090b] min-h-[400px]">
          <CardHeader className="border-b border-zinc-900 pb-3">
            <CardTitle className="text-white text-sm font-bold uppercase tracking-wider">Analysis Results</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="text-center py-24">
                <div className="text-white text-sm font-bold animate-pulse uppercase tracking-wider">
                  Analyzing resume text and checking alignment...
                </div>
                <p className="text-zinc-500 text-[10px] mt-1.5 uppercase font-mono">
                  Ingesting parser tables & querying model completing metrics
                </p>
              </div>
            ) : results ? (
              <div className="space-y-6">
                {/* ATS compatibility rating badge */}
                <div className={cn(
                  "text-center border rounded p-6 bg-zinc-950/40",
                  getScoreBorderColor(results.ats_score)
                )}>
                  <div className="text-zinc-500 text-[10px] tracking-widest uppercase font-semibold">COMPATIBILITY INDEX</div>
                  <div className={cn(
                    "text-6xl font-extrabold mt-2 font-mono",
                    getScoreTextColor(results.ats_score)
                  )}>
                    {results.ats_score}%
                  </div>
                </div>

                {results.file_url && (
                  <div className="text-[11px] text-zinc-300">
                    Uploaded cloud backup:{" "}
                    <a
                      href={results.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline font-bold text-white hover:text-zinc-300"
                    >
                      File Link URL
                    </a>
                  </div>
                )}

                <div className="space-y-5">
                  <div>
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Extracted Skills</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {results.skills_extracted.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 text-[10px] font-semibold text-zinc-300 bg-zinc-900 border border-zinc-800 rounded uppercase font-mono"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Candidate Strengths</h5>
                    <ul className="space-y-1.5 text-zinc-400 text-xs pl-0.5">
                      {results.strengths.map((str, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-white font-mono font-bold">-</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2">ATS Optimization Areas</h5>
                    <ul className="space-y-1.5 text-zinc-400 text-xs pl-0.5">
                      {results.weaknesses_improvements.map((weak, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-zinc-300 font-mono font-bold">*</span>
                          <span className="text-zinc-300">{weak}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-28 text-zinc-500 text-xs uppercase tracking-wider font-mono">
                Upload resume and input description to start check.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
