'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">⚙️ System Administration & Diagnostics</h1>
        <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md mt-4">
          <CardContent className="pt-6">
            <h3 className="text-base font-semibold text-slate-200 mb-1.5">Engine Integrity Control Center</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Run live checks on vector storage indexes, relational schema tables, and API connectivity modules. Monitor active service models and review system log parameters.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Diagnostics Trigger */}
        <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white text-lg font-bold">Platform Connections Health Check</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Button
              onClick={runDiagnostics}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold h-10 transition-all duration-200"
            >
              {loading ? '🔮 Executing Diagnostics...' : '⚙️ Execute Diagnostic Suite Check'}
            </Button>

            {error && (
              <div className="text-rose-400 text-sm font-medium flex items-center gap-1.5">
                <span>⚠️</span> {error}
              </div>
            )}

            {results && (
              <div className="space-y-4 pt-2 text-sm leading-relaxed">
                {/* DB Status */}
                <div className="p-3 bg-slate-950/40 border border-white/5 rounded-lg">
                  {results.db.dbHealthy ? (
                    <div className="text-emerald-400 font-semibold flex items-center gap-2">
                      <span>✅</span> DB Connection Healthy ({results.db.databaseType})
                    </div>
                  ) : (
                    <div className="text-rose-400 font-semibold flex items-center gap-2">
                      <span>❌</span> DB Connection Error
                    </div>
                  )}
                </div>

                {/* Pinecone Status */}
                <div className="p-3 bg-slate-950/40 border border-white/5 rounded-lg">
                  {results.pinecone.enabled ? (
                    <div className="space-y-1">
                      <div className="text-emerald-400 font-semibold flex items-center gap-2">
                        <span>✅</span> Pinecone Vector Active
                      </div>
                      <div className="text-xs text-slate-400 pl-6 leading-relaxed">
                        Index: {results.pinecone.indexName} ({results.pinecone.status})<br />
                        Active Indexes: {results.pinecone.activeIndexes.join(', ') || 'None'}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-amber-400 font-semibold flex items-center gap-2">
                        <span>⚠️</span> Pinecone Vector Client in Fallback
                      </div>
                      <div className="text-xs text-slate-450 pl-6 leading-relaxed">
                        Status: {results.pinecone.status}<br />
                        Index: {results.pinecone.indexName}
                      </div>
                    </div>
                  )}
                </div>

                {/* Mistral Status */}
                <div className="p-3 bg-slate-950/40 border border-white/5 rounded-lg">
                  {results.mistral.configured ? (
                    <div className="space-y-1">
                      <div className="text-emerald-400 font-semibold flex items-center gap-2">
                        <span>✅</span> Mistral AI Client Validated
                      </div>
                      <div className="text-xs text-slate-400 pl-6">
                        Model Name: {results.mistral.modelName}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-amber-400 font-semibold flex items-center gap-2">
                        <span>⚠️</span> Mistral AI Client in Fallback
                      </div>
                      <div className="text-xs text-slate-455 pl-6 leading-relaxed">
                        Operating in mock fallback mode (Credentials not configured)
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Database Stats & System Logs */}
        <div className="space-y-6">
          <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white text-lg font-bold">Database Schema Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              {results ? (
                <div className="text-xs text-slate-400 space-y-2.5">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span>Total Registered Users:</span>
                    <code className="text-slate-100 font-semibold font-mono">{results.db.usersCount}</code>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span>Total Resumes Parsed:</span>
                    <code className="text-slate-100 font-semibold font-mono">{results.db.resumesCount}</code>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span>RAG Documents Ingested:</span>
                    <code className="text-slate-100 font-semibold font-mono">{results.db.documentsCount}</code>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span>Mock Interview Submissions:</span>
                    <code className="text-slate-100 font-semibold font-mono">{results.db.mockInterviewsCount}</code>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-xs py-4">
                  Trigger diagnostics check to retrieve table log sizes.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white text-base font-semibold">Recent System Log Traces</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                readOnly
                value={logs.join('\n')}
                className="h-[180px] font-mono text-[10px] leading-normal text-slate-400 bg-slate-950/80 border border-white/10 p-3 rounded-lg w-full resize-none focus:outline-none focus:border-white/10 overflow-y-auto scrollbar-thin"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
