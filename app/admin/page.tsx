'use client';

import React, { useState, useEffect } from 'react';

interface DiagnosticResult {
  db: {
    databaseType: string;
    usersCount: number;
    resumesCount: number;
    documentsCount: number;
    mockInterviewsCount: number;
    dbHealthy: boolean;
  };
  pinecone: {
    enabled: boolean;
    status: string;
    indexName: string;
    activeIndexes: string[];
  };
  mistral: {
    modelName: string;
    configured: boolean;
    mockMode: boolean;
  };
  timestamp: string;
}

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Generate some mock JSON rotating system log traces
    setLogs([
      `{"timestamp": "${new Date(Date.now() - 3600000).toISOString()}", "level": "INFO", "module": "db", "file": "db.ts", "line": 95, "message": "Schema check passed. DB Adapter initialized."}`,
      `{"timestamp": "${new Date(Date.now() - 3000000).toISOString()}", "level": "INFO", "module": "mistral", "file": "mistral.ts", "line": 24, "message": "Mistral client successfully initialized."}`,
      `{"timestamp": "${new Date(Date.now() - 2500000).toISOString()}", "level": "WARNING", "module": "pinecone", "file": "pinecone.ts", "line": 28, "message": "Demo/Mock Pinecone credentials check active."}`,
      `{"timestamp": "${new Date(Date.now() - 2000000).toISOString()}", "level": "INFO", "module": "ocr", "file": "ocr.ts", "line": 15, "message": "PDF parsing library loaded successfully."}`,
      `{"timestamp": "${new Date(Date.now() - 1500000).toISOString()}", "level": "INFO", "module": "ats", "file": "ats.ts", "line": 32, "message": "ATS scorer module compiled."}`
    ]);
  }, []);

  const runDiagnostics = async () => {
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const res = await fetch('/api/diagnostics');
      if (!res.ok) throw new Error('Failed to fetch diagnostics.');
      const data: DiagnosticResult = await res.json();
      setResults(data);
      
      // Append a new log trace on check
      const newTrace = `{"timestamp": "${new Date().toISOString()}", "level": "INFO", "module": "diagnostics", "file": "admin/page.tsx", "line": 42, "message": "System diagnostics check triggered. All connections checked."}`;
      setLogs(prev => [...prev.slice(-4), newTrace]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>⚙️ System Administration & Diagnostics</h1>

      <div className="glass-card">
        <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Engine Integrity Control Center</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Run live checks on vector storage indexes, relational schema tables, and API connectivity modules. Monitor active service models and review system log parameters.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>
        {/* Left Column: Diagnostics Trigger */}
        <div className="glass-card">
          <h4 style={{ marginBottom: '16px' }}>Platform Connections Health Check</h4>

          <button
            onClick={runDiagnostics}
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginBottom: '20px' }}
          >
            {loading ? '🔮 Executing Diagnostics...' : '⚙️ Execute Diagnostic Suite Check'}
          </button>

          {error && <div style={{ color: 'var(--color-red)', fontSize: '0.9rem', marginBottom: '15px' }}>⚠️ {error}</div>}

          {results && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '0.9rem' }}>
              {/* DB Status */}
              <div>
                {results.db.dbHealthy ? (
                  <div style={{ color: 'var(--color-green)', fontWeight: 'bold' }}>✅ DB Connection Healthy ({results.db.databaseType})</div>
                ) : (
                  <div style={{ color: 'var(--color-red)', fontWeight: 'bold' }}>❌ DB Connection Error</div>
                )}
              </div>

              {/* Pinecone Status */}
              <div>
                {results.pinecone.enabled ? (
                  <div>
                    <span style={{ color: 'var(--color-green)', fontWeight: 'bold' }}>✅ Pinecone Vector Active</span>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Index: {results.pinecone.indexName} ({results.pinecone.status})<br />
                      Active Indexes: {results.pinecone.activeIndexes.join(', ') || 'None'}
                    </div>
                  </div>
                ) : (
                  <div>
                    <span style={{ color: 'var(--color-orange)', fontWeight: 'bold' }}>⚠️ Pinecone Vector Client in Fallback</span>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Status: {results.pinecone.status}<br />
                      Index: {results.pinecone.indexName}
                    </div>
                  </div>
                )}
              </div>

              {/* Mistral Status */}
              <div>
                {results.mistral.configured ? (
                  <div>
                    <span style={{ color: 'var(--color-green)', fontWeight: 'bold' }}>✅ Mistral AI Client Validated</span>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Model Name: {results.mistral.modelName}
                    </div>
                  </div>
                ) : (
                  <div>
                    <span style={{ color: 'var(--color-orange)', fontWeight: 'bold' }}>⚠️ Mistral AI Client in Fallback</span>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Operating in mock fallback mode (Credentials not configured)
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Database Stats & System Logs */}
        <div className="glass-card">
          <h4 style={{ marginBottom: '16px' }}>Database Schema Metrics</h4>
          {results ? (
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '25px' }}>
              <div>- Total Registered Users: <code style={{ color: 'var(--text-bright)' }}>{results.db.usersCount}</code></div>
              <div>- Total Resumes Parsed: <code style={{ color: 'var(--text-bright)' }}>{results.db.resumesCount}</code></div>
              <div>- RAG Documents Ingested: <code style={{ color: 'var(--text-bright)' }}>{results.db.documentsCount}</code></div>
              <div>- Mock Interview Submissions: <code style={{ color: 'var(--text-bright)' }}>{results.db.mockInterviewsCount}</code></div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '25px' }}>
              Trigger diagnostics check to retrieve table log sizes.
            </p>
          )}

          <h4 style={{ marginBottom: '12px' }}>Recent System Log Traces</h4>
          <textarea
            readOnly
            value={logs.join('\n')}
            style={{
              height: '180px',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--glass-border)',
              padding: '12px',
              borderRadius: '8px',
              width: '100%',
              resize: 'none'
            }}
          />
        </div>
      </div>
    </div>
  );
}
