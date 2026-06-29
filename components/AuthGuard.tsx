'use client';

import React, { useState } from 'react';
import { useCareer } from '@/components/CareerContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Mail, User, ShieldAlert, Check } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, error, login } = useCareer();
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!emailInput) {
      setFormError('Email is required');
      return;
    }
    
    const success = await login(emailInput, isSignUp ? nameInput : undefined);
    if (!success) {
      setFormError(error || 'Failed to authenticate. Please check your inputs.');
    }
  };

  // Hydration check
  const [mounted, setMounted] = useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-white">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span className="text-xs text-muted-foreground uppercase tracking-widest font-mono">Initializing...</span>
        </div>
      </div>
    );
  }

  if (user) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen w-screen flex items-center justify-center bg-[#09090B] overflow-hidden p-4">
      {/* Dynamic glow circles */}
      <div className="absolute top-1/4 left-1/4 -translate-y-1/2 w-[30rem] h-[30rem] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-y-1/2 w-[30rem] h-[30rem] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <Card className="relative w-full max-w-[420px] bg-zinc-950/70 border border-zinc-800/80 rounded-2xl shadow-2xl backdrop-blur-xl p-3 overflow-hidden">
        {/* Glowing border top */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-cyan-400" />
        
        <CardHeader className="text-center pt-8 pb-4 space-y-2.5">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/20 mb-2 mx-auto select-none">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold uppercase tracking-wider text-white">
            Nexora AI
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
            Next-Gen Multi-Agent Career Intelligence & Advanced RAG Dashboard
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 px-4 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3.5">
              {isSignUp && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" /> Full Name
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 focus:border-blue-500 focus:ring-blue-500/20 text-white text-xs h-10 px-3 transition-all"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" /> Email Address
                </label>
                <Input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 focus:border-cyan-500 focus:ring-cyan-500/20 text-white text-xs h-10 px-3 transition-all"
                />
              </div>
            </div>

            {formError && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-red-400 text-xs font-semibold mt-2 animate-pulse">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold h-10 text-xs uppercase tracking-wider transition-all duration-300 rounded-lg shadow-md hover:shadow-blue-500/20 border-none cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <span>{isSignUp ? 'Create Profile & Login' : 'Enter Dashboard'}</span>
              )}
            </Button>
          </form>

          <div className="border-t border-zinc-900 pt-4 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setFormError('');
              }}
              className="text-[11px] font-semibold text-zinc-400 hover:text-white transition-colors underline cursor-pointer"
            >
              {isSignUp ? 'Already have a profile? Sign In' : 'New here? Create a profile'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
