'use client';

import React, { useState, useEffect } from 'react';
import { useCareer } from '@/components/CareerContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  Database, 
  Upload, 
  CheckCircle, 
  Search, 
  PlusCircle,
  HelpCircle,
  FileCheck,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function DocumentHubPage() {
  const { email: loggedInEmail, sessionData, loading, error, uploadResume, loadSession, clearSession, clearSessionData } = useCareer();
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [email, setEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'ats' | 'rag'>('ats');

  // Additional RAG Doc Upload
  const [extraFile, setExtraFile] = useState<File | null>(null);
  const [loadingExtra, setLoadingExtra] = useState(false);
  const [extraSuccess, setExtraSuccess] = useState('');
  const [extraError, setExtraError] = useState('');

  // RAG query state
  const [query, setQuery] = useState('');
  const [loadingQuery, setLoadingQuery] = useState(false);
  const [answer, setAnswer] = useState('');
  const [citation, setCitation] = useState('');
  const [queryError, setQueryError] = useState('');

  // Email login state
  const [emailInput, setEmailInput] = useState('');
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    if (sessionData?.email) {
      setEmail(sessionData.email);
    } else if (loggedInEmail) {
      setEmail(loggedInEmail);
    }
  }, [sessionData, loggedInEmail]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleExtraFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setExtraFile(e.target.files[0]);
    }
  };

  const handlePipelineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    if (!jobDescription) return;
    if (!email) return;

    await uploadResume(file, jobDescription, email);
  };

  const handleEmailLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    const found = await loadSession(emailInput);
    setSessionChecked(true);
    if (!found) {
      // Prompt user to upload resume since no session was found
      setEmail(emailInput);
    }
  };

  const handleExtraUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setExtraError('');
    setExtraSuccess('');
    if (!extraFile) return;

    setLoadingExtra(true);
    try {
      const formData = new FormData();
      formData.append('file', extraFile);

      const res = await fetch('/api/document/ingest', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to ingest additional document.');
      }

      const data = await res.json();
      setExtraSuccess(`Successfully ingested "${extraFile.name}"! Indexed ${data.chunksCount} chunks.`);
      setExtraFile(null);
    } catch (err) {
      setExtraError((err as Error).message);
    } finally {
      setLoadingExtra(false);
    }
  };

  const handleRAGSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setQueryError('');
    if (!query) return;

    setLoadingQuery(true);
    try {
      const res = await fetch('/api/document/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'RAG search query failed.');
      }

      const data = await res.json();
      setAnswer(data.answer);
      setCitation(data.context);
    } catch (err) {
      setQueryError((err as Error).message);
    } finally {
      setLoadingQuery(false);
    }
  };

  // Helper to get score text color
  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5';
    if (score >= 60) return 'text-amber-400 border-amber-500/30 bg-amber-500/5';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/5';
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/30 pb-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
            <Database className="text-accent w-6 h-6" /> Document Hub
          </h1>
          <p className="text-xs text-muted">Upload once to analyze resume ATS match and build your custom semantic RAG search space</p>
        </div>
        {sessionData && (
          <Button 
            variant="outline" 
            onClick={clearSessionData}
            className="text-xs border-border hover:bg-surface-2 text-white h-8 shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-accent" /> Upload New Resume
          </Button>
        )}
      </div>

      {/* 2. Login or Initial Upload View if no sessionData exists */}
      {!sessionData ? (
        <div className="max-w-2xl mx-auto">
          {/* Full Pipeline Ingestion Upload */}
          <Card className="bg-surface border-border p-6 shadow-xl">
            <CardHeader className="p-0 pb-3 border-b border-border/30 mb-5">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-white">Ingest New Resume & Target Job</CardTitle>
            </CardHeader>
            <form onSubmit={handlePipelineSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-wider text-muted uppercase">Upload Resume File</label>
                <div className="relative border border-dashed border-border rounded-lg p-6 bg-zinc-950/40 text-center hover:border-accent/40 transition-colors cursor-pointer">
                  <input
                    type="file"
                    required
                    accept=".pdf,.docx,.pptx,.txt"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-muted text-[11px] py-1">
                    <Upload className="w-5 h-5 mx-auto mb-2 text-muted" />
                    {file ? (
                      <span className="text-accent font-semibold">Selected: {file.name}</span>
                    ) : (
                      <span>Drag & drop or click to upload PDF, DOCX, or TXT</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-wider text-muted uppercase">User Email</label>
                <Input
                  type="email"
                  disabled
                  value={email}
                  className="bg-zinc-950 border-border text-muted-foreground text-xs h-9 cursor-not-allowed select-none opacity-80"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-wider text-muted uppercase">Target Job Description</label>
                <Textarea
                  required
                  placeholder="Paste the job description of the target role here. The AI will extract requirements, calculate fit, identify gaps, and format a study roadmap..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="bg-zinc-950 border-border text-white text-xs min-h-[140px]"
                />
              </div>

              {error && (
                <div className="p-3 rounded bg-rose-500/5 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                  Error: {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !file || !jobDescription || !email}
                className="w-full bg-accent hover:bg-accent-glow text-white font-bold h-9 text-xs uppercase tracking-wider transition-colors rounded cursor-pointer"
              >
                {loading ? 'Running Unified Career Pipeline...' : 'Generate Career Intelligence Session'}
              </Button>
            </form>
          </Card>
        </div>
      ) : (
        /* 3. Session Active - Show Tabs */
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-surface border-border p-4 flex items-center gap-3">
              <div className="bg-accent/10 p-2.5 rounded-lg shrink-0">
                <FileText className="text-accent w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono tracking-tight text-white">{sessionData.ats_score}%</p>
                <p className="text-[10px] text-muted font-semibold uppercase tracking-wider">ATS Match Score</p>
              </div>
            </Card>

            <Card className="bg-surface border-border p-4 flex items-center gap-3">
              <div className="bg-accent/10 p-2.5 rounded-lg shrink-0">
                <CheckCircle className="text-accent w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono tracking-tight text-white">
                  {sessionData.skills_present.length} / {sessionData.skills_present.length + sessionData.skills_missing.length}
                </p>
                <p className="text-[10px] text-muted font-semibold uppercase tracking-wider">Skills Mapped</p>
              </div>
            </Card>

            <Card className="bg-surface border-border p-4 flex items-center gap-3">
              <div className="bg-accent/10 p-2.5 rounded-lg shrink-0">
                <FileCheck className="text-accent w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold truncate tracking-tight text-white" style={{ maxWidth: '170px' }}>
                  {sessionData.target_role}
                </p>
                <p className="text-[10px] text-muted font-semibold uppercase tracking-wider">Top Recommended Role</p>
              </div>
            </Card>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-border/30 gap-4">
            <button
              onClick={() => setActiveTab('ats')}
              className={cn(
                "pb-3 text-xs tracking-wider uppercase font-bold border-b-2 px-1 transition-all cursor-pointer",
                activeTab === 'ats' 
                  ? "text-accent border-accent font-extrabold" 
                  : "text-muted border-transparent hover:text-white"
              )}
            >
              Resume ATS Analyzer
            </button>
            <button
              onClick={() => setActiveTab('rag')}
              className={cn(
                "pb-3 text-xs tracking-wider uppercase font-bold border-b-2 px-1 transition-all cursor-pointer",
                activeTab === 'rag' 
                  ? "text-accent border-accent font-extrabold" 
                  : "text-muted border-transparent hover:text-white"
              )}
            >
              Semantic RAG Assistant
            </button>
          </div>

          {/* Tab Contents */}
          {activeTab === 'ats' ? (
            /* ATS Tab */
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
              {/* Left Score Card */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-surface border-border p-5 text-center">
                  <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Resume Score</div>
                  <div className={cn(
                    "w-28 h-28 rounded-full border-4 mx-auto flex flex-col justify-center items-center font-mono text-3xl font-extrabold",
                    getScoreColorClass(sessionData.ats_score)
                  )}>
                    {sessionData.ats_score}%
                  </div>
                  
                  {sessionData.file_url && (
                    <div className="mt-4 p-2.5 rounded bg-zinc-950 border border-border text-[11px] text-zinc-300">
                      Cloud Backup File:{" "}
                      <a href={sessionData.file_url} target="_blank" rel="noreferrer" className="underline font-bold text-accent hover:text-accent-glow">
                        File Link URL
                      </a>
                    </div>
                  )}

                  <div className="mt-4 p-3 bg-zinc-950 border border-border rounded text-left space-y-1.5 text-xs text-muted">
                    <div className="flex justify-between">
                      <span>Candidate:</span>
                      <strong className="text-white">{sessionData.name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Email Logged:</span>
                      <strong className="text-white">{sessionData.email}</strong>
                    </div>
                    {sessionData.rag_ingested && (
                      <div className="flex justify-between">
                        <span>RAG Ingest Status:</span>
                        <strong className="text-emerald-400 font-mono">ACTIVE ({sessionData.rag_ingested.chunksCount} chunks)</strong>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="bg-surface border-border p-5 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">Candidate Details</h3>
                  <div className="space-y-3.5 text-xs">
                    <div>
                      <h4 className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Education</h4>
                      <ul className="list-disc list-inside text-zinc-300 space-y-1">
                        {sessionData.education.map((edu, idx) => <li key={idx}>{edu}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Experience</h4>
                      <ul className="list-disc list-inside text-zinc-300 space-y-1">
                        {sessionData.experience.map((exp, idx) => <li key={idx}>{exp}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Projects</h4>
                      <ul className="list-disc list-inside text-zinc-300 space-y-1">
                        {sessionData.projects.map((proj, idx) => <li key={idx}>{proj}</li>)}
                      </ul>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right ATS Details Card */}
              <Card className="bg-surface border-border lg:col-span-3 p-5 space-y-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-2">Resume Fit & Keywords match</h3>
                  <div className="p-3 bg-zinc-950 border border-border rounded text-xs text-muted">
                    Keyword match overlap: <strong className="text-white font-mono">{sessionData.overlap_percentage}%</strong> of target job description phrases are represented in resume text.
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Profile Strengths</h4>
                    <ul className="space-y-2 text-xs text-zinc-300">
                      {sessionData.strengths.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-400 font-extrabold">+</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border-t border-border/30 pt-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">ATS Improvement Areas</h4>
                    <ul className="space-y-2 text-xs text-zinc-300">
                      {sessionData.weaknesses_improvements.map((weak, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-rose-400 font-extrabold">-</span>
                          <span>{weak}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            /* Document RAG Tab */
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
              
              {/* Ingest Extra Documents */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-surface border-border p-5">
                  <CardHeader className="p-0 pb-3 border-b border-border/30 mb-4">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-white">Add Reference Documents</CardTitle>
                  </CardHeader>
                  <form onSubmit={handleExtraUpload} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold tracking-wider text-muted uppercase">Upload reference (PDF, DOCX, TXT)</label>
                      <div className="relative border border-dashed border-border rounded p-4 bg-zinc-950/40 text-center hover:border-accent/40 transition-colors cursor-pointer">
                        <input
                          type="file"
                          required
                          accept=".pdf,.docx,.pptx,.txt"
                          onChange={handleExtraFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="text-muted text-[10px] py-1">
                          <PlusCircle className="w-5 h-5 mx-auto mb-2 text-muted" />
                          {extraFile ? (
                            <span className="text-accent font-semibold">Selected: {extraFile.name}</span>
                          ) : (
                            <span>Upload extra context for search</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {extraSuccess && (
                      <div className="p-2.5 rounded bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                        {extraSuccess}
                      </div>
                    )}

                    {extraError && (
                      <div className="p-2.5 rounded bg-rose-500/5 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                        {extraError}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={loadingExtra || !extraFile}
                      className="w-full bg-white hover:bg-zinc-200 text-black font-bold h-8 text-xs uppercase tracking-wider transition-colors rounded cursor-pointer"
                    >
                      {loadingExtra ? 'Ingesting document...' : 'Ingest to Vector Store'}
                    </Button>
                  </form>
                </Card>

                <Card className="bg-surface border-border p-5 text-xs text-muted">
                  <h4 className="font-bold text-white uppercase mb-2">Search Space Ingested Nodes</h4>
                  <ul className="space-y-1.5 list-disc list-inside">
                    <li>Resume: <strong className="text-white font-mono">{sessionData.rag_ingested?.filename || 'Uploaded Resume'}</strong></li>
                    {sessionData.rag_ingested && (
                      <li>Chunks count: <strong className="text-white font-mono">{sessionData.rag_ingested.chunksCount}</strong></li>
                    )}
                    <li>Status: <strong className="text-emerald-400 font-mono">Semantic Queries Ready</strong></li>
                  </ul>
                </Card>
              </div>

              {/* RAG Query Interface */}
              <Card className="bg-surface border-border lg:col-span-3 p-5 min-h-[400px] space-y-6">
                <CardHeader className="p-0 pb-3 border-b border-border/30">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-accent" /> Semantic Vector Search (RAG)
                  </CardTitle>
                </CardHeader>

                <form onSubmit={handleRAGSearch} className="flex gap-2">
                  <Input
                    type="text"
                    required
                    placeholder="Ask questions about candidate's resume or other ingested documents..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="bg-zinc-950 border-border text-white text-xs h-9 flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={loadingQuery}
                    className="bg-accent hover:bg-accent-glow text-white font-bold h-9 px-4 text-xs uppercase tracking-wider transition-colors rounded cursor-pointer"
                  >
                    {loadingQuery ? 'Searching...' : 'Ask'}
                  </Button>
                </form>

                {queryError && (
                  <div className="p-3 rounded bg-rose-500/5 border border-rose-500/20 text-rose-400 text-xs">
                    {queryError}
                  </div>
                )}

                {answer && (
                  <div className="space-y-4 pt-2 border-t border-border/30">
                    <div>
                      <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Answer Synthesis</h5>
                      <div className="p-4 bg-zinc-950 border border-border rounded text-zinc-300 text-xs leading-relaxed font-sans">
                        {answer}
                      </div>
                    </div>

                    {citation && (
                      <div>
                        <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Retrieved Vector Chunk Citation Context</h5>
                        <pre className="p-4 bg-zinc-950 border border-border rounded text-zinc-500 text-[10px] leading-normal font-mono whitespace-pre-wrap max-h-[160px] overflow-y-auto scrollbar-thin">
                          {citation}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {!answer && !loadingQuery && (
                  <div className="text-center py-20 text-xs text-muted flex flex-col items-center gap-2">
                    <HelpCircle className="w-8 h-8 text-muted/50" />
                    <span>Input queries to run similarity search across vector store spaces.</span>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
