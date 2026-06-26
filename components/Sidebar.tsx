'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function Sidebar() {
  const pathname = usePathname();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('Jane Doe');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('userEmail') || '';
      setEmail(savedEmail);
      const savedName = localStorage.getItem('userName') || 'Jane Doe';
      setName(savedName);
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
  };

  const navLinks = [
    { href: '/', label: '🏠 Home' },
    { href: '/resume', label: '📄 Resume ATS' },
    { href: '/career', label: '🎯 Career Advisor' },
    { href: '/skills', label: '📊 Skill Gap' },
    { href: '/document', label: '📚 Document RAG' },
    { href: '/interview', label: '🎤 Interview Prep' },
    { href: '/graph', label: '🕸️ Knowledge Graph' },
    { href: '/embeddings', label: '🔮 Embeddings' },
    { href: '/roadmap', label: '🗺️ Roadmap' },
    { href: '/admin', label: '⚙️ Admin' },
  ];

  return (
    <aside className="w-[260px] h-screen fixed left-0 top-0 bg-[#0a0f1e]/75 border-r border-white/10 backdrop-blur-md p-6 flex flex-col justify-between z-50">
      <div>
        <div className="flex items-center gap-2 mb-8">
          <span className="text-2xl">⚡</span>
          <h3 className="font-bold tracking-wider text-lg text-white">NEXORA AI</h3>
        </div>
        
        <nav className="flex flex-col gap-1.5">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block px-4 py-2 rounded-lg text-sm transition-all duration-200",
                  isActive
                    ? "text-white bg-white/5 border border-white/10 font-semibold shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                    : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent font-medium"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-white/10 pt-5 mt-5">
        <div className="text-[10px] tracking-wider text-slate-400 mb-1.5 uppercase">ACTIVE PROFILE</div>
        <div className="font-bold text-sm text-white mb-3">
          👤 {name}
        </div>
        <input
          type="email"
          placeholder="Associate Email"
          value={email}
          onChange={handleEmailChange}
          className="text-xs px-3 py-2 bg-slate-900/80 border border-white/10 rounded-md text-white placeholder-slate-500 w-full focus:outline-none focus:border-violet-500 transition-colors"
        />
        <div className="text-[10px] text-slate-500 mt-2 text-center">
          Saves parsed metrics to DB
        </div>
      </div>
    </aside>
  );
}
