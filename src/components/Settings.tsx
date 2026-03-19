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

          <div className="h-px bg-gray-100" />

          {/* Enhanced by — Claude */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium w-28 flex-shrink-0">Enhanced with</span>
            <div className="flex items-center gap-2">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Claude_AI_logo.svg/512px-Claude_AI_logo.svg.png"
                alt="Claude"
                className="h-4 w-4 object-contain"
              />
              <span className="text-sm font-semibold text-gray-700">Claude</span>
            </div>
          </div>

          {/* Enhanced by — Gemini */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium w-28 flex-shrink-0" />
            <div className="flex items-center gap-2">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Google_Gemini_icon_2025.svg"
                alt="Google Gemini"
                className="h-4 w-4 object-contain"
              />
              <span className="text-sm font-semibold text-gray-700">Google Gemini</span>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Secured by — Cloudflare */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium w-28 flex-shrink-0">Secured by</span>
            <div className="flex items-center gap-2">
              <img
                src="https://www.svgrepo.com/show/353564/cloudflare.svg"
                alt="Cloudflare"
                className="h-4 w-auto object-contain"
              />
              <span className="text-sm font-semibold text-gray-700">Cloudflare</span>
            </div>
          </div>

        </div>

        <p className="mt-6 text-center text-xs text-gray-300">© 2026 QPI. All rights reserved.</p>
      </div>
    </div>
  );
}
