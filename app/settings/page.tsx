'use client';

import { useEffect, useState } from 'react';
import { getSettings, saveSettings } from '../../lib/store';
import { useLang } from '../../components/LangProvider';

export default function SettingsPage() {
  const { t } = useLang();
  const [offDays, setOffDays] = useState<number[]>([5]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings().then((s) => setOffDays(s.weeklyOffDays));
  }, []);

  function toggleDay(day: number) {
    setOffDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
    setSaved(false);
  }

  async function handleSave() {
    await saveSettings({ weeklyOffDays: offDays });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const allOff = offDays.length === 7;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-blue-900">{t.settings_title}</h2>
        <p className="text-gray-500 mt-1">{t.settings_sub}</p>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-bold text-gray-700 mb-1 text-base">{t.weekly_off_label}</h3>
        <p className="text-sm text-gray-400 mb-5">{t.settings_note}</p>

        <div className="flex flex-wrap gap-3 mb-6">
          {t.days.map((dayName, idx) => (
            <button
              key={idx}
              onClick={() => toggleDay(idx)}
              className={`px-5 py-2.5 rounded-xl font-medium border-2 transition-all text-sm ${
                offDays.includes(idx)
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-700'
              }`}
            >
              {dayName}
            </button>
          ))}
        </div>

        {allOff && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg mb-4">
            ⚠️ لا يمكن تحديد جميع الأيام كعطلة — يجب أن يبقى يوم عمل واحد على الأقل.
          </div>
        )}

        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={allOff}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {saved ? `✅ ${t.settings_saved}` : t.save_settings}
          </button>

          {offDays.length > 0 && (
            <p className="text-sm text-gray-500">
              {offDays.map((d) => t.days[d]).join('، ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
