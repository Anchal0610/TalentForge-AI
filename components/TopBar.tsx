'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, LogOut } from 'lucide-react';
import { useCareer } from '@/components/CareerContext';

export default function TopBar() {
  const pathname = usePathname();
  const { email, user, logout } = useCareer();
  
  const name = user?.name || 'Jane Doe';

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
        {/* Logged in email badge */}
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800/80 px-3 py-1.5 rounded-lg text-xs text-muted-foreground select-none font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{email}</span>
        </div>

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

        {/* Logout Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="border-zinc-800 hover:bg-red-950/20 hover:text-red-400 hover:border-red-950/30 text-xs h-9 px-3 rounded-lg flex items-center gap-2 transition-all cursor-pointer font-bold uppercase tracking-wider"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
