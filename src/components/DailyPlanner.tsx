import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Check, Trash2, ChevronLeft, ChevronRight,
  ClipboardList, Clock, ChevronDown, ChevronUp,
} from 'lucide-react';

interface Task {
  id: string;
  text: string;
  done: boolean;
  category: string;
  createdAt: number;
  goalMinutes?: number;
}

interface DayData { tasks: Task[] }

const STORAGE_KEY = 'dailyPlanner_v1';
const CATEGORIES  = ['공부', '운동', '독서', '기타'];

const CAT_COLOR: Record<string, { bg: string; text: string; dot: string }> = {
  '공부': { bg: 'bg-indigo-50',  text: 'text-indigo-700',  dot: 'bg-indigo-400'  },
  '운동': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  '독서': { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
  '기타': { bg: 'bg-slate-50',   text: 'text-slate-600',   dot: 'bg-slate-400'   },
};
function catColor(cat: string) { return CAT_COLOR[cat] ?? CAT_COLOR['기타']; }

function toDateKey(d: Date) { return d.toISOString().slice(0, 10); }
function loadAll(): Record<string, DayData> {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : {}; }
  catch { return {}; }
}
function saveAll(data: Record<string, DayData>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function fmtDateFull(d: Date) {
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
}
function fmtDateLabel(d: Date) {
  const today = new Date();
  const y = new Date(today); y.setDate(today.getDate() - 1);
  const t = new Date(today); t.setDate(today.getDate() + 1);
  if (toDateKey(d) === toDateKey(today)) return '오늘';
  if (toDateKey(d) === toDateKey(y))     return '어제';
  if (toDateKey(d) === toDateKey(t))     return '내일';
  return '';
}
function fmtGoal(min: number) {
  if (min < 60) return `${min}분`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}시간 ${m}분` : `${h}시간`;
}

const GOAL_PRESETS = [15, 30, 60, 90, 120];

/* ── Goal picker ── */
function GoalPicker({ value, onChange, onClose }: {
  value?: number;
  onChange: (min: number | undefined) => void;
  onClose: () => void;
}) {
  const [h, setH] = useState(value ? String(Math.floor(value / 60)) : '');
  const [m, setM] = useState(value ? String(value % 60) : '');

  const apply = () => {
    const total = (Number(h) || 0) * 60 + (Number(m) || 0);
    onChange(total > 0 ? total : undefined);
    onClose();
  };
  const clear = () => { onChange(undefined); onClose(); };

  return (
    <div className="mt-2 p-3 bg-violet-50 border border-violet-100 rounded-2xl space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {GOAL_PRESETS.map(p => (
          <button key={p} onClick={() => { setH(String(Math.floor(p / 60))); setM(String(p % 60)); }}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              (Number(h) || 0) * 60 + (Number(m) || 0) === p
                ? 'bg-violet-500 text-white'
                : 'bg-white text-violet-600 border border-violet-200 hover:border-violet-400'
            }`}>
            {fmtGoal(p)}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input type="number" min={0} max={23} value={h} onChange={e => setH(e.target.value)}
          placeholder="0" className="w-12 px-2 py-1 text-sm text-center border border-violet-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400" />
        <span className="text-xs text-gray-500">시간</span>
        <input type="number" min={0} max={59} value={m} onChange={e => setM(e.target.value)}
          placeholder="0" className="w-12 px-2 py-1 text-sm text-center border border-violet-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400" />
        <span className="text-xs text-gray-500">분</span>
        <button onClick={apply} className="ml-auto px-3 py-1 bg-violet-500 text-white text-xs rounded-xl hover:bg-violet-600 transition-colors">확인</button>
        {value !== undefined && (
          <button onClick={clear} className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded-xl hover:bg-gray-300 transition-colors">삭제</button>
        )}
      </div>
    </div>
  );
}

/* ── Task row ── */
function TaskRow({ task, onToggle, onDelete, onUpdateGoal }: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onUpdateGoal: (min: number | undefined) => void;
}) {
  const [showGoal, setShowGoal] = useState(false);
  const c = catColor(task.category);

  return (
    <div className={`group rounded-2xl transition-colors ${task.done ? 'opacity-50' : 'hover:bg-gray-50'}`}>
      <div className="flex items-center gap-3 p-3">
        <button onClick={onToggle}
          className={`flex-shrink-0 w-5 h-5 rounded-full border-2 transition-colors flex items-center justify-center ${
            task.done ? 'bg-violet-500 border-violet-500' : 'border-gray-300 hover:border-violet-400'
          }`}>
          {task.done && <Check size={11} className="text-white" strokeWidth={3} />}
        </button>

        <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${c.bg} ${c.text}`}>
          {task.category}
        </span>

        <span className={`flex-1 text-sm leading-snug ${task.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
          {task.text}
        </span>

        {/* Goal badge */}
        <button onClick={() => setShowGoal(v => !v)}
          className={`flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all ${
            task.goalMinutes
              ? 'bg-violet-100 text-violet-700 hover:bg-violet-200'
              : 'text-gray-300 hover:text-violet-500 hover:bg-violet-50'
          }`}>
          <Clock size={11} />
          {task.goalMinutes ? fmtGoal(task.goalMinutes) : '목표'}
          {showGoal ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>

        <button onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-400 transition-all">
          <Trash2 size={14} />
        </button>
      </div>

      {showGoal && (
        <div className="px-3 pb-3">
          <GoalPicker
            value={task.goalMinutes}
            onChange={onUpdateGoal}
            onClose={() => setShowGoal(false)}
          />
        </div>
      )}
    </div>
  );
}

/* ── Main ── */
export function DailyPlanner() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [allData, setAllData]         = useState<Record<string, DayData>>(loadAll);
  const [newText, setNewText]         = useState('');
  const [newCat, setNewCat]           = useState('공부');
  const [filter, setFilter]           = useState('전체');
  const inputRef = useRef<HTMLInputElement>(null);

  const dateKey = toDateKey(currentDate);
  const tasks   = (allData[dateKey] ?? { tasks: [] }).tasks;

  useEffect(() => { saveAll(allData); }, [allData]);

  const updateTasks = (next: Task[]) =>
    setAllData(prev => ({ ...prev, [dateKey]: { tasks: next } }));

  const addTask = () => {
    const text = newText.trim();
    if (!text) return;
    updateTasks([...tasks, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text, done: false, category: newCat, createdAt: Date.now(),
    }]);
    setNewText('');
    inputRef.current?.focus();
  };

  const toggleTask   = (id: string) => updateTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const deleteTask   = (id: string) => updateTasks(tasks.filter(t => t.id !== id));
  const updateGoal   = (id: string, min: number | undefined) =>
    updateTasks(tasks.map(t => t.id === id ? { ...t, goalMinutes: min } : t));
  const clearDone    = () => updateTasks(tasks.filter(t => !t.done));

  const goDay   = (d: number) => { const nd = new Date(currentDate); nd.setDate(nd.getDate() + d); setCurrentDate(nd); };
  const isToday = toDateKey(currentDate) === toDateKey(new Date());
  const label   = fmtDateLabel(currentDate);

  const filtered   = filter === '전체' ? tasks : tasks.filter(t => t.category === filter);
  const pending    = filtered.filter(t => !t.done);
  const done       = filtered.filter(t => t.done);
  const doneCount  = tasks.filter(t => t.done).length;
  const totalCount = tasks.length;
  const progress   = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const totalGoalMin = tasks.reduce((s, t) => s + (t.goalMinutes ?? 0), 0);
  const doneGoalMin  = tasks.filter(t => t.done).reduce((s, t) => s + (t.goalMinutes ?? 0), 0);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList size={20} className="text-violet-500" /> 일일 플래너
          </h2>
          {!isToday && (
            <button onClick={() => setCurrentDate(new Date())}
              className="text-xs px-3 py-1.5 bg-violet-100 text-violet-700 rounded-full font-medium hover:bg-violet-200 transition-colors">
              오늘로
            </button>
          )}
        </div>

        {/* Date nav */}
        <div className="flex items-center justify-between">
          <button onClick={() => goDay(-1)} className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <p className="text-sm font-bold text-gray-800">{fmtDateFull(currentDate)}</p>
            {label && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isToday ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-500'}`}>
                {label}
              </span>
            )}
          </div>
          <button onClick={() => goDay(1)} className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Progress */}
        {totalCount > 0 && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-gray-400">{doneCount}/{totalCount} 완료</span>
              <div className="flex items-center gap-3">
                {totalGoalMin > 0 && (
                  <span className="text-xs text-violet-500 font-medium">
                    {fmtGoal(doneGoalMin)} / {fmtGoal(totalGoalMin)}
                  </span>
                )}
                <span className="text-xs font-bold text-violet-600">{progress}%</span>
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-400 to-violet-600 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Add */}
      <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
        <div className="flex gap-2 mb-2 flex-wrap">
          {CATEGORIES.map(cat => {
            const c = catColor(cat);
            return (
              <button key={cat} onClick={() => setNewCat(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  newCat === cat ? `${c.bg} ${c.text} shadow-sm ring-1 ring-inset` : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />{cat}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <input ref={inputRef} value={newText} onChange={e => setNewText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addTask(); }}
            placeholder="할 일을 입력하세요..."
            className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-shadow" />
          <button onClick={addTask} disabled={!newText.trim()}
            className="px-4 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-1.5 text-sm font-medium">
            <Plus size={16} /> 추가
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="px-6 py-3 flex items-center gap-2 border-b border-gray-50 overflow-x-auto">
        {['전체', ...CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === cat ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}>
            {cat}{cat === '전체' ? ` (${totalCount})` : ` (${tasks.filter(t => t.category === cat).length})`}
          </button>
        ))}
        {doneCount > 0 && (
          <button onClick={clearDone}
            className="ml-auto flex-shrink-0 flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors px-2 py-1.5">
            <Trash2 size={12} /> 완료 삭제
          </button>
        )}
      </div>

      {/* Task list */}
      <div className="px-6 py-4 space-y-1 max-h-[32rem] overflow-y-auto">
        {filtered.length === 0 && (
          <div className="text-center py-10">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-sm text-gray-400">
              {filter === '전체' ? '할 일을 추가해보세요!' : `${filter} 항목이 없습니다.`}
            </p>
          </div>
        )}

        {pending.map(task => (
          <TaskRow key={task.id} task={task}
            onToggle={() => toggleTask(task.id)}
            onDelete={() => deleteTask(task.id)}
            onUpdateGoal={min => updateGoal(task.id, min)} />
        ))}

        {done.length > 0 && pending.length > 0 && (
          <div className="flex items-center gap-2 py-1">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-300 flex-shrink-0">완료됨</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
        )}

        {done.map(task => (
          <TaskRow key={task.id} task={task}
            onToggle={() => toggleTask(task.id)}
            onDelete={() => deleteTask(task.id)}
            onUpdateGoal={min => updateGoal(task.id, min)} />
        ))}
      </div>

      {/* Footer */}
      {totalCount > 0 && (
        <div className="px-6 pb-5">
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => {
              const catTasks = tasks.filter(t => t.category === cat);
              if (!catTasks.length) return null;
              const c = catColor(cat);
              const doneCat  = catTasks.filter(t => t.done).length;
              const goalMin  = catTasks.reduce((s, t) => s + (t.goalMinutes ?? 0), 0);
              return (
                <div key={cat} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${c.bg} ${c.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                  {cat} {doneCat}/{catTasks.length}
                  {goalMin > 0 && <span className="opacity-60">· {fmtGoal(goalMin)}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
