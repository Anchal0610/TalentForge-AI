import React from 'react';
import Sidebar from '@/components/Sidebar';
import '@/app/globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="en" className={cn("font-sans dark", geist.variable)}>
      <body className="antialiased bg-[#050811] text-slate-200">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 pl-[260px] p-10 max-w-[1200px] w-full">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
