'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../lib/supabase';
import LicenseGuard from './LicenseGuard';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace('/login');
    }, 8000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout);
      if (!session) {
        router.replace('/login');
      } else {
        setReady(true);
      }
    }).catch(() => {
      clearTimeout(timeout);
      router.replace('/login');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.replace('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-gray-400 text-lg">جاري التحميل...</div>
      </div>
    );
  }

  return <LicenseGuard>{children}</LicenseGuard>;
}
