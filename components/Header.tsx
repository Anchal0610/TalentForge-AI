'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function Header() {
  const pathname = usePathname();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('Jane Doe');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('userEmail') || '';
      setEmail(savedEmail);
      const savedName = localStorage.getItem('userName') || 'Jane Doe';
      setName(savedName);
      
      const handleStorageChange = () => {
        setEmail(localStorage.getItem('userEmail') || '');
        setName(localStorage.getItem('userName') || 'Jane Doe');
      };
      window.addEventListener('storage', handleStorageChange);
      
      const interval = setInterval(handleStorageChange, 1000);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(interval);
      };
    }
  }, []);

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/': return 'Dashboard Home';
      case '/resume': return 'Resume ATS Intelligence';
      case '/career': return 'AI Career Advisor';
      case '/skills': return 'Skill Gap Diagnostics';
      case '/document': return 'Document RAG Engine';
      case '/interview': return 'AI Interview Prep Suite';
      case '/graph': return 'Knowledge Graph Explorer';
      case '/embeddings': return '3D Vector Space';
      case '/roadmap': return 'Learning Syllabus Roadmap';
      case '/admin': return 'System Settings & Logs';
      default: return 'Nexora AI';
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    localStorage.setItem('userEmail', val);
    if (val) {
      const parsedName = val.split('@')[0];
      const capitalized = parsedName.charAt(0).toUpperCase() + parsedName.slice(1);
      setName(capitalized);
      localStorage.setItem('userName', capitalized);
    } else {
      setName('Jane Doe');
      localStorage.setItem('userName', 'Jane Doe');
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  };

  return (
    <header className="h-16 border-b border-zinc-850 bg-black flex items-center justify-between px-8 z-40 sticky top-0 w-full">
      <div>
        <h2 className="text-sm font-bold tracking-tight text-white uppercase">
          {getPageTitle(pathname || '')}
        </h2>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border border-zinc-800 flex items-center justify-center bg-zinc-900 rounded-full">
            <AvatarFallback className="text-xs text-white uppercase font-bold">
              {name.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-white leading-tight">{name}</div>
            <div className="text-[9px] text-zinc-500">Associate Profile</div>
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="email"
            placeholder="Sync Email..."
            value={email}
            onChange={handleEmailChange}
            className="text-[11px] px-2.5 py-1.5 bg-zinc-950 border border-zinc-850 rounded text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 w-36 transition-colors mb-0"
          />
        </div>
      </div>
    </header>
  );
}
