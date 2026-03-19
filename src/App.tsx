import React, { useState, useEffect } from 'react';
import { api, User } from './api';
import { Login } from './components/Login';
import { Timer } from './components/Timer';
import { Leaderboard } from './components/Leaderboard';
import { Settings } from './components/Settings';
import { SubjectStats } from './components/SubjectStats';
import { ActiveUsers } from './components/ActiveUsers';
import { LogOut, User as UserIcon } from 'lucide-react';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'timer' | 'settings'>('timer');

  useEffect(() => {
    const initialToken = localStorage.getItem('token');
    if (initialToken && !user) {
      handleLogin(initialToken);
    }
  }, []);

  const handleLogin = async (credential: string) => {
    setLoading(true);
    try {
      const userData = await api.login(credential);
      setUser(userData);
      setToken(credential);
      localStorage.setItem('token', credential);
    } catch (err) {
      console.error(err);
      alert('로그인 실패. 다시 시도해주세요.');
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const handleLogAdded = (totalTime: number, subjectStats: Record<string, number>) => {
    if (user) setUser({ ...user, totalTime, subjectStats });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!token || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Login onSuccess={handleLogin} />
        </div>
      </div>
    );
  }

  if (!user.nickname) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">환영합니다!</h2>
            <p className="text-gray-500 mb-6">사용하실 닉네임을 설정해주세요.</p>
            <Settings
              user={user}
              token={token}
              onUpdate={(nickname) => setUser({ ...user, nickname })}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-indigo-600 tracking-tight">StudyTimer</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setView(view === 'timer' ? 'settings' : 'timer')}
              className="flex items-center text-gray-600 hover:text-indigo-600 transition-colors font-medium"
            >
              <UserIcon size={18} className="mr-1" />
              {user.nickname}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column */}
          <div className="lg:col-span-7 space-y-6">
            {view === 'timer' ? (
              <Timer token={token} onLogAdded={handleLogAdded} />
            ) : (
              <Settings
                user={user}
                token={token}
                onUpdate={(nickname) => setUser({ ...user, nickname })}
              />
            )}

            {/* Total time banner */}
            <div className="bg-indigo-50 rounded-3xl p-6 border border-indigo-100 flex items-center justify-between">
              <div>
                <p className="text-indigo-800 font-medium mb-1">나의 총 누적 공부 시간</p>
                <p className="text-3xl font-bold text-indigo-900">
                  {Math.floor(user.totalTime / 3600000)}시간{' '}
                  {Math.floor((user.totalTime % 3600000) / 60000)}분
                </p>
              </div>
              <div className="w-16 h-16 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-600">
                <Trophy size={32} />
              </div>
            </div>

            {/* Subject stats */}
            <SubjectStats
              subjectStats={user.subjectStats || {}}
              totalTime={user.totalTime}
            />
          </div>

          {/* Right column */}
          <div className="lg:col-span-5 space-y-6">
            <ActiveUsers />
            <Leaderboard />
          </div>
        </div>
      </main>
    </div>
  );
}

function Trophy({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
      <path d="M4 22h16"></path>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
    </svg>
  );
}
