'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  FileText,
  Compass,
  TrendingUp,
  Database,
  MessageSquare,
  Network,
  Binary,
  Map,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCareer } from '@/components/CareerContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { mobileMenuOpen, setMobileMenuOpen } = useCareer();
  
  // Initialize collapsed state from localStorage if available
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('sidebar-collapsed', String(nextState));
  };

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/document-hub', label: 'Document Hub', icon: Database },
    { href: '/career-intelligence', label: 'Career Intelligence', icon: Compass },
    { href: '/skill-intelligence', label: 'Skill Intelligence', icon: Network },
    { href: '/interview', label: 'Interview Prep', icon: MessageSquare },
    { href: '/roadmap', label: 'Roadmap', icon: Map },
    { href: '/admin', label: 'Admin', icon: Settings },
  ];

  // Prevent layout jump before component mounts on the client
  if (!mounted) {
    return (
      <aside className="h-screen w-60 bg-surface border-r border-border shrink-0" />
    );
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-45 md:hidden animate-fade-in"
        />
      )}

      <aside
        className={cn(
          "bg-surface border-r border-border flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0 select-none z-50",
          // Mobile drawer vs Desktop sticky column
          "fixed top-0 bottom-0 left-0 md:sticky md:h-screen",
          // Drawer transition on mobile, reset on desktop
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          // Mobile width is always 60, desktop collapses dynamically
          isCollapsed ? "w-60 md:w-16" : "w-60"
        )}
      >
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/* Header / Brand Logo */}
        <div className={cn(
          "flex items-center px-4 py-6 border-b border-border/30 min-h-[70px]",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          {!isCollapsed ? (
            <span className="font-bold tracking-widest text-sm text-white uppercase bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              NEXORA AI
            </span>
          ) : (
            <span className="font-extrabold text-sm text-accent">N</span>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4 px-2 space-y-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              const linkContent = (
                <Link
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 py-2.5 px-3 text-xs tracking-wide uppercase font-semibold transition-all duration-150 relative group outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    isActive
                      ? "text-accent bg-accent/10 border-l-2 border-accent rounded-r-lg rounded-l-none"
                      : "text-muted hover:text-white hover:bg-surface-2 border-l-2 border-transparent rounded-md"
                  )}
                >
                  <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-accent" : "text-muted group-hover:text-white")} />
                  {!isCollapsed && (
                    <span className="truncate">{link.label}</span>
                  )}
                </Link>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={link.href}>
                    <TooltipTrigger render={linkContent} />
                    <TooltipContent side="right" className="bg-surface-2 border border-border text-white text-xs uppercase font-semibold">
                      {link.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return <React.Fragment key={link.href}>{linkContent}</React.Fragment>;
            })}
        </nav>
      </div>

      {/* Footer / Version Badge and Collapse Trigger */}
      <div className={cn(
        "p-3 border-t border-border/30 flex flex-col gap-3 bg-surface",
        isCollapsed ? "items-center" : ""
      )}>
        {!isCollapsed && (
          <div className="flex items-center justify-between px-1">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-surface-2 text-muted border border-border/50 uppercase font-mono">
              v0.1.0-dev
            </span>
          </div>
        )}
        
        {/* Collapse Button */}
        <button
          onClick={toggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="w-full flex items-center justify-center py-2 px-3 rounded-md hover:bg-surface-2 border border-border/50 text-muted hover:text-white transition-colors duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <div className="flex items-center gap-2 text-xs font-semibold uppercase">
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </div>
          )}
        </button>
      </div>
    </aside>
    </>
  );
}
