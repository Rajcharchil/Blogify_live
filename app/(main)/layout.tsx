'use client';

import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import '@/styles/landing.css';

const ThreeBackground = dynamic(() => import('@/components/ThreeBackground'), {
  ssr: false,
});

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen blogify-root font-sans">
      <ThreeBackground />
      <div className="blogify-overlay" />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
