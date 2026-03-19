import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Code2, Sparkles, Shield } from 'lucide-react';
import { api, User } from '../api';

interface SettingsProps {
  user: User;
  token: string;
  onUpdate: (nickname: string) => void;
}

const credits = [
  {
    role: 'Developed by',
    icon: <Code2 size={15} className="text-indigo-400" />,
    items: [
      { name: '2026 QPI', logo: null },
    ],
  },
  {
    role: 'Enhanced by',
    icon: <Sparkles size={15} className="text-violet-400" />,
    items: [
      {
        name: 'Claude',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Claude_AI_logo.svg/512px-Claude_AI_logo.svg.png',
      },
      {
        name: 'Google Gemini',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Google_Gemini_logo.svg/512px-Google_Gemini_logo.svg.png',
      },
    ],
  },
  {
    role: 'Secured by',
    icon: <Shield size={15} className="text-orange-400" />,
    items: [
      {
        name: 'Cloudflare',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Cloudflare_Logo.png/320px-Cloudflare_Logo.png',
      },
    ],
  },
];

export function Settings({ user, token, onUpdate }: SettingsProps) {
  const [nickname, setNickname] = useState(user.nickname);
  const [saving, setSaving]     = useState(false);

  const handleSave = async () => {
    if (!nickname.trim()) return alert('닉네임을 입력해주세요.');
    setSaving(true);
    try {
      const newNickname = await api.setNickname(token, nickname);
      onUpdate(newNickname);
      alert('닉네임이 변경되었습니다.');
    } catch (err: any) {
      alert('변경 실패: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Profile ── */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <SettingsIcon size={20} className="text-gray-400" /> 설정
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">이메일</label>
            <input
              type="text" value={user.email} disabled
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 cursor-not-allowed text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">닉네임</label>
            <div className="flex gap-2">
              <input
                type="text" value={nickname}
                onChange={e => setNickname(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                placeholder="닉네임을 입력하세요"
              />
              <button
                onClick={handleSave}
                disabled={saving || nickname === user.nickname}
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors flex items-center gap-1.5 text-sm font-medium"
              >
                <Save size={16} /> 저장
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Credits ── */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl overflow-hidden shadow-xl">

        {/* decorative glow blobs */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-indigo-600 opacity-10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-violet-600 opacity-10 rounded-full blur-3xl pointer-events-none" />

        {/* subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative z-10 p-7">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-slate-400">Credits</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>

          {/* Credit rows */}
          <div className="space-y-5">
            {credits.map((section, si) => (
              <div key={si} className="flex items-start gap-4">
                {/* Role label */}
                <div className="flex items-center gap-1.5 w-28 flex-shrink-0 mt-0.5">
                  {section.icon}
                  <span className="text-xs text-slate-500 font-medium">{section.role}</span>
                </div>

                {/* Items */}
                <div className="flex flex-wrap gap-2">
                  {section.items.map((item, ii) => (
                    <div
                      key={ii}
                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/60 border border-slate-600/50 rounded-full backdrop-blur-sm"
                    >
                      {item.logo ? (
                        <img
                          src={item.logo}
                          alt={item.name}
                          className="h-4 w-auto object-contain"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-[9px] font-black text-white">Q</span>
                      )}
                      <span className="text-sm font-semibold text-slate-200">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-7 pt-5 border-t border-slate-700/60 flex items-center justify-between">
            <span className="text-xs text-slate-500">© 2026 QPI</span>
          </div>
        </div>
      </div>
    </div>
  );
}
