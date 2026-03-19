import React, { useState, useMemo } from 'react';
import {
  BarChart2, ChevronLeft, ChevronRight,
  TrendingUp, Calendar, Award, Flame,
} from 'lucide-react';
import { loadAllPlanner, toDateKey, catColor, fmtGoal } from './DailyPlanner';

interface StatisticsProps {
  subjectStats: Record<string, number>; // cumulative from server
  totalTime: number;
}

/* ── helpers ── */
function msToHM(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}h ${m}m`;
}

function padZero(n: number) { return String(n).padStart(2, '0'); }

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getMonthKey(year: number, month: number) {
  return `${year}-${padZero(month + 1)}`;
}

// From planner data: count completed tasks & goal minutes per date key
function buildPlannerStats(allData: Record<string, any>) {
  const byDate: Record<string, { total: number; done: number; goalMin: number; doneGoalMin: number }> = {};
  for (const [key, day] of Object.entries(allData)) {
    const tasks = (day as any).tasks ?? [];
    const total = tasks.length;
    const done  = tasks.filter((t: any) => t.done).length;
    const goalMin     = tasks.reduce((s: number, t: any) => s + (t.goalMinutes ?? 0), 0);
    const doneGoalMin = tasks.filter((t: any) => t.done).reduce((s: number, t: any) => s + (t.goalMinutes ?? 0), 0);
    byDate[key] = { total, done, goalMin, doneGoalMin };
  }
  return byDate;
}

/* ── Heatmap cell ── */
function HeatCell({ count, total }: { count: number; total: number }) {
  const ratio = total > 0 ? count / total : 0;
  const bg =
    ratio === 0 ? 'bg-gray-100' :
    ratio < 0.34 ? 'bg-violet-200' :
    ratio < 0.67 ? 'bg-violet-400' :
    'bg-violet-600';
  return <div className={`w-4 h-4 rounded-sm ${bg} transition-colors`} title={`${count}/${total}`} />;
}

/* ── Bar ── */
function Bar({ value, max, label, sublabel, color = 'bg-indigo-400' }: {
  value: number; max: number; label: string; sublabel?: string; color?: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-end gap-1.5 group">
      <div className="flex flex-col items-center gap-1" style={{ minWidth: 28 }}>
        {value > 0 && (
          <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {sublabel}
          </span>
        )}
        <div className="relative w-6 bg-gray-100 rounded-t-md overflow-hidden" style={{ height: 80 }}>
          <div
            className={`absolute bottom-0 left-0 right-0 ${color} rounded-t-md transition-all duration-700`}
            style={{ height: `${pct}%` }}
          />
        </div>
        <span className="text-[10px] text-gray-400">{label}</span>
      </div>
    </div>
  );
}

/* ── Main Statistics ── */
export function Statistics({ subjectStats, totalTime }: StatisticsProps) {
  const today   = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [view, setView]   = useState<'monthly' | 'daily'>('monthly');

  const allPlannerData = useMemo(() => loadAllPlanner(), []);
  const plannerStats   = useMemo(() => buildPlannerStats(allPlannerData), [allPlannerData]);

  // ── Monthly view: one bar per day of the month ──
  const monthDays = daysInMonth(year, month);
  const monthKey  = getMonthKey(year, month);

  const dailyBars = useMemo(() => {
    return Array.from({ length: monthDays }, (_, i) => {
      const day = i + 1;
      const key = `${monthKey}-${padZero(day)}`;
      const s   = plannerStats[key] ?? { total: 0, done: 0, goalMin: 0, doneGoalMin: 0 };
      return { day, key, ...s };
    });
  }, [year, month, plannerStats, monthDays, monthKey]);

  const maxDone = Math.max(...dailyBars.map(d => d.done), 1);

  // Monthly totals
  const monthlyTotals = useMemo(() => ({
    totalTasks: dailyBars.reduce((s, d) => s + d.total, 0),
    doneTasks:  dailyBars.reduce((s, d) => s + d.done, 0),
    goalMin:    dailyBars.reduce((s, d) => s + d.goalMin, 0),
    doneGoalMin: dailyBars.reduce((s, d) => s + d.doneGoalMin, 0),
    activeDays: dailyBars.filter(d => d.total > 0).length,
  }), [dailyBars]);

  // ── Daily view: one bar per month ──
  const monthlyBars = useMemo(() => {
    return Array.from({ length: 12 }, (_, m) => {
      const mk = getMonthKey(year, m);
      const keys = Object.keys(plannerStats).filter(k => k.startsWith(mk));
      const total = keys.reduce((s, k) => s + (plannerStats[k]?.total ?? 0), 0);
      const done  = keys.reduce((s, k) => s + (plannerStats[k]?.done ?? 0), 0);
      const goalMin = keys.reduce((s, k) => s + (plannerStats[k]?.goalMin ?? 0), 0);
      return {
        month: m,
        label: `${m + 1}월`,
        total, done, goalMin,
        activeDays: keys.filter(k => (plannerStats[k]?.total ?? 0) > 0).length,
      };
    });
  }, [year, plannerStats]);

  const maxMonthDone = Math.max(...monthlyBars.map(d => d.done), 1);

  // ── Streak ──
  const streak = useMemo(() => {
    let count = 0;
    const cur = new Date();
    while (true) {
      const key = toDateKey(cur);
      const s = plannerStats[key];
      if (!s || s.total === 0 || s.done === 0) break;
      count++;
      cur.setDate(cur.getDate() - 1);
    }
    return count;
  }, [plannerStats]);

  // Completion rate
  const compRate = monthlyTotals.totalTasks > 0
    ? Math.round((monthlyTotals.doneTasks / monthlyTotals.totalTasks) * 100)
    : 0;

  const monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

  return (
    <div className="space-y-6">

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            icon: <Award size={18} className="text-indigo-500" />,
            label: '총 누적 시간',
            value: msToHM(totalTime),
            bg: 'bg-indigo-50',
          },
          {
            icon: <Flame size={18} className="text-orange-500" />,
            label: '연속 달성',
            value: `${streak}일`,
            bg: 'bg-orange-50',
          },
          {
            icon: <Calendar size={18} className="text-violet-500" />,
            label: `${month + 1}월 완료율`,
            value: `${compRate}%`,
            bg: 'bg-violet-50',
          },
          {
            icon: <TrendingUp size={18} className="text-emerald-500" />,
            label: `${month + 1}월 목표시간`,
            value: monthlyTotals.goalMin > 0 ? fmtGoal(monthlyTotals.doneGoalMin) + ' / ' + fmtGoal(monthlyTotals.goalMin) : '—',
            bg: 'bg-emerald-50',
          },
        ].map((card, i) => (
          <div key={i} className={`${card.bg} rounded-2xl p-4 border border-white`}>
            <div className="flex items-center gap-2 mb-2">{card.icon}<span className="text-xs text-gray-500 font-medium">{card.label}</span></div>
            <p className="text-lg font-bold text-gray-800 leading-tight">{card.value}</p>
          </div>
        ))}
      </div>

      {/* ── Chart panel ── */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-50 flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart2 size={20} className="text-indigo-500" /> 통계
          </h2>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <button onClick={() => setView('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                view === 'monthly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              일별
            </button>
            <button onClick={() => setView('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                view === 'daily' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              월별
            </button>
          </div>

          {/* Year/month nav */}
          <div className="flex items-center gap-2">
            {view === 'monthly' && (
              <>
                <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-semibold text-gray-700 w-20 text-center">
                  {year}년 {month + 1}월
                </span>
                <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                  <ChevronRight size={16} />
                </button>
              </>
            )}
            {view === 'daily' && (
              <>
                <button onClick={() => setYear(y => y - 1)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-semibold text-gray-700 w-16 text-center">{year}년</span>
                <button onClick={() => setYear(y => y + 1)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                  <ChevronRight size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="px-6 py-5">

          {/* ── DAILY (per-day bars in month) ── */}
          {view === 'monthly' && (
            <>
              <div className="flex items-end gap-1 overflow-x-auto pb-2" style={{ minHeight: 112 }}>
                {dailyBars.map(d => (
                  <div key={d.day} className="flex flex-col items-center gap-1 group flex-shrink-0" style={{ width: 20 }}>
                    <span className="text-[9px] text-indigo-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.done > 0 ? d.done : ''}
                    </span>
                    <div className="relative w-4 bg-gray-100 rounded-t-md overflow-hidden" style={{ height: 72 }}>
                      {d.total > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gray-200 rounded-t-md" style={{ height: '100%' }} />
                      )}
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-violet-500 rounded-t-md transition-all duration-700"
                        style={{ height: `${maxDone > 0 ? (d.done / maxDone) * 100 : 0}%` }}
                      />
                    </div>
                    <span className={`text-[9px] ${
                      toDateKey(new Date()) === d.key ? 'text-violet-600 font-bold' : 'text-gray-400'
                    }`}>{d.day}</span>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-violet-500" /><span className="text-xs text-gray-500">완료 항목</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-gray-200" /><span className="text-xs text-gray-500">전체 항목</span></div>
              </div>

              {/* Monthly stat row */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { label: '활동일', value: `${monthlyTotals.activeDays}일` },
                  { label: '완료 항목', value: `${monthlyTotals.doneTasks} / ${monthlyTotals.totalTasks}` },
                  { label: '달성률', value: `${compRate}%` },
                ].map((s, i) => (
                  <div key={i} className="bg-gray-50 rounded-2xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                    <p className="text-base font-bold text-gray-800">{s.value}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── MONTHLY (per-month bars in year) ── */}
          {view === 'daily' && (
            <>
              <div className="flex items-end gap-2 pb-2" style={{ minHeight: 112 }}>
                {monthlyBars.map(d => (
                  <div key={d.month} className="flex flex-col items-center gap-1 group flex-1">
                    <span className="text-[9px] text-indigo-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.done > 0 ? d.done : ''}
                    </span>
                    <div className="relative w-full bg-gray-100 rounded-t-md overflow-hidden" style={{ height: 72 }}>
                      {d.total > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gray-200 rounded-t-md" style={{ height: '100%' }} />
                      )}
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-indigo-500 rounded-t-md transition-all duration-700"
                        style={{ height: `${maxMonthDone > 0 ? (d.done / maxMonthDone) * 100 : 0}%` }}
                      />
                    </div>
                    <span className={`text-[9px] ${
                      new Date().getFullYear() === year && new Date().getMonth() === d.month
                        ? 'text-indigo-600 font-bold'
                        : 'text-gray-400'
                    }`}>{d.label}</span>
                  </div>
                ))}
              </div>

              {/* Yearly summary */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                {(() => {
                  const yTotal = monthlyBars.reduce((s, d) => s + d.total, 0);
                  const yDone  = monthlyBars.reduce((s, d) => s + d.done, 0);
                  const yGoal  = monthlyBars.reduce((s, d) => s + d.goalMin, 0);
                  const yRate  = yTotal > 0 ? Math.round((yDone / yTotal) * 100) : 0;
                  return [
                    { label: '연간 완료', value: `${yDone} / ${yTotal}` },
                    { label: '연간 달성률', value: `${yRate}%` },
                    { label: '연간 목표시간', value: yGoal > 0 ? fmtGoal(yGoal) : '—' },
                  ];
                })().map((s, i) => (
                  <div key={i} className="bg-gray-50 rounded-2xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                    <p className="text-base font-bold text-gray-800">{s.value}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Subject breakdown (from server) ── */}
      {Object.keys(subjectStats).length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-500" /> 과목별 누적 공부 시간
          </h3>
          <div className="space-y-3">
            {Object.entries(subjectStats)
              .sort((a, b) => b[1] - a[1])
              .map(([subject, ms]) => {
                const maxMs = Math.max(...Object.values(subjectStats));
                const pct   = maxMs > 0 ? (ms / maxMs) * 100 : 0;
                const c     = catColor(subject);
                return (
                  <div key={subject} className="flex items-center gap-3">
                    <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${c.bg} ${c.text}`}>{subject}</span>
                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${c.dot.replace('bg-', 'bg-')}`}
                        style={{ width: `${pct}%`, backgroundColor: undefined }}
                      >
                        <div className="h-full rounded-full" style={{
                          background: subject === '공부' ? '#818cf8' :
                                      subject === '운동' ? '#34d399' :
                                      subject === '독서' ? '#fbbf24' : '#94a3b8'
                        }} />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-700 flex-shrink-0 w-20 text-right">{msToHM(ms)}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ── Monthly heatmap ── */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar size={16} className="text-violet-500" /> 활동 히트맵 ({year}년)
        </h3>
        <div className="space-y-2">
          {Array.from({ length: 12 }, (_, m) => {
            const mk = getMonthKey(year, m);
            const days = daysInMonth(year, m);
            return (
              <div key={m} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-8 flex-shrink-0">{m + 1}월</span>
                <div className="flex gap-1 flex-wrap">
                  {Array.from({ length: days }, (_, d) => {
                    const key = `${mk}-${padZero(d + 1)}`;
                    const s = plannerStats[key] ?? { total: 0, done: 0 };
                    return <HeatCell key={d} count={s.done} total={s.total} />;
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 mt-4 justify-end">
          <span className="text-xs text-gray-400">적음</span>
          {['bg-gray-100','bg-violet-200','bg-violet-400','bg-violet-600'].map(c => (
            <div key={c} className={`w-4 h-4 rounded-sm ${c}`} />
          ))}
          <span className="text-xs text-gray-400">많음</span>
        </div>
      </div>
    </div>
  );
}
