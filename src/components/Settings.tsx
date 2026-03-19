import React, { useState } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { api, User } from '../api';

interface SettingsProps {
  user: User;
  token: string;
  onUpdate: (nickname: string) => void;
}

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
      {/* ── Profile card ── */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <SettingsIcon className="mr-2 text-gray-500" size={20} /> 설정
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input
              type="text"
              value={user.email}
              disabled
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">닉네임</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                placeholder="닉네임을 입력하세요"
              />
              <button
                onClick={handleSave}
                disabled={saving || nickname === user.nickname}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center"
              >
                <Save size={18} className="mr-1" /> 저장
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Credits card ── */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-5">Credits</h3>

        <div className="space-y-4">
          {/* Developed by */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium w-28 flex-shrink-0">Developed by</span>
            <span className="text-sm font-semibold text-gray-700">2026 QPI</span>
          </div>

          <div className="h-px bg-gray-50" />

          {/* Enhanced by Claude */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium w-28 flex-shrink-0">Enhanced by</span>
            <div className="flex items-center gap-2">
              {/* Anthropic / Claude logo */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.827 3.785L20.02 17.25h-3.01l-1.225-2.865H9.21L7.986 17.25H4.976L11.169 3.785h2.658zm-1.33 3.874l-2.077 4.86h4.154l-2.077-4.86z" fill="#D97757"/>
              </svg>
              <span className="text-sm font-semibold text-gray-700">Claude</span>
            </div>
          </div>

          {/* Enhanced by Gemini */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium w-28 flex-shrink-0"></span>
            <div className="flex items-center gap-2">
              {/* Google Gemini logo */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C12 2 6.5 8.5 6.5 12S12 22 12 22s5.5-6.5 5.5-10S12 2 12 2z" fill="url(#gemini-grad)"/>
                <path d="M2 12c0 0 6.5-5.5 10-5.5S22 12 22 12s-6.5 5.5-10 5.5S2 12 2 12z" fill="url(#gemini-grad2)" opacity="0.85"/>
                <defs>
                  <linearGradient id="gemini-grad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#4285F4"/>
                    <stop offset="0.5" stopColor="#9B72CB"/>
                    <stop offset="1" stopColor="#EA4335"/>
                  </linearGradient>
                  <linearGradient id="gemini-grad2" x1="2" y1="12" x2="22" y2="12" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#4285F4" stopOpacity="0.6"/>
                    <stop offset="1" stopColor="#34A853" stopOpacity="0.6"/>
                  </linearGradient>
                </defs>
              </svg>
              <span className="text-sm font-semibold text-gray-700">Google Gemini</span>
            </div>
          </div>

          <div className="h-px bg-gray-50" />

          {/* Secured by Cloudflare */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium w-28 flex-shrink-0">Secured by</span>
            <div className="flex items-center gap-2">
              {/* Cloudflare logo */}
              <svg width="22" height="18" viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M51.7 20.6c-.3-1-1.1-1.7-2.1-1.9l-1.1-.2c.1-.4.1-.8.1-1.2 0-5.4-4.4-9.8-9.8-9.8-3.8 0-7.2 2.2-8.8 5.5-.7-.4-1.5-.6-2.4-.6-2.8 0-5 2.2-5 5 0 .3 0 .6.1.9C20 18.8 18 21 18 23.7c0 3 2.4 5.4 5.4 5.4H50c2.7 0 5-2.1 5.2-4.8.1-1.5-.5-2.9-1.6-3.7h-1.9z" fill="#F6821F"/>
                <path d="M53.7 22.8c-.2 0-.4 0-.6.1l.1-.5c0-2.2-1.8-4-4-4-.6 0-1.2.1-1.7.4-.5-3-3.1-5.3-6.2-5.3-3.5 0-6.3 2.8-6.3 6.3v.2c-.3-.1-.6-.1-.9-.1-1.8 0-3.3 1.5-3.3 3.3s1.5 3.3 3.3 3.3h19.6c1.6 0 2.9-1.3 2.9-2.9 0-1.6-1.3-2.8-2.9-2.8z" fill="#FBAD41"/>
              </svg>
              <span className="text-sm font-semibold text-gray-700">Cloudflare</span>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-300">© 2026 QPI. All rights reserved.</p>
      </div>
    </div>
  );
}
