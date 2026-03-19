import React, { useState, useEffect } from 'react';
import { Target, Edit2, Check, X, TrendingUp } from 'lucide-react';

interface GoalTrackerProps {
  totalTime: number; // today's actual study time in ms (from timer logs)
  subjectStats: Record<string, number>;
}

const GOAL_KEY = 'studyGoal_v1';

function loadGoal(): number {
  try {
    const v = localStorage.getItem(GOAL_KEY);
    return v ? Number(v) : 4 * 60 * 60 * 1000; // default 4h
  } catch { return 4 * 60 * 60 * 1000; }
}

function saveGoal(ms: number) {
  localStorage.setItem(GOAL_KEY, String(ms));
}

function fmtH(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

const PRESET_HOURS = [2, 4, 6, 8, 10];

export function GoalTracker({ totalTime, subjectStats }: GoalTrackerProps) {
  const [goalMs, setGoalMs] = useState(loadGoal);
  const [editing, setEditing] = useState(false);
  const [inputH, setInputH] = useState('');
  const [inputM, setInputM] = useState('');

  // today's actual time = sum of subjectStats (which accumulates per session)
  // We use totalTime prop directly as cumulative; for daily we need today's logs.
  // Since backend doesn't separate daily, we use subjectStats sum as today's total.
  const todayMs = Object.values(subjectStats).reduce((a, b) => a + b, 0);

  const progress = Math.min((todayMs / goalMs) * 100, 100);
  const reached = todayMs >= goalMs;
  const remaining = Math.max(goalMs - todayMs, 0);

  useEffect(() => { saveGoal(goalMs); }, [goalMs]);

  const openEdit = () => {
    setInputH(String(Math.floor(goalMs / 3600000)));
    setInputM(String(Math.floor((goalMs % 3600000) / 60000)));
    setEditing(true);
  };

  const applyEdit = () => {
    const h = Math.max(0, Math.min(24, Number(inputH) || 0));
    const m = Math.max(0, Math.min(59, Number(inputM) || 0));
    const ms = h * 3600000 + m * 60000;
    if (ms > 0) setGoalMs(ms);
    setEditing(false);
  };

  const circumference = 2 * Math.PI * 52;
  const dash = (progress / 100) * circumference;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Target size={20} className="text-rose-500" />
          오늘의 목표
        </h2>
        {!editing && (
          <button
            onClick={openEdit}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
          >
            <Edit2 size={13} /> 목표 설정
          </button>
        )}
      </div>

      {/* Goal edit */}
      {editing && (
        <div className="mb-5 p-4 bg-rose-50 rounded-2xl border border-rose-100">
          <p className="text-sm font-medium text-rose-700 mb-3">목표 시간 설정</p>

          {/* Presets */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {PRESET_HOURS.map(h => (
              <button
                key={h}
                onClick={() => { setInputH(String(h)); setInputM('0'); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  Number(inputH) === h && Number(inputM) === 0
                    ? 'bg-rose-500 text-white'
                    : 'bg-white text-rose-600 border border-rose-200 hover:border-rose-400'
                }`}
              >
                {h}시간
              </button>
            ))}
          </div>

          {/* Custom */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0} max={24}
                value={inputH}
                onChange={e => setInputH(e.target.value)}
                className="w-14 px-2 py-1.5 border border-rose-200 rounded-xl text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
              <span className="text-sm text-gray-500">시간</span>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0} max={59}
                value={inputM}
                onChange={e => setInputM(e.target.value)}
                className="w-14 px-2 py-1.5 border border-rose-200 rounded-xl text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
              <span className="text-sm text-gray-500">분</span>
            </div>
            <div className="flex gap-1 ml-auto">
              <button onClick={applyEdit} className="p-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors">
                <Check size={15} />
              </button>
              <button onClick={() => setEditing(false)} className="p-2 bg-gray-200 text-gray-600 rounded-xl hover:bg-gray-300 transition-colors">
                <X size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Circle progress */}
      <div className="flex items-center gap-6 mb-5">
        <div className="relative flex-shrink-0">
          <svg width="128" height="128" viewBox="0 0 128 128">
            {/* Track */}
            <circle cx="64" cy="64" r="52" fill="none" stroke="#f3f4f6" strokeWidth="10" />
            {/* Progress */}
            <circle
              cx="64" cy="64" r="52"
              fill="none"
              stroke={reached ? '#10b981' : '#f43f5e'}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              strokeDashoffset="0"
              transform="rotate(-90 64 64)"
              style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.25,1,0.5,1)' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${reached ? 'text-emerald-500' : 'text-rose-500'}`}>
              {Math.round(progress)}%
            </span>
            {reached && <span className="text-xs text-emerald-500 font-semibold">달성!</span>}
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">오늘 공부</p>
            <p className="text-xl font-bold text-gray-800">{fmtH(todayMs)}</p>
          </div>
          <div className="h-px bg-gray-100" />
          <div>
            <p className="text-xs text-gray-400 mb-0.5">목표</p>
            <p className="text-lg font-semibold text-gray-600">{fmtH(goalMs)}</p>
          </div>
          {!reached && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 rounded-full">
              <TrendingUp size={12} className="text-amber-500" />
              <span className="text-xs text-amber-700 font-medium">{fmtH(remaining)} 남음</span>
            </div>
          )}
          {reached && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 rounded-full">
              <Check size={12} className="text-emerald-500" />
              <span className="text-xs text-emerald-700 font-medium">목표 달성 🎉</span>
            </div>
          )}
        </div>
      </div>

      {/* Subject breakdown bars */}
      {Object.keys(subjectStats).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400 font-medium mb-2">과목별 비교</p>
          {Object.entries(subjectStats)
            .sort((a, b) => b[1] - a[1])
            .map(([subject, ms]) => {
              const pct = Math.min((ms / goalMs) * 100, 100);
              return (
                <div key={subject} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-10 flex-shrink-0 truncate">{subject}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-rose-400 transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right flex-shrink-0">{fmtH(ms)}</span>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
