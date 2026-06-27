import React from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import '@/app/globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CareerProvider } from "@/components/CareerContext";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

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
      <body className="antialiased bg-background text-white">
        <CareerProvider>
          <TooltipProvider>
            <div className="flex h-screen bg-background text-white overflow-hidden">
              {/* Collapsible Sidebar */}
              <Sidebar />
              
              {/* Main Content Area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Sticky Header TopBar */}
                <TopBar />
                
                {/* Scrollable Dynamic Page Content */}
                <main className="flex-1 overflow-y-auto p-6 space-y-6">
                  {children}
                </main>
              </div>
            </div>
          </TooltipProvider>
        </CareerProvider>
      </body>
    </html>
  );
}
