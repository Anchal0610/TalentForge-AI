'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function DocumentPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loadingIngest, setLoadingIngest] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState('');
  const [rawText, setRawText] = useState('');
  const [summary, setSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [query, setQuery] = useState('');
  const [loadingQuery, setLoadingQuery] = useState(false);
  const [answer, setAnswer] = useState('');
  const [citation, setCitation] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSuccess = localStorage.getItem('ingestSuccess') || '';
      setIngestSuccess(savedSuccess);
      const savedText = localStorage.getItem('rawText') || '';
      setRawText(savedText);
      const savedSummary = localStorage.getItem('documentSummary') || '';
      setSummary(savedSummary);
      const savedAnswer = localStorage.getItem('ragAnswer') || '';
      setAnswer(savedAnswer);
      const savedCitation = localStorage.getItem('ragCitation') || '';
      setCitation(savedCitation);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIngestSuccess('');
    setRawText('');
    setSummary('');
    setAnswer('');
    setCitation('');

    if (!file) {
      setError('Please upload a document file first.');
      return;
    }

    setLoadingIngest(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/document/ingest', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Server failed to ingest document.');
      }

      const data = await res.json();
      const msg = `Successfully indexed document! Stored ${data.chunksCount} vectors inside index.`;
      setIngestSuccess(msg);
      localStorage.setItem('ingestSuccess', msg);
      setRawText(data.rawText || '');
      localStorage.setItem('rawText', data.rawText || '');
      localStorage.setItem('activeDocName', data.filename || '');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingIngest(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!rawText) return;
    setLoadingSummary(true);
    setSummary('');

    try {
      const prompt = `Please summarize the main concepts and technical learnings of this text in a bulleted outline:\n\n${rawText.slice(0, 5000)}`;
      const res = await fetch('/api/career', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: prompt, experience: 0, interests: 'summarize' })
      });

      if (!res.ok) throw new Error('Failed to generate summary.');
      const data = await res.json();
      const summaryText = data.alignment_reasoning || 'Could not parse outline summary.';
      setSummary(summaryText);
      localStorage.setItem('documentSummary', summaryText);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!query) {
      setError('Please enter a query.');
      return;
    }

    setLoadingQuery(true);

    try {
      const res = await fetch('/api/document/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Query failed.');
      }

      const data = await res.json();
      setAnswer(data.answer);
      localStorage.setItem('ragAnswer', data.answer);
      setCitation(data.context);
      localStorage.setItem('ragCitation', data.context);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingQuery(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">📚 Document Intelligence & RAG Engine</h1>
        <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md mt-4">
          <CardContent className="pt-6">
            <h3 className="text-base font-semibold text-slate-200 mb-1.5">Semantic Study Assistant</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Ingest technical guidelines, textbooks, and documentation notes. The documents are parsed, chunked, embedded, and cataloged inside a local vector database. You can instantly ask complex technical questions and extract summaries.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Ingestion Column */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleIngest}>
            <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md hover:border-violet-500/20 transition-colors">
              <CardHeader>
                <CardTitle className="text-white text-lg font-bold">Document Ingestion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                    Upload Textbook / Technical Reference
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

                {error && (
                  <div className="text-rose-400 text-sm font-medium flex items-center gap-1.5">
                    <span>⚠️</span> {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loadingIngest}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold h-10 transition-all duration-200"
                >
                  {loadingIngest ? '🔮 Indexing Vector Store...' : '📚 Ingest & Index Vector Store'}
                </Button>
              </CardContent>
            </Card>
          </form>

          {ingestSuccess && (
            <Card className="border border-emerald-500/20 bg-emerald-950/10 backdrop-blur-md">
              <CardContent className="pt-6 space-y-4">
                <div className="inline-block px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full uppercase">
                  Ingested
                </div>
                <p className="text-slate-200 text-sm">{ingestSuccess}</p>
                
                {rawText && (
                  <div className="space-y-4 pt-2">
                    <Button
                      onClick={handleGenerateSummary}
                      disabled={loadingSummary}
                      variant="outline"
                      className="w-full text-slate-200 border-white/10 hover:bg-white/5 font-semibold text-xs"
                    >
                      {loadingSummary ? 'Generating Outline...' : 'Generate Smart Outline'}
                    </Button>

                    {summary && (
                      <div className="mt-3 p-3 bg-slate-950/40 border border-white/5 rounded-lg text-slate-400 text-xs leading-relaxed max-h-[220px] overflow-y-auto font-sans scrollbar-thin">
                        {summary}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Query Column */}
        <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md lg:col-span-3 min-h-[400px]">
          <CardHeader>
            <CardTitle className="text-white text-lg font-bold">Semantic Question Answering (RAG)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleQuery} className="flex gap-3 items-start">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Ask a question about the document..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="bg-slate-950/40 border-white/10 text-white focus-visible:border-violet-500/50 h-10"
                />
              </div>
              <Button
                type="submit"
                disabled={loadingQuery}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold h-10 px-5 transition-all duration-200 shrink-0"
              >
                {loadingQuery ? 'Searching...' : '🔍 Search'}
              </Button>
            </form>

            {answer && (
              <div className="space-y-5 pt-2">
                <div>
                  <h5 className="text-sm font-semibold text-slate-200 mb-2">Synthesized Answer:</h5>
                  <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl text-slate-200 text-sm leading-relaxed">
                    {answer}
                  </div>
                </div>

                {citation && (
                  <div>
                    <h5 className="text-sm font-semibold text-slate-200 mb-2">Retrieved Citation Context:</h5>
                    <pre className="p-4 bg-slate-950/60 border border-white/10 rounded-lg text-slate-400 text-[11px] leading-normal font-mono whitespace-pre-wrap max-h-[200px] overflow-y-auto scrollbar-thin">
                      {citation}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
