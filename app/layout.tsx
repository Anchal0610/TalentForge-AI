import React from 'react';
import Sidebar from '@/components/Sidebar';
import '@/app/globals.css';

export const metadata = {
  title: 'Nexora AI – Career Intelligence Dashboard',
  description: 'Next-Gen AI Career dashboard built with Next.js, Mistral, and Pinecone.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="layout-container">
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
