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
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2 uppercase">Document Intelligence & RAG Engine</h1>
        <Card className="border border-zinc-850 bg-[#09090b]">
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold text-slate-200 mb-1.5 uppercase">Semantic Study Assistant</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Ingest technical guidelines, textbooks, and documentation notes. The documents are parsed, chunked, embedded, and cataloged inside a local vector database. You can instantly ask complex technical questions and extract summaries.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Ingestion Column */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleIngest}>
            <Card className="border border-zinc-850 bg-[#09090b] hover:border-zinc-750 transition-colors">
              <CardHeader className="border-b border-zinc-900 pb-3">
                <CardTitle className="text-white text-sm font-bold uppercase tracking-wider">Document Ingestion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                    Upload Textbook / Technical Reference
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

                {error && (
                  <div className="text-rose-400 text-xs font-semibold">
                    Error: {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loadingIngest}
                  className="w-full bg-white hover:bg-zinc-200 text-black font-bold h-9 text-xs uppercase tracking-wider transition-colors rounded"
                >
                  {loadingIngest ? 'Indexing Vector Store...' : 'Ingest Vector Store'}
                </Button>
              </CardContent>
            </Card>
          </form>

          {ingestSuccess && (
            <Card className="border border-zinc-850 bg-[#09090b]">
              <CardContent className="pt-6 space-y-4">
                <div className="inline-block px-2.5 py-0.5 text-[9px] font-bold tracking-wider text-zinc-300 bg-zinc-900 border border-zinc-850 rounded uppercase">
                  Ingested
                </div>
                <p className="text-zinc-200 text-xs">{ingestSuccess}</p>
                
                {rawText && (
                  <div className="space-y-4 pt-2 border-t border-zinc-900">
                    <Button
                      onClick={handleGenerateSummary}
                      disabled={loadingSummary}
                      variant="outline"
                      className="w-full text-slate-200 border-zinc-850 hover:bg-zinc-900 font-semibold text-xs py-1.5 rounded uppercase tracking-wider"
                    >
                      {loadingSummary ? 'Generating Outline...' : 'Generate Outline'}
                    </Button>

                    {summary && (
                      <div className="mt-3 p-3 bg-zinc-950 border border-zinc-850 rounded text-zinc-400 text-xs leading-relaxed max-h-[220px] overflow-y-auto font-mono scrollbar-thin">
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
        <Card className="border border-zinc-850 bg-[#09090b] lg:col-span-3 min-h-[400px]">
          <CardHeader className="border-b border-zinc-900 pb-3">
            <CardTitle className="text-white text-sm font-bold uppercase tracking-wider">Semantic Question Answering (RAG)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <form onSubmit={handleQuery} className="flex gap-3 items-start">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Ask a question about the document..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="bg-zinc-950 border-zinc-850 text-white focus-visible:border-zinc-500 h-9 text-xs"
                />
              </div>
              <Button
                type="submit"
                disabled={loadingQuery}
                className="bg-white hover:bg-zinc-200 text-black font-bold h-9 px-5 text-xs uppercase tracking-wider transition-colors rounded shrink-0"
              >
                {loadingQuery ? 'Searching...' : 'Search'}
              </Button>
            </form>

            {answer && (
              <div className="space-y-5 pt-2 border-t border-zinc-900">
                <div>
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Synthesized Answer</h5>
                  <div className="p-4 bg-zinc-950 border border-zinc-850 rounded text-zinc-300 text-xs leading-relaxed font-sans">
                    {answer}
                  </div>
                </div>

                {citation && (
                  <div>
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Retrieved Citation Context</h5>
                    <pre className="p-4 bg-zinc-950 border border-zinc-850 rounded text-zinc-500 text-[10px] leading-normal font-mono whitespace-pre-wrap max-h-[200px] overflow-y-auto scrollbar-thin">
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
