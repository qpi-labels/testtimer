import React, { useState, useEffect } from 'react';
import { api, User, LeaderboardEntry } from './api';
import { Login } from './components/Login';
import { Timer } from './components/Timer';
import { Leaderboard } from './components/Leaderboard';
import { Settings } from './components/Settings';
import { LogOut, User as UserIcon, Trophy, Users } from 'lucide-react';
import { auth, onAuthStateChanged } from './firebase';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'timer' | 'settings'>('timer');
  const [currentlyStudying, setCurrentlyStudying] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // We don't call api.login here because that's for the initial popup login
          // Instead, we just fetch the user data if they are already logged in
          const userData = await api.login(); // This handles both new and existing users
          setUser(userData);
        } catch (err) {
          console.error('Auth state change error:', err);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    const unsubscribeStudying = api.subscribeCurrentlyStudying((entries) => {
      setCurrentlyStudying(entries);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeStudying();
    };
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const userData = await api.login();
      setUser(userData);
    } catch (err) {
      console.error(err);
      alert('로그인 실패. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
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
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
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

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-7 space-y-8">
            {view === 'timer' ? (
              <Timer 
                user={user} 
                onLogAdded={(totalTime) => setUser({ ...user, totalTime })} 
              />
            ) : (
              <Settings 
                user={user} 
                onUpdate={(nickname) => setUser({ ...user, nickname })} 
              />
            )}
            
            <div className="bg-indigo-50 rounded-3xl p-6 border border-indigo-100 flex items-center justify-between">
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

            {/* Currently Studying Section */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Users className="mr-2 text-indigo-500" size={20} />
                지금 공부 중인 사람들 ({currentlyStudying.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {currentlyStudying.length === 0 ? (
                  <p className="text-gray-400 text-sm">지금은 공부 중인 사람이 없어요.</p>
                ) : (
                  currentlyStudying.map((entry) => (
                    <div 
                      key={entry.uid} 
                      className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-100 flex items-center"
                    >
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                      {entry.nickname}
                    </div>
                  ))
                )}
              </div>
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
