'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import '@/app/globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    <html lang="en">
      <head>
        <title>Nexora AI – Career Intelligence Dashboard</title>
        <meta name="description" content="Next-Gen AI Career dashboard built with Next.js, Mistral, and Pinecone." />
      </head>
      <body>
        <div className="layout-container">
          {/* Glassmorphic Sidebar */}
          <aside style={{
            width: 'var(--sidebar-width)',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            background: 'rgba(10, 15, 30, 0.75)',
            borderRight: '1px solid var(--glass-border)',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            padding: '30px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            zIndex: 100
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '30px' }}>
                <span style={{ fontSize: '1.5rem' }}>⚡</span>
                <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, letterSpacing: '0.05em' }}>NEXORA AI</h3>
              </div>
              
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        color: isActive ? 'var(--text-bright)' : 'var(--text-muted)',
                        background: isActive ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                        border: isActive ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid transparent',
                        fontWeight: isActive ? 600 : 500,
                        fontSize: '0.9rem',
                        transition: 'all 0.2s ease-in-out',
                        display: 'block'
                      }}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Profile config info */}
            <div style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: '20px',
              marginTop: '20px'
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>ACTIVE PROFILE</div>
              <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-bright)', marginBottom: '12px' }}>
                👤 {name}
              </div>
              <input
                type="email"
                placeholder="Associate Email"
                value={email}
                onChange={handleEmailChange}
                style={{
                  fontSize: '0.8rem',
                  padding: '8px 12px',
                  marginBottom: 0,
                  background: 'rgba(15, 23, 42, 0.8)'
                }}
              />
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'center' }}>
                Saves parsed metrics to DB
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
