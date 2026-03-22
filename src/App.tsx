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
import { Statistics } from './components/Statistics';
import { InsightUtility } from './components/InsightUtility';
import {
  LogOut,
  Timer as TimerIcon,
  ClipboardList,
  BarChart2,
  Settings as SettingsIcon,
  Wrench,
  ExternalLink,
} from 'lucide-react';

type Tab = 'utility' | 'timer' | 'planner' | 'stats' | 'settings';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'utility', label: '유틸리티', icon: <Wrench size={15} /> },
  { key: 'timer', label: '타이머', icon: <TimerIcon size={15} /> },
  { key: 'planner', label: '플래너', icon: <ClipboardList size={15} /> },
  { key: 'stats', label: '통계', icon: <BarChart2 size={15} /> },
  { key: 'settings', label: '설정', icon: <SettingsIcon size={15} /> },
];

/* ── Desktop animated tab pill ── */
function TabNav({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pill, setPill] = useState({ left: 0, width: 0 });
  const initialized = useRef(false);

  useEffect(() => {
    const idx = TABS.findIndex(t => t.key === tab);
    const btn = btnRefs.current[idx];
    const cont = containerRef.current;
    if (!btn || !cont) return;
    const br = btn.getBoundingClientRect();
    const cr = cont.getBoundingClientRect();
    const next = { left: br.left - cr.left, width: br.width };
    if (!initialized.current) {
      // first render: set without transition
      setPill(next);
      initialized.current = true;
    } else {
      setPill(next);
    }
  }, [tab]);

  return (
    <div ref={containerRef} className="relative hidden sm:flex items-center gap-0.5 bg-gray-100 p-1 rounded-2xl">
      <span
        className="absolute top-1 bottom-1 bg-white rounded-xl shadow-sm pointer-events-none"
        style={{
          left: pill.left,
          width: pill.width,
          transition: initialized.current
            ? 'left 0.3s cubic-bezier(0.4,0,0.2,1), width 0.3s cubic-bezier(0.4,0,0.2,1)'
            : 'none',
        }}
      />
      {TABS.map((t, i) => (
        <button
          key={t.key}
          ref={el => { btnRefs.current[i] = el; }}
          onClick={() => setTab(t.key)}
          className={`relative z-10 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors duration-200 select-none ${tab === t.key ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-800'
            }`}
        >
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  );
}

/* ── Mobile bottom tab bar with sliding indicator ── */
function MobileTabBar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [line, setLine] = useState({ left: 0, width: 0 });
  const initialized = useRef(false);

  useEffect(() => {
    const idx = TABS.findIndex(t => t.key === tab);
    const btn = btnRefs.current[idx];
    const cont = containerRef.current;
    if (!btn || !cont) return;
    const br = btn.getBoundingClientRect();
    const cr = cont.getBoundingClientRect();
    setLine({ left: br.left - cr.left + br.width * 0.2, width: br.width * 0.6 });
    initialized.current = true;
  }, [tab]);

  return (
    <nav ref={containerRef} className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-20">
      <span
        className="absolute top-0 h-0.5 bg-indigo-500 rounded-full pointer-events-none"
        style={{
          left: line.left,
          width: line.width,
          transition: initialized.current
            ? 'left 0.3s cubic-bezier(0.4,0,0.2,1), width 0.3s cubic-bezier(0.4,0,0.2,1)'
            : 'none',
        }}
      />
      {TABS.map((t, i) => (
        <button
          key={t.key}
          ref={el => { btnRefs.current[i] = el; }}
          onClick={() => setTab(t.key)}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors duration-200 ${tab === t.key ? 'text-indigo-600' : 'text-gray-400'
            }`}
        >
          {t.icon} {t.label}
        </button>
      ))}
    </nav>
  );
}

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('timer');
  const [todayStats, setTodayStats] = useState<{ totalTime: number; subjectStats: Record<string, number> }>({ totalTime: 0, subjectStats: {} });
  const [timerElapsed, setTimerElapsed] = useState<{ ms: number; subject: string }>({ ms: 0, subject: '' });

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (t && !user) handleLogin(t);
  }, []);

  const fetchTodayStats = async (credential: string) => {
    try {
      const stats = await api.getDailyStats(credential);
      setTodayStats(stats);
    } catch { }
  };

  const handleLogin = async (credential: string) => {
    setLoading(true);
    try {
      const userData = await api.login(credential);
      setUser(userData);
      setToken(credential);
      localStorage.setItem('token', credential);
      fetchTodayStats(credential);
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
    // 오늘 통계 서버에서 다시 가져오기
    if (token) fetchTodayStats(token);
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
        <Settings user={user} token={token} onUpdate={(n, g) => setUser({ ...user, nickname: n, grade: g })} onWithdraw={handleLogout} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-indigo-600 tracking-tight flex-shrink-0">충곽타이머</h1>
          <TabNav tab={tab} setTab={setTab} />
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-sm font-medium text-gray-600 hidden sm:block">{user.nickname}</span>
            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50">
              <LogOut size={19} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 pb-24 sm:pb-8">

        {/* ── UTILITY TAB ── */}
        {tab === 'utility' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">유틸리티</h2>
            
            <InsightUtility />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              
              <a 
                href="https://dasein.qpi.digital" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group block p-6 bg-white border border-gray-100 rounded-3xl hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-red-100 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-red-800 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-bold tracking-tight text-gray-900" style={{ fontFamily: '"Playfair Display", serif' }}>Dasein;</span>
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-red-50 transition-colors">
                    <ExternalLink size={16} className="text-gray-400 group-hover:text-red-600 transition-colors" />
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-gray-800 mb-1">학술 연구 검색엔진</h3>
                <p className="text-xs text-gray-500 leading-relaxed">학술 자료와 논문을 빠르게 검색하고 탐색하세요.</p>
              </a>

            </div>
          </div>
        )}

        {/* ── TIMER TAB ── */}
        {tab === 'timer' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <Timer token={token} nickname={user.nickname} grade={user.grade} onLogAdded={handleLogAdded} onElapsedChange={(ms, subj) => setTimerElapsed({ ms, subject: subj })} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-indigo-50 rounded-3xl p-6 border border-indigo-100 flex items-center justify-between">
                  <div>
                    <p className="text-indigo-800 font-medium mb-1">오늘 공부 시간</p>
                    <p className="text-3xl font-bold text-indigo-900">
                      {Math.floor(todayStats.totalTime / 3600000)}시간{' '}
                      {Math.floor((todayStats.totalTime % 3600000) / 60000)}분
                    </p>

                  </div>
                  <div className="w-14 h-14 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-600">
                    <TrophyIcon size={28} />
                  </div>
                </div>
                {(() => {
                  const liveTotal = todayStats.totalTime + timerElapsed.ms;
                  const liveSubjects = { ...todayStats.subjectStats };
                  if (timerElapsed.ms > 0 && timerElapsed.subject) {
                    liveSubjects[timerElapsed.subject] = (liveSubjects[timerElapsed.subject] || 0) + timerElapsed.ms;
                  }
                  return <GoalTracker totalTime={liveTotal} subjectStats={liveSubjects} />;
                })()}
              </div>

              <SubjectStats subjectStats={todayStats.subjectStats} totalTime={todayStats.totalTime} />
            </div>

            <div className="lg:col-span-4 space-y-6">
              <ActiveUsers />
              <Leaderboard />
            </div>
          </div>
        )}

        {/* ── PLANNER TAB ── */}
        {tab === 'planner' && (
          <div className="max-w-2xl mx-auto">
            <DailyPlanner timerElapsed={timerElapsed} />
          </div>
        )}

        {/* ── STATS TAB ── */}
        {tab === 'stats' && (
          <div className="max-w-3xl mx-auto">
            <Statistics
              subjectStats={user.subjectStats || {}}
              totalTime={user.totalTime}
              todayTotalTime={todayStats.totalTime}
            />
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {tab === 'settings' && (
          <div className="max-w-lg mx-auto">
            <Settings user={user} token={token} onUpdate={(n, g) => setUser({ ...user, nickname: n, grade: g })} onWithdraw={handleLogout} />
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

