'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Status = 'loading' | 'trial' | 'purchased' | 'expired';
type UserInfo = { id: string; email: string };

export default function LicenseGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [trialDaysLeft, setTrialDaysLeft] = useState(3);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [buying, setBuying] = useState(false);

  async function handleBuy() {
    if (!userInfo) return;
    setBuying(true);
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userInfo.id, userEmail: userInfo.email }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else setBuying(false);
  }

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserInfo({ id: user.id, email: user.email ?? '' });

      const meta = user.user_metadata ?? {};

      // إذا اشترى → وصول دائم
      if (meta.purchased === true) {
        setStatus('purchased');
        return;
      }

      // إذا لم تبدأ التجربة بعد → ابدأها الآن
      let trialStart = meta.trial_started_at as string | undefined;
      if (!trialStart) {
        trialStart = new Date().toISOString();
        await supabase.auth.updateUser({ data: { trial_started_at: trialStart } });
      }

      const startDate = new Date(trialStart);
      const now = new Date();
      const daysPassed = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      const daysLeft = Math.ceil(3 - daysPassed);

      if (daysLeft > 0) {
        setTrialDaysLeft(daysLeft);
        setStatus('trial');
      } else {
        setStatus('expired');
      }
    }
    check();
  }, []);

  if (status === 'loading') return null;

  if (status === 'expired') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">انتهت الفترة التجريبية</h1>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">
            لقد استخدمت نسختك التجريبية المجانية لمدة 3 أيام.<br />
            اشترِ البرنامج مرة واحدة واستخدمه إلى الأبد.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
            <p className="text-3xl font-bold text-blue-900 mb-1">شراء مرة واحدة</p>
            <p className="text-blue-600 text-sm">بدون اشتراك شهري — دفعة واحدة فقط</p>
          </div>

          <button
            onClick={handleBuy}
            disabled={buying}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-4 rounded-xl font-bold text-lg transition-colors mb-3"
          >
            {buying ? '⏳ جاري التوجيه...' : '💳 اشترِ الآن'}
          </button>
          <p className="text-xs text-gray-400">دفع آمن عبر Stripe — بطاقة بنكية أو Visa أو Mastercard</p>
        </div>
      </div>
    );
  }

  // trial أو purchased
  return (
    <>
      {status === 'trial' && (
        <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium" dir="rtl">
          🎁 الفترة التجريبية المجانية — يتبقى لك <strong>{trialDaysLeft} {trialDaysLeft === 1 ? 'يوم' : 'أيام'}</strong> — تواصل معنا للشراء: hajibabdessamia@gmail.com
        </div>
      )}
      {children}
    </>
  );
}
