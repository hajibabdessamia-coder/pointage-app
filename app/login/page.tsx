'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login, register, getSession } from '../../lib/auth';
import { useLang } from '../../components/LangProvider';
import { Lang } from '../../lib/lang';

export default function LoginPage() {
  const router = useRouter();
  const { t, lang, setLang } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getSession().then((s) => { if (s) router.replace('/'); });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (isRegister) {
      const { error: err } = await register(email, password);
      if (err) {
        setError(err);
      } else {
        setSuccess(lang === 'ar' ? 'تم إنشاء الحساب! يمكنك تسجيل الدخول الآن.' : lang === 'fr' ? 'Compte créé ! Connectez-vous.' : 'Account created! You can now login.');
        setIsRegister(false);
      }
    } else {
      const { error: err } = await login(email, password);
      if (err) {
        setError(err);
      } else {
        router.replace('/');
      }
    }
    setLoading(false);
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
          <p className="text-gray-500 text-sm mt-1">
            {isRegister
              ? (lang === 'ar' ? 'إنشاء حساب جديد' : lang === 'fr' ? 'Créer un compte' : 'Create an account')
              : t.login_sub}
          </p>
        </div>

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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {lang === 'ar' ? 'البريد الإلكتروني' : lang === 'fr' ? 'Email' : 'Email'}
            </label>
            <input type="email" required value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="example@email.com" dir="ltr" autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.pass_lbl}</label>
            <input type="password" required value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••" dir="ltr" />
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg text-center">{error}</div>}
          {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2 rounded-lg text-center">{success}</div>}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg disabled:opacity-60">
            {loading ? t.checking : isRegister
              ? (lang === 'ar' ? 'إنشاء الحساب' : lang === 'fr' ? 'Créer le compte' : 'Create Account')
              : t.login_btn}
          </button>
        </form>

        <button onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess(''); }}
          className="w-full text-center text-sm text-blue-600 hover:text-blue-800 mt-4">
          {isRegister
            ? (lang === 'ar' ? 'لديك حساب؟ سجّل الدخول' : lang === 'fr' ? 'Déjà un compte ? Se connecter' : 'Already have an account? Login')
            : (lang === 'ar' ? 'ليس لديك حساب؟ أنشئ واحداً' : lang === 'fr' ? "Pas de compte ? S'inscrire" : "Don't have an account? Register")}
        </button>
      </div>
    </div>
  );
}
