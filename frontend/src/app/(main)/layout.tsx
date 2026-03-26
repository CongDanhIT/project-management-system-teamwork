import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { AiChatButton } from '@/components/ai/AiChatButton';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <Sidebar />
      <div className="pl-64 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-8 overflow-hidden">
          {children}
        </main>
      </div>
      {/* AI Chat Floating Button - hiển thị trên tất cả các trang */}
      <AiChatButton />
    </div>
  );
}
