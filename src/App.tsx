import React, { useState, useEffect, useRef } from 'react';
import { api, User } from './api';
import { Login } from './components/Login';
import { Timer } from './components/Timer';
import { Leaderboard } from './components/Leaderboard';
import { Settings } from './components/Settings';
import { SubjectStats } from './components/SubjectStats';
import { ActiveUsers } from './components/ActiveUsers';
import { DailyPlanner } from './components/DailyPlanner';
import { GoalTracker } from './components/GoalTracker';
import { LogOut, Timer as TimerIcon, ClipboardList, Settings as SettingsIcon } from 'lucide-react';

type Tab = 'timer' | 'planner' | 'settings';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'timer',    label: '타이머',  icon: <TimerIcon size={16} /> },
  { key: 'planner',  label: '플래너',  icon: <ClipboardList size={16} /> },
  { key: 'settings', label: '설정',    icon: <SettingsIcon size={16} /> },
];

function TabNav({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pill, setPill] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const idx = TABS.findIndex(t => t.key === tab);
    const btn = btnRefs.current[idx];
    const cont = containerRef.current;
    if (!btn || !cont) return;
    const br = btn.getBoundingClientRect();
    const cr = cont.getBoundingClientRect();
    setPill({ left: br.left - cr.left, width: br.width });
  }, [tab]);

  return (
    <div ref={containerRef} className="relative hidden sm:flex items-center gap-1 bg-gray-100 p-1 rounded-2xl">
      <span
        className="absolute top-1 bottom-1 bg-white rounded-xl shadow-sm pointer-events-none"
        style={{
          left: pill.left,
          width: pill.width,
          transition: 'left 0.32s cubic-bezier(0.4,0,0.2,1), width 0.32s cubic-bezier(0.4,0,0.2,1)',
        }}
      />
      {TABS.map((t, i) => (
        <button
          key={t.key}
          ref={el => { btnRefs.current[i] = el; }}
          onClick={() => setTab(t.key)}
          className={`relative z-10 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 select-none ${
            tab === t.key ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  );
}

function MobileTabBar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [line, setLine] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const idx = TABS.findIndex(t => t.key === tab);
    const btn = btnRefs.current[idx];
    const cont = containerRef.current;
    if (!btn || !cont) return;
    const br = btn.getBoundingClientRect();
    const cr = cont.getBoundingClientRect();
    setLine({ left: br.left - cr.left + br.width * 0.2, width: br.width * 0.6 });
  }, [tab]);

  return (
    <nav ref={containerRef} className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-20">
      <span
        className="absolute top-0 h-0.5 bg-indigo-500 rounded-full pointer-events-none"
        style={{
          left: line.left,
          width: line.width,
          transition: 'left 0.32s cubic-bezier(0.4,0,0.2,1), width 0.32s cubic-bezier(0.4,0,0.2,1)',
        }}
      />
      {TABS.map((t, i) => (
        <button
          key={t.key}
          ref={el => { btnRefs.current[i] = el; }}
          onClick={() => setTab(t.key)}
          className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors duration-200 ${
            tab === t.key ? 'text-indigo-600' : 'text-gray-400'
          }`}
        >
          {t.icon} {t.label}
        </button>
      ))}
    </nav>
  );
}

export default function App() {
  const [token, setToken]     = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab]         = useState<Tab>('timer');

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (t && !user) handleLogin(t);
  }, []);

  const handleLogin = async (credential: string) => {
    setLoading(true);
    try {
      const userData = await api.login(credential);
      setUser(userData);
      setToken(credential);
      localStorage.setItem('token', credential);
    } catch {
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

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
    </div>
  );

  if (!token || !user) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md"><Login onSuccess={handleLogin} /></div>
    </div>
  );

  if (!user.nickname) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">환영합니다!</h2>
        <p className="text-gray-500 mb-6">사용하실 닉네임을 설정해주세요.</p>
        <Settings user={user} token={token} onUpdate={(n) => setUser({ ...user, nickname: n })} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-indigo-600 tracking-tight">StudyTimer</h1>
          <TabNav tab={tab} setTab={setTab} />
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600 hidden sm:block">{user.nickname}</span>
            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50">
              <LogOut size={19} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 pb-24 sm:pb-8">

        {/* ── TIMER TAB ─────────────────────────────── */}
        {tab === 'timer' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left 8-col: timer (full width) + stats row below */}
            <div className="lg:col-span-8 space-y-6">

              {/* Timer card — full 8-col width */}
              <Timer token={token} onLogAdded={handleLogAdded} />

              {/* Stats row: total banner + goal tracker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-indigo-50 rounded-3xl p-6 border border-indigo-100 flex items-center justify-between">
                  <div>
                    <p className="text-indigo-800 font-medium mb-1">총 누적 공부 시간</p>
                    <p className="text-3xl font-bold text-indigo-900">
                      {Math.floor(user.totalTime / 3600000)}시간{' '}
                      {Math.floor((user.totalTime % 3600000) / 60000)}분
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-600">
                    <TrophyIcon size={28} />
                  </div>
                </div>

                <GoalTracker totalTime={user.totalTime} subjectStats={user.subjectStats || {}} />
              </div>

              <SubjectStats subjectStats={user.subjectStats || {}} totalTime={user.totalTime} />
            </div>

            {/* Right 4-col */}
            <div className="lg:col-span-4 space-y-6">
              <ActiveUsers />
              <Leaderboard />
            </div>
          </div>
        )}

        {/* ── PLANNER TAB ───────────────────────────── */}
        {tab === 'planner' && (
          <div className="max-w-2xl mx-auto">
            <DailyPlanner />
          </div>
        )}

        {/* ── SETTINGS TAB ──────────────────────────── */}
        {tab === 'settings' && (
          <div className="max-w-lg mx-auto">
            <Settings user={user} token={token} onUpdate={(n) => setUser({ ...user, nickname: n })} />
          </div>
        )}
      </main>

      <MobileTabBar tab={tab} setTab={setTab} />
    </div>
  );
}

function TrophyIcon({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
