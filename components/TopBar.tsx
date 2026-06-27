'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';

export default function TopBar() {
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

  const getBreadcrumbLabel = (path: string) => {
    switch (path) {
      case '/': return 'Home';
      case '/resume': return 'Resume ATS';
      case '/career': return 'Career Advisor';
      case '/skills': return 'Skill Gap';
      case '/document': return 'Document RAG';
      case '/interview': return 'Interview Prep';
      case '/graph': return 'Knowledge Graph';
      case '/embeddings': return 'Embeddings';
      case '/roadmap': return 'Roadmap';
      case '/admin': return 'Admin';
      default: return 'Dashboard';
    }
  };

  return (
    <header className="h-16 bg-background/80 backdrop-blur border-b border-border flex items-center justify-between px-6 z-40 sticky top-0 w-full shrink-0">
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-muted font-medium select-none">
        <span className="hover:text-white transition-colors cursor-pointer">Nexora AI</span>
        <ChevronRight className="w-3.5 h-3.5 text-muted/50" />
        <span className="text-white font-semibold">{getBreadcrumbLabel(pathname)}</span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* Sync Email Input */}
        <Input
          type="email"
          placeholder="Sync email..."
          value={email}
          onChange={handleEmailChange}
          className="w-64 bg-surface border-border text-xs text-white placeholder-muted focus-visible:ring-2 focus-visible:ring-accent h-9"
        />

        {/* User Profile + Avatar */}
        <div className="flex items-center gap-3 pl-2 border-l border-border/50">
          <div className="hidden sm:flex flex-col items-end text-right">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white leading-tight">{name}</span>
              <Badge className="bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 text-[9px] font-semibold px-1.5 py-0.5 rounded font-mono select-none">
                PRO
              </Badge>
            </div>
            <span className="text-[9px] text-muted font-medium uppercase tracking-wider mt-0.5">
              Associate Profile
            </span>
          </div>

          <Avatar className="h-9 w-9 border border-border bg-surface-2 flex items-center justify-center rounded-full select-none">
            <AvatarFallback className="text-xs text-white font-bold uppercase">
              {name.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
