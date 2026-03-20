import React, { useState } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { api, User } from '../api';

interface SettingsProps {
  user: User;
  token: string;
  onUpdate: (nickname: string) => void;
}


// 스프레드시트 인젝션 방지 + 길이 제한
function sanitize(value: string, maxLen = 10): string {
  let v = value.replace(/[\r\n\t\x00-\x1F\x7F]/g, '');
  v = v.replace(/^[=+\-@/]+/, '');
  return [...v].slice(0, maxLen).join('');
}
export function Settings({ user, token, onUpdate, onWithdraw }: SettingsProps) {
  const [nickname, setNickname] = useState(user.nickname);
  const [saving, setSaving]       = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawEmail, setWithdrawEmail] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

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

  const handleWithdraw = async () => {
    if (!withdrawEmail.trim()) return alert('이메일을 입력해주세요.');
    if (withdrawEmail.trim().toLowerCase() !== user.email.toLowerCase())
      return alert('이메일이 일치하지 않습니다.');
    if (!confirm('정말 탈퇴하시겠습니까? 모든 공부 기록이 영구 삭제됩니다.')) return;
    setWithdrawing(true);
    try {
      await api.withdraw(token, withdrawEmail.trim());
      alert('탈퇴가 완료되었습니다.');
      onWithdraw();
    } catch (err: any) {
      alert('탈퇴 실패: ' + err.message);
    } finally {
      setWithdrawing(false);
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
              <div className="relative flex-1">
                <input
                  type="text"
                  value={nickname}
                  onChange={e => setNickname(sanitize(e.target.value, 10))}
                  maxLength={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow pr-14"
                  placeholder="닉네임을 입력하세요"
                />
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium ${
                  nickname.length >= 10 ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {nickname.length}/10
                </span>
              </div>
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


      {/* ── 탈퇴 카드 ── */}
      <div className="bg-white rounded-3xl shadow-sm border border-red-100 p-6">
        <h3 className="text-base font-bold text-red-500 mb-1">계정 탈퇴</h3>
        <p className="text-sm text-gray-400 mb-4">탈퇴 시 모든 공부 기록이 영구 삭제됩니다.</p>

        {!showWithdraw ? (
          <button
            onClick={() => setShowWithdraw(true)}
            className="px-4 py-2 text-sm font-medium text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
          >
            탈퇴하기
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">본인 확인을 위해 가입한 이메일 주소를 입력하세요.</p>
            <input
              type="text"
              value={withdrawEmail}
              onChange={e => setWithdrawEmail(e.target.value)}
              placeholder={user.email}
              className="w-full px-4 py-2 border border-red-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
            />
            <div className="flex gap-2">
              <button
                onClick={handleWithdraw}
                disabled={withdrawing}
                className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {withdrawing ? '처리 중...' : '탈퇴 확인'}
              </button>
              <button
                onClick={() => { setShowWithdraw(false); setWithdrawEmail(''); }}
                className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        )}
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
            <span className="text-xs text-gray-400 font-medium w-28 flex-shrink-0">Enhanced by</span>
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
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Google_Gemini_logo.svg/512px-Google_Gemini_logo.svg.png"
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
                src="https://cdn.iconscout.com/icon/free/png-256/free-cloudflare-icon-download-in-svg-png-gif-file-formats--logo-brand-world-logos-vol-8-pack-icons-282559.png"
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
