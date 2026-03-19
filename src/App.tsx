import React, { useState, useEffect } from 'react';
import { api, User, LeaderboardEntry } from './api';
import { auth, onAuthStateChanged, db, doc, onSnapshot } from './firebase';
import { Login } from './components/Login';
import { Timer } from './components/Timer';
import { Leaderboard } from './components/Leaderboard';
import { Settings } from './components/Settings';
import { LogOut, User as UserIcon, BookOpen, Users } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'timer' | 'settings' | 'active'>('timer');
  const [activeUsers, setActiveUsers] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Subscribe to user document
        const unsubscribeUser = onSnapshot(doc(db, 'users', firebaseUser.uid), (doc) => {
          if (doc.exists()) {
            setUser(doc.data() as User);
          }
          setLoading(false);
        });
        return () => unsubscribeUser();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    const unsubscribeActive = api.onActiveUsersUpdate(setActiveUsers);

    return () => {
      unsubscribeAuth();
      unsubscribeActive();
    };
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await api.login();
    } catch (err) {
      console.error(err);
      alert('로그인 실패. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Login onSuccess={handleLogin} />
        </div>
      </div>
    );
  }

  // If user has no nickname, force them to set one
  if (!user.nickname) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">환영합니다!</h2>
            <p className="text-gray-500 mb-6">사용하실 닉네임을 설정해주세요.</p>
            <Settings 
              user={user} 
              onUpdate={(nickname) => api.setNickname(user.uid, nickname)} 
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-indigo-600 tracking-tight flex items-center">
            <BookOpen className="mr-2" size={24} />
            StudyTimer
          </h1>
          <div className="flex items-center space-x-2 md:space-x-4">
            <button 
              onClick={() => setView('active')}
              className={`flex items-center px-3 py-1.5 rounded-full transition-colors font-medium ${view === 'active' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Users size={18} className="mr-1" />
              <span className="hidden md:inline">공부 중</span>
              {activeUsers.length > 0 && (
                <span className="ml-1.5 bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {activeUsers.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setView(view === 'settings' ? 'timer' : 'settings')}
              className={`flex items-center px-3 py-1.5 rounded-full transition-colors font-medium ${view === 'settings' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <UserIcon size={18} className="mr-1" />
              <span className="hidden md:inline">{user.nickname}</span>
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

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-7 space-y-8">
            {view === 'timer' ? (
              <Timer user={user} />
            ) : view === 'settings' ? (
              <Settings 
                user={user} 
                onUpdate={(nickname) => api.setNickname(user.uid, nickname)} 
              />
            ) : (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <Users className="mr-2 text-indigo-600" size={20} />
                    지금 공부 중인 사람들
                  </h2>
                  <button 
                    onClick={() => setView('timer')}
                    className="text-sm text-indigo-600 font-medium"
                  >
                    타이머로 돌아가기
                  </button>
                </div>
                
                {activeUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400">현재 공부 중인 사람이 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeUsers.map((u) => (
                      <div key={u.uid} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mr-3 font-bold">
                            {u.nickname.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{u.nickname}</p>
                            <p className="text-xs text-indigo-600 font-medium">{u.currentSubject} 공부 중</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                          <span className="text-xs text-green-600 font-bold">LIVE</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div className="bg-indigo-50 rounded-3xl p-6 border border-indigo-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-indigo-800 font-medium mb-1">나의 총 누적 공부 시간</p>
                  <p className="text-3xl font-bold text-indigo-900">
                    {Math.floor(user.totalTime / 3600000)}시간 {Math.floor((user.totalTime % 3600000) / 60000)}분
                  </p>
                </div>
                <div className="w-16 h-16 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-600">
                  <Trophy size={32} />
                </div>
              </div>
              
              {Object.keys(user.subjectTimes || {}).length > 0 && (
                <div className="space-y-2 pt-4 border-t border-indigo-200">
                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">과목별 통계</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(user.subjectTimes || {}).map(([subject, time]) => (
                      <div key={subject} className="bg-white/50 p-3 rounded-xl flex justify-between items-center">
                        <span className="text-sm font-medium text-indigo-800">{subject}</span>
                        <span className="text-sm font-bold text-indigo-900">
                          {Math.floor((time as number) / 3600000)}h {Math.floor(((time as number) % 3600000) / 60000)}m
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-5">
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
