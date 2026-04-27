'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Status = 'loading' | 'trial' | 'purchased' | 'expired';

export default function LicenseGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus]         = useState<Status>('loading');
  const [trialDaysLeft, setTrialDaysLeft] = useState(3);
  const [userId, setUserId]         = useState('');
  const [code, setCode]             = useState('');
  const [codeError, setCodeError]   = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [activated, setActivated]   = useState(false);

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const meta = user.user_metadata ?? {};

      if (meta.purchased === true) { setStatus('purchased'); return; }

      let trialStart = meta.trial_started_at as string | undefined;
      if (!trialStart) {
        trialStart = new Date().toISOString();
        await supabase.auth.updateUser({ data: { trial_started_at: trialStart } });
      }

      const days = (Date.now() - new Date(trialStart).getTime()) / 86400000;
      const left = Math.ceil(3 - days);

      if (left > 0) { setTrialDaysLeft(left); setStatus('trial'); }
      else setStatus('expired');
    }
    check();
  }, []);

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    setCodeLoading(true); setCodeError('');

    const res  = await fetch('/api/validate-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, code }),
    });
    const data = await res.json();

    if (data.valid) {
      await supabase.auth.updateUser({ data: { purchased: true } });
      setActivated(true);
      setTimeout(() => window.location.reload(), 1500);
    } else {
      setCodeError('الكود غير صحيح. تحقق منه وأعد المحاولة.');
    }
    setCodeLoading(false);
  }

  if (status === 'loading') return null;

  if (status === 'expired') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">

          {activated ? (
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-green-700">تم التفعيل بنجاح!</h2>
              <p className="text-gray-500 mt-2">جاري تحميل البرنامج...</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">🔒</div>
                <h1 className="text-xl font-bold text-gray-800">انتهت الفترة التجريبية</h1>
                <p className="text-gray-500 text-sm mt-1">أدخل كود التفعيل للاستمرار</p>
              </div>

              <form onSubmit={handleActivate} className="space-y-3 mb-6">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="XXXX-XXXX-XXXX"
                  required
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-center font-mono text-lg tracking-widest focus:outline-none focus:border-blue-500 uppercase"
                  dir="ltr"
                />
                {codeError && <p className="text-red-600 text-sm text-center">{codeError}</p>}
                <button
                  type="submit"
                  disabled={codeLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-60"
                >
                  {codeLoading ? '⏳ جاري التحقق...' : '✅ تفعيل البرنامج'}
                </button>
              </form>

              <div className="border-t pt-4 text-center space-y-2">
                <p className="text-sm text-gray-600 font-medium">ليس لديك كود؟ تواصل معنا للشراء:</p>
                <a href="https://wa.me/212718453620"
                  className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors">
                  💬 واتساب
                </a>
                <a href="mailto:hajibabdessamia@gmail.com"
                  className="flex items-center justify-center gap-2 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg font-semibold text-sm transition-colors">
                  ✉️ hajibabdessamia@gmail.com
                </a>
                <p className="text-xs text-gray-400 mt-3 font-mono">ID: {userId.slice(0, 8)}...</p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {status === 'trial' && (
        <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium" dir="rtl">
          🎁 الفترة التجريبية — يتبقى <strong>{trialDaysLeft} {trialDaysLeft === 1 ? 'يوم' : 'أيام'}</strong> — تواصل معنا: hajibabdessamia@gmail.com
        </div>
      )}
      {children}
    </>
  );
}
