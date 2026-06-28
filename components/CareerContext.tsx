'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface PipelineSessionData {
  email: string;
  name: string;
  target_role: string;
  skills_extracted: string[];
  education: string[];
  experience: string[];
  projects: string[];
  ats_score: number;
  strengths: string[];
  weaknesses_improvements: string[];
  overlap_percentage: number;
  file_url: string | null;
  career_recommendations: {
    role_name: string;
    description: string;
    growth_trend: string;
  }[];
  skills_present: string[];
  skills_missing: {
    skill_name: string;
    current_proficiency: string;
    required_proficiency: string;
    estimated_learning_hours: number;
  }[];
  roadmap: {
    week_number: number;
    topic: string;
    resource_link: string;
    milestone: string;
  }[];
  interview_questions: {
    technical: {
      question: string;
      category: string;
      beginner_answer: string;
      intermediate_answer: string;
      expert_answer: string;
    }[];
    behavioral: {
      question: string;
      category: string;
      beginner_answer: string;
      intermediate_answer: string;
      expert_answer: string;
    }[];
  };
  knowledge_graph: {
    nodes: { id: string; category: string }[];
    edges: { source: string; target: string; relationship: string; isGap?: boolean }[];
  };
  vector_embeddings: {
    label: string;
    category: string;
    coords: number[];
    embedding?: number[];
  }[];
  readiness_score: number;
  rag_ingested: {
    filename: string;
    chunksCount: number;
    file_url: string | null;
  } | null;
  created_at: string;
}

export interface User {
  id?: number;
  name: string;
  email: string;
  target_role?: string;
  readiness_score: number;
  created_at?: string;
}

interface CareerContextType {
  email: string;
  user: User | null;
  sessionData: PipelineSessionData | null;
  loading: boolean;
  error: string | null;
  setEmail: (email: string) => void;
  loadSession: (email: string) => Promise<boolean>;
  login: (email: string, name?: string) => Promise<boolean>;
  logout: () => void;
  uploadResume: (file: File, jobDescription: string, email: string) => Promise<boolean>;
  clearSession: () => void;
}

const CareerContext = createContext<CareerContextType | undefined>(undefined);

export function CareerProvider({ children }: { children: React.ReactNode }) {
  const [email, setEmailState] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [sessionData, setSessionData] = useState<PipelineSessionData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('nexora_user_email');
      const savedSession = localStorage.getItem('nexora_session_data');
      const savedUser = localStorage.getItem('nexora_user');
      
      if (savedEmail) {
        setEmailState(savedEmail);
      }
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.warn('Failed to parse cached user data:', e);
        }
      }
      if (savedSession) {
        try {
          setSessionData(JSON.parse(savedSession));
        } catch (e) {
          console.warn('Failed to parse cached session data:', e);
        }
      }
    }
  }, []);

  const setEmail = (newEmail: string) => {
    setEmailState(newEmail);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexora_user_email', newEmail);
    }
  };

  // Login handler
  const login = async (loginEmail: string, loginName?: string): Promise<boolean> => {
    if (!loginEmail) return false;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, name: loginName }),
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to login');
      }
      
      const data = await res.json();
      
      setUser(data.user);
      setEmail(loginEmail);
      
      if (data.session) {
        setSessionData(data.session);
        if (typeof window !== 'undefined') {
          localStorage.setItem('nexora_session_data', JSON.stringify(data.session));
          // Backward compatibility keys
          localStorage.setItem('userEmail', loginEmail);
          localStorage.setItem('atsScore', data.session.ats_score.toString());
          localStorage.setItem('overallReadiness', data.session.readiness_score.toString());
          localStorage.setItem('gapPercentage', (100 - (data.session.skills_present.length / (data.session.skills_present.length + data.session.skills_missing.length) * 100)).toString());
          localStorage.setItem('currentSkills', data.session.skills_present.join(', '));
          localStorage.setItem('missingSkills', JSON.stringify(data.session.skills_missing.map((s: any) => s.skill_name)));
          localStorage.setItem('userName', data.user.name);
          localStorage.setItem('targetRole', data.session.target_role || '');
        }
      } else {
        setSessionData(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('nexora_session_data');
          localStorage.setItem('userEmail', loginEmail);
          localStorage.setItem('userName', data.user.name);
          localStorage.removeItem('atsScore');
          localStorage.removeItem('overallReadiness');
          localStorage.removeItem('gapPercentage');
          localStorage.removeItem('currentSkills');
          localStorage.removeItem('missingSkills');
          localStorage.removeItem('targetRole');
        }
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('nexora_user', JSON.stringify(data.user));
        localStorage.setItem('nexora_user_email', loginEmail);
      }
      return true;
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = () => {
    setUser(null);
    clearSession();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nexora_user');
    }
  };

  // Check if session data exists on backend and load it
  const loadSession = async (searchEmail: string): Promise<boolean> => {
    if (!searchEmail) return false;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pipeline/session?email=${encodeURIComponent(searchEmail.trim())}`);
      if (!res.ok) throw new Error('Failed to retrieve session from database.');
      const data = await res.json();
      
      if (data.exists && data.session) {
        setSessionData(data.session);
        setEmail(searchEmail);
        
        const parsedName = data.session.name || searchEmail.split('@')[0];
        const loadedUser: User = {
          name: parsedName,
          email: searchEmail,
          target_role: data.session.target_role,
          readiness_score: data.session.readiness_score || 0.0
        };
        setUser(loadedUser);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('nexora_user', JSON.stringify(loadedUser));
          localStorage.setItem('nexora_session_data', JSON.stringify(data.session));
          // Backward compatibility for pre-existing keys
          localStorage.setItem('userEmail', searchEmail);
          localStorage.setItem('atsScore', data.session.ats_score.toString());
          localStorage.setItem('overallReadiness', data.session.readiness_score.toString());
          localStorage.setItem('gapPercentage', (100 - (data.session.skills_present.length / (data.session.skills_present.length + data.session.skills_missing.length) * 100)).toString());
          localStorage.setItem('currentSkills', data.session.skills_present.join(', '));
          localStorage.setItem('missingSkills', JSON.stringify(data.session.skills_missing.map((s: any) => s.skill_name)));
          localStorage.setItem('userName', data.session.name);
          localStorage.setItem('targetRole', data.session.target_role);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Run the unified resume diagnostics pipeline
  const uploadResume = async (file: File, jobDescription: string, uploadEmail: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('jobDescription', jobDescription);
      formData.append('email', uploadEmail);

      const res = await fetch('/api/pipeline', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Server error occurred during parsing.');
      }

      const data: PipelineSessionData = await res.json();
      setSessionData(data);
      setEmail(uploadEmail);
      
      const loadedUser: User = {
        name: data.name,
        email: uploadEmail,
        target_role: data.target_role,
        readiness_score: data.readiness_score || 0.0
      };
      setUser(loadedUser);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('nexora_user', JSON.stringify(loadedUser));
        localStorage.setItem('nexora_session_data', JSON.stringify(data));
        // Backward compatibility keys
        localStorage.setItem('userEmail', uploadEmail);
        localStorage.setItem('atsScore', data.ats_score.toString());
        localStorage.setItem('overallReadiness', data.readiness_score.toString());
        localStorage.setItem('gapPercentage', (100 - (data.skills_present.length / (data.skills_present.length + data.skills_missing.length) * 100)).toString());
        localStorage.setItem('currentSkills', data.skills_present.join(', '));
        localStorage.setItem('missingSkills', JSON.stringify(data.skills_missing.map((s: any) => s.skill_name)));
        localStorage.setItem('userName', data.name);
        localStorage.setItem('targetRole', data.target_role);
      }
      return true;
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearSession = () => {
    setEmailState('');
    setSessionData(null);
    setError(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nexora_user_email');
      localStorage.removeItem('nexora_session_data');
      localStorage.removeItem('nexora_user');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('atsScore');
      localStorage.removeItem('overallReadiness');
      localStorage.removeItem('gapPercentage');
      localStorage.removeItem('currentSkills');
      localStorage.removeItem('missingSkills');
      localStorage.removeItem('userName');
      localStorage.removeItem('targetRole');
    }
  };

  return (
    <CareerContext.Provider
      value={{
        email,
        user,
        sessionData,
        loading,
        error,
        setEmail,
        loadSession,
        login,
        logout,
        uploadResume,
        clearSession,
      }}
    >
      {children}
    </CareerContext.Provider>
  );
}

export function useCareer() {
  const context = useContext(CareerContext);
  if (context === undefined) {
    throw new Error('useCareer must be used within a CareerProvider');
  }
  return context;
}
