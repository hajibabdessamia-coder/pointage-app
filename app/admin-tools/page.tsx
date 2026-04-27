'use client';

import { useState } from 'react';

export default function AdminToolsPage() {
  const [password, setPassword] = useState('');
  const [userId, setUserId]     = useState('');
  const [code, setCode]         = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(''); setCode('');
    const res  = await fetch('/api/generate-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userId.trim(), adminPassword: password }),
    });
    const data = await res.json();
    if (data.code) setCode(data.code);
    else setError('كلمة المرور خاطئة أو معرف المستخدم فارغ');
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-blue-900 mb-1">🔑 توليد كود التفعيل</h1>
        <p className="text-gray-500 text-sm mb-6">للمسؤول فقط — أرسل الكود للزبون بعد الدفع</p>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">كلمة مرور المسؤول</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">معرف المستخدم (User ID)</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              dir="ltr"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold disabled:opacity-60"
          >
            {loading ? 'جاري التوليد...' : 'توليد الكود'}
          </button>
        </form>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        {code && (
          <div className="mt-5 bg-green-50 border border-green-300 rounded-xl p-5 text-center">
            <p className="text-sm text-green-700 mb-2 font-medium">✅ كود التفعيل للزبون:</p>
            <p className="text-3xl font-bold tracking-widest text-green-800 font-mono">{code}</p>
            <button
              onClick={() => navigator.clipboard.writeText(code)}
              className="mt-3 text-xs text-green-600 hover:text-green-800 underline"
            >
              نسخ الكود
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
