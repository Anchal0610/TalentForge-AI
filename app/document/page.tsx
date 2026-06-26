'use client';

import React, { useState, useEffect } from 'react';

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
      // Call completions endpoint using custom backend prompt
      const prompt = `Please summarize the main concepts and technical learnings of this text in a bulleted outline:\n\n${rawText.slice(0, 5000)}`;
      const res = await fetch('/api/career', { // We can reuse the completions model endpoint or route
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: prompt, experience: 0, interests: 'summarize' })
      });

      if (!res.ok) throw new Error('Failed to generate summary.');
      const data = await res.json();
      // Parse or handle response text
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
    <div>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>📚 Document Intelligence & RAG Engine</h1>

      <div className="glass-card">
        <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Semantic Study Assistant</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Ingest technical guidelines, textbooks, and documentation notes. The documents are parsed, chunked, embedded, and cataloged inside a local vector database. You can instantly ask complex technical questions and extract summaries.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '30px', alignItems: 'start' }}>
        {/* Ingestion Column */}
        <div>
          <form onSubmit={handleIngest} className="glass-card">
            <h4 style={{ marginBottom: '16px' }}>Document Ingestion</h4>

            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              UPLOAD TEXTBOOK / TECHNICAL REFERENCE
            </label>
            <input
              type="file"
              accept=".pdf,.docx,.pptx,.txt"
              onChange={handleFileChange}
              style={{
                marginBottom: '20px',
                border: '1px solid var(--glass-border)',
                padding: '10px',
                background: 'rgba(15,23,42,0.4)',
                width: '100%',
                borderRadius: '8px',
                color: 'var(--text-main)'
              }}
            />

            {error && <div style={{ color: 'var(--color-red)', fontSize: '0.9rem', marginBottom: '16px' }}>⚠️ {error}</div>}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loadingIngest}
              style={{ width: '100%' }}
            >
              {loadingIngest ? '🔮 Indexing Vector Store...' : '📚 Ingest & Index Vector Store'}
            </button>
          </form>

          {ingestSuccess && (
            <div className="glass-card">
              <div className="neon-badge badge-green" style={{ marginBottom: '8px' }}>Ingested</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '15px' }}>{ingestSuccess}</p>
              
              {rawText && (
                <div>
                  <button
                    onClick={handleGenerateSummary}
                    className="btn btn-secondary"
                    disabled={loadingSummary}
                    style={{ width: '100%', fontSize: '0.85rem', padding: '8px 16px' }}
                  >
                    {loadingSummary ? 'Generating Outline...' : 'Generate Smart Outline'}
                  </button>

                  {summary && (
                    <div style={{
                      marginTop: '15px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      color: 'var(--text-muted)',
                      lineHeight: '1.6',
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}>
                      {summary}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Query Column */}
        <div className="glass-card" style={{ minHeight: '400px' }}>
          <h4 style={{ marginBottom: '16px' }}>Semantic Question Answering (RAG)</h4>

          <form onSubmit={handleQuery} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <input
                type="text"
                placeholder="Ask a question about the document..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ marginBottom: 0 }}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loadingQuery}
              style={{ padding: '12px 20px' }}
            >
              {loadingQuery ? 'Searching...' : '🔍 Search'}
            </button>
          </form>

          {answer && (
            <div style={{ marginTop: '25px' }}>
              <strong style={{ color: 'var(--text-bright)', fontSize: '0.95rem' }}>Synthesized Answer:</strong>
              <div style={{
                marginTop: '8px',
                background: 'rgba(139, 92, 246, 0.05)',
                border: '1px solid rgba(139, 92, 246, 0.15)',
                padding: '16px',
                borderRadius: '12px',
                fontSize: '0.9rem',
                color: 'var(--text-main)',
                lineHeight: '1.6'
              }}>
                {answer}
              </div>

              {citation && (
                <div style={{ marginTop: '20px' }}>
                  <strong style={{ color: 'var(--text-bright)', fontSize: '0.9rem' }}>Retrieved Citation Context:</strong>
                  <pre style={{
                    marginTop: '6px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--glass-border)',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                    maxHeight: '180px',
                    overflowY: 'auto'
                  }}>
                    {citation}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
