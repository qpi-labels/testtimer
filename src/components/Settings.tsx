import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Plus, Trash2, BookOpen, Loader2 } from 'lucide-react';
import { api, User, Subject } from '../api';

interface SettingsProps {
  user: User;
  onUpdate: (nickname: string) => void;
}

export function Settings({ user, onUpdate }: SettingsProps) {
  const [nickname, setNickname] = useState(user.nickname);
  const [saving, setSaving] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [addingSubject, setAddingSubject] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, [user.uid]);

  const fetchSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const data = await api.getSubjects(user.uid);
      setSubjects(data);
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleSaveNickname = async () => {
    if (!nickname.trim()) return alert('닉네임을 입력해주세요.');
    setSaving(true);
    try {
      const newNickname = await api.setNickname(user.uid, nickname);
      onUpdate(newNickname);
      alert('닉네임이 변경되었습니다.');
    } catch (err: any) {
      alert('변경 실패: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return;
    setAddingSubject(true);
    try {
      const newSub = await api.addSubject(user.uid, newSubjectName.trim());
      setSubjects([...subjects, newSub]);
      setNewSubjectName('');
    } catch (err: any) {
      alert('과목 추가 실패: ' + err.message);
    } finally {
      setAddingSubject(false);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('이 과목을 삭제하시겠습니까? 관련 기록은 유지되지만 타이머에서 선택할 수 없게 됩니다.')) return;
    try {
      await api.deleteSubject(user.uid, id);
      setSubjects(subjects.filter(s => s.id !== id));
    } catch (err: any) {
      alert('과목 삭제 실패: ' + err.message);
    }
  };

  const formatTime = (ms: number) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}시간 ${m}분`;
  };

  return (
    <div className="space-y-8">
      {/* Nickname Settings */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <SettingsIcon className="mr-2 text-gray-500" size={20} /> 프로필 설정
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
                onChange={(e) => setNickname(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                placeholder="닉네임을 입력하세요"
              />
              <button 
                onClick={handleSaveNickname}
                disabled={saving || nickname === user.nickname}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} className="mr-1" />}
                <span className="ml-1">저장</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Management */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <BookOpen className="mr-2 text-indigo-500" size={20} /> 과목 관리
        </h2>

        <div className="space-y-6">
          <div className="flex space-x-2">
            <input 
              type="text" 
              value={newSubjectName} 
              onChange={(e) => setNewSubjectName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSubject()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="새로운 과목 이름"
            />
            <button 
              onClick={handleAddSubject}
              disabled={addingSubject || !newSubjectName.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center"
            >
              {addingSubject ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              <span className="ml-1">추가</span>
            </button>
          </div>

          <div className="space-y-3">
            {loadingSubjects ? (
              <div className="flex justify-center py-4">
                <Loader2 className="animate-spin text-gray-400" />
              </div>
            ) : subjects.length === 0 ? (
              <p className="text-center text-gray-400 py-4">추가된 과목이 없습니다.</p>
            ) : (
              subjects.map(subject => (
                <div key={subject.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div>
                    <p className="font-bold text-gray-800">{subject.name}</p>
                    <p className="text-sm text-indigo-600 font-medium">누적: {formatTime(subject.totalTime)}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteSubject(subject.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
