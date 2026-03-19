import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Plus, Trash2 } from 'lucide-react';
import { api, User } from '../api';

interface SettingsProps {
  user: User;
  onUpdate: (nickname: string) => void;
}

export function Settings({ user, onUpdate }: SettingsProps) {
  const [nickname, setNickname] = useState(user.nickname);
  const [newSubject, setNewSubject] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSaveNickname = async () => {
    if (!nickname.trim()) return alert('닉네임을 입력해주세요.');
    setSaving(true);
    try {
      await api.setNickname(user.uid, nickname);
      onUpdate(nickname);
      alert('닉네임이 변경되었습니다.');
    } catch (err: any) {
      alert('변경 실패: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSubject = async () => {
    if (!newSubject.trim()) return;
    if (user.subjects.includes(newSubject.trim())) return alert('이미 존재하는 과목입니다.');
    try {
      await api.addSubject(user.uid, newSubject.trim());
      setNewSubject('');
    } catch (err: any) {
      alert('과목 추가 실패: ' + err.message);
    }
  };

  const handleDeleteSubject = async (subject: string) => {
    if (user.subjects.length <= 1) return alert('최소 한 개의 과목은 있어야 합니다.');
    if (!confirm(`'${subject}' 과목을 삭제하시겠습니까?`)) return;
    try {
      await api.deleteSubject(user.uid, subject);
    } catch (err: any) {
      alert('과목 삭제 실패: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <SettingsIcon className="mr-2 text-gray-500" /> 프로필 설정
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input 
              type="text" 
              value={user.email || ''} 
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
                onChange={(e) => setNickname(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                placeholder="닉네임을 입력하세요"
              />
              <button 
                onClick={handleSaveNickname}
                disabled={saving || nickname === user.nickname}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center"
              >
                <Save size={18} className="mr-1" /> 저장
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <Plus className="mr-2 text-gray-500" /> 과목 관리
        </h2>
        
        <div className="space-y-4">
          <div className="flex space-x-2">
            <input 
              type="text" 
              value={newSubject} 
              onChange={(e) => setNewSubject(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSubject()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
              placeholder="새 과목 이름"
            />
            <button 
              onClick={handleAddSubject}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center"
            >
              <Plus size={18} className="mr-1" /> 추가
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {user.subjects.map((s) => (
              <div key={s} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-gray-700 font-medium">{s}</span>
                <button 
                  onClick={() => handleDeleteSubject(s)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
