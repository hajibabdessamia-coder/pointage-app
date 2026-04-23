'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { logout, getStoredPassword, setStoredPassword } from '../lib/auth';
import { useLang } from './LangProvider';
import { Lang } from '../lib/lang';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, t, setLang } = useLang();
  const [showPassModal, setShowPassModal] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);

  const links = [
    { href: '/', label: t.nav_dashboard, icon: '🏠' },
    { href: '/workers', label: t.nav_workers, icon: '👷' },
    { href: '/pointage', label: t.nav_attendance, icon: '📋' },
    { href: '/reports', label: t.nav_reports, icon: '📊' },
    { href: '/archive', label: t.nav_archive, icon: '🗃️' },
    { href: '/settings', label: t.nav_settings, icon: '⚙️' },
  ];

  const LANGS: { code: Lang; label: string }[] = [
    { code: 'ar', label: 'ع' },
    { code: 'fr', label: 'Fr' },
    { code: 'en', label: 'En' },
  ];

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPassError('');
    if (oldPass !== getStoredPassword()) { setPassError(t.wrong_pass); return; }
    if (newPass.length < 4) { setPassError('كلمة المرور قصيرة جداً (4 أحرف على الأقل)'); return; }
    if (newPass !== confirmPass) { setPassError('كلمتا المرور غير متطابقتين'); return; }
    setStoredPassword(newPass);
    setPassSuccess(true);
    setTimeout(() => { setShowPassModal(false); setOldPass(''); setNewPass(''); setConfirmPass(''); setPassSuccess(false); }, 1500);
  }

  return (
    <>
      <nav className="bg-blue-900 text-white w-64 min-h-screen flex flex-col p-4 shrink-0">
        <div className="mb-6 text-center">
          <div className="text-4xl mb-2">📋</div>
          <h1 className="text-lg font-bold text-yellow-300">{t.nav_dashboard}</h1>
        </div>

        {/* Language switcher */}
        <div className="flex justify-center gap-1 mb-5">
          {LANGS.map(({ code, label }) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              className={`px-3 py-1 rounded-lg text-sm font-bold transition-all ${
                lang === code ? 'bg-yellow-400 text-blue-900' : 'bg-blue-800 text-blue-200 hover:bg-blue-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <ul className="flex flex-col gap-1 flex-1">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  pathname === link.href ? 'bg-blue-700 text-white font-semibold' : 'hover:bg-blue-800 text-blue-100'
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="border-t border-blue-700 pt-4 mt-4 flex flex-col gap-1">
          <button onClick={() => setShowPassModal(true)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-blue-200 hover:bg-blue-800 transition-colors text-sm w-full text-right">
            <span>🔑</span><span>{t.nav_changePass}</span>
          </button>
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-300 hover:bg-red-900/40 transition-colors text-sm w-full text-right">
            <span>🚪</span><span>{t.nav_logout}</span>
          </button>
        </div>
      </nav>

      {showPassModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-xl font-bold text-blue-900 mb-5">{t.change_pass_title}</h3>
            {passSuccess ? (
              <div className="text-center py-4"><div className="text-4xl mb-2">✅</div><p className="text-green-700 font-semibold">{t.pass_changed}</p></div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.current_pass}</label>
                  <input type="password" required value={oldPass} onChange={(e) => setOldPass(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.new_pass}</label>
                  <input type="password" required value={newPass} onChange={(e) => setNewPass(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.confirm_pass}</label>
                  <input type="password" required value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" dir="ltr" />
                </div>
                {passError && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{passError}</p>}
                <div className="flex gap-3 pt-1">
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium">{t.save}</button>
                  <button type="button" onClick={() => { setShowPassModal(false); setPassError(''); setOldPass(''); setNewPass(''); setConfirmPass(''); }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 font-medium">{t.cancel}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
