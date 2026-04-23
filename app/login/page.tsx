'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login, isLoggedIn } from '../../lib/auth';
import { useLang } from '../../components/LangProvider';
import { Lang } from '../../lib/lang';

export default function LoginPage() {
  const router = useRouter();
  const { t, lang, setLang } = useLang();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) router.replace('/');
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTimeout(() => {
      if (login(password)) { router.replace('/'); }
      else { setError(t.wrong_pass); setLoading(false); }
    }, 300);
  }

  const LANGS: { code: Lang; label: string }[] = [
    { code: 'ar', label: 'العربية' },
    { code: 'fr', label: 'Français' },
    { code: 'en', label: 'English' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">📋</div>
          <h1 className="text-2xl font-bold text-blue-900">{t.login_title}</h1>
          <p className="text-gray-500 text-sm mt-1">{t.login_sub}</p>
        </div>

        {/* Language switcher */}
        <div className="flex justify-center gap-2 mb-6">
          {LANGS.map(({ code, label }) => (
            <button key={code} onClick={() => setLang(code)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                lang === code ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}>
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.pass_lbl}</label>
            <input type="password" required value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••" dir="ltr" autoFocus />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg text-center">{error}</div>
          )}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg disabled:opacity-60">
            {loading ? t.checking : t.login_btn}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          {t.default_pass_hint} <span className="font-mono font-bold" dir="ltr">admin</span>
        </p>
      </div>
    </div>
  );
}
