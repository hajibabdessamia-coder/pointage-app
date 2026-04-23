'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import AuthGuard from './AuthGuard';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <AuthGuard>
      <div className="flex flex-row-reverse min-h-screen bg-gray-100">
        <Navbar />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </AuthGuard>
  );
}
