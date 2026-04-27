'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Status = 'loading' | 'active' | 'expired' | 'missing';

export default function LicenseGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [daysLeft, setDaysLeft] = useState<number>(0);
  const [expiresAt, setExpiresAt] = useState<string>('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setStatus('missing'); return; }

      const exp = user.user_metadata?.license_expires as string | undefined;
      if (!exp) { setStatus('missing'); return; }

      const expDate = new Date(exp);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diff = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      setExpiresAt(expDate.toLocaleDateString('ar-MA'));
      setDaysLeft(diff);
      setStatus(diff > 0 ? 'active' : 'expired');
    });
  }, []);

  if (status === 'loading') return null;

  if (status === 'missing' || status === 'expired') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">{status === 'expired' ? '⏳' : '🔒'}</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {status === 'expired' ? 'انتهت صلاحية الترخيص' : 'البرنامج غير مفعّل'}
          </h1>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">
            {status === 'expired'
              ? `انتهت صلاحية ترخيصك بتاريخ ${expiresAt}. تواصل معنا لتجديد الاشتراك والاستمرار في استخدام البرنامج.`
              : 'هذا البرنامج يحتاج إلى ترخيص. تواصل معنا لتفعيل نسختك.'}
          </p>
          <div className="bg-blue-50 rounded-xl p-4 space-y-2 text-sm">
            <p className="font-semibold text-blue-900">للتواصل والتفعيل:</p>
            <p className="text-blue-700">📞 +212 6XX XXX XXX</p>
            <p className="text-blue-700">✉️ hajibabdessamia@gmail.com</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {daysLeft <= 30 && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-sm text-amber-800" dir="rtl">
          ⚠️ ينتهي ترخيصك خلال <strong>{daysLeft} يوم</strong> ({expiresAt}) — تواصل معنا للتجديد
        </div>
      )}
      {children}
    </>
  );
}
