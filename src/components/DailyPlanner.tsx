import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Check, Trash2, ChevronLeft, ChevronRight,
  ClipboardList, Clock, MoreVertical, X, Link2, Link2Off, Timer,
} from 'lucide-react';


// 스프레드시트 인젝션 방지 + 길이 제한
function sanitize(value: string, maxLen = 10): string {
  let v = value.replace(/[\r\n\t\x00-\x1F\x7F]/g, '');
  v = v.replace(/^[=+\-@/]+/, '');
  return [...v].slice(0, maxLen).join('');
}
export interface Task {
  id: string;
  text: string;
  done: boolean;
  category: string;
  createdAt: number;
  goalMinutes?: number;
  subjectName?: string;  // 연결된 타이머 과목
  actualMs?: number;     // 누적 실제 공부시간 (ms)
}

export interface DayData { tasks: Task[] }

export const PLANNER_STORAGE_KEY = 'dailyPlanner_v1';
const CATEGORIES = ['공부', '운동', '독서', '기타'];

const SUBJECTS_STORAGE_KEY = 'customSubjects_v2';
function loadTimerSubjects(): { emoji: string; name: string }[] {
  try {
    const saved = localStorage.getItem(SUBJECTS_STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (parsed.length && typeof parsed[0] === 'string') return parsed.map((s: string) => ({ emoji: '📚', name: s }));
    return parsed;
  } catch { return []; }
}

const CAT_COLOR: Record<string, { bg: string; text: string; dot: string }> = {
  '공부': { bg: 'bg-indigo-50',  text: 'text-indigo-700',  dot: 'bg-indigo-400'  },
  '운동': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  '독서': { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
  '기타': { bg: 'bg-slate-50',   text: 'text-slate-600',   dot: 'bg-slate-400'   },
};
export function catColor(cat: string) { return CAT_COLOR[cat] ?? CAT_COLOR['기타']; }

export function toDateKey(d: Date) { return d.toISOString().slice(0, 10); }
export function loadAllPlanner(): Record<string, DayData> {
  try { const r = localStorage.getItem(PLANNER_STORAGE_KEY); return r ? JSON.parse(r) : {}; }
  catch { return {}; }
}
function saveAll(data: Record<string, DayData>) {
  localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(data));
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
export function fmtMs(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}시간 ${m}분`;
  if (m > 0) return `${m}분 ${s}초`;
  return `${s}초`;
}

export function fmtGoal(min: number) {
  if (min < 60) return `${min}분`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}시간 ${m}분` : `${h}시간`;
}

const GOAL_PRESETS = [15, 30, 60, 90, 120];

/* ── Goal picker modal ── */
function GoalModal({ value, onSave, onClose }: {
  value?: number;
  onSave: (min: number | undefined) => void;
  onClose: () => void;
}) {
  const [h, setH] = useState(value ? String(Math.floor(value / 60)) : '');
  const [m, setM] = useState(value ? String(value % 60) : '');
  const ref = useRef<HTMLDivElement>(null);

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const apply = () => {
    const total = (Number(h) || 0) * 60 + (Number(m) || 0);
    onSave(total > 0 ? total : undefined);
    onClose();
  };

  const currentVal = (Number(h) || 0) * 60 + (Number(m) || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-sm">
      <div ref={ref}
        className="w-full sm:w-96 bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 animate-[slideUp_0.22s_cubic-bezier(0.4,0,0.2,1)]">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Clock size={16} className="text-violet-500" /> 목표 시간 설정
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2 mb-4">
          {GOAL_PRESETS.map(p => (
            <button key={p}
              onClick={() => { setH(String(Math.floor(p / 60))); setM(String(p % 60 === 0 ? '' : p % 60)); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                currentVal === p
                  ? 'bg-violet-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-violet-100 hover:text-violet-700'
              }`}>
              {fmtGoal(p)}
            </button>
          ))}
        </div>

        {/* Custom input */}
        <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-2xl">
          <div className="flex items-center gap-1.5 flex-1">
            <input type="number" min={0} max={23} value={h}
              onChange={e => setH(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))} placeholder="0"
              className="w-14 px-2 py-2 text-center text-sm font-medium border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400" />
            <span className="text-sm text-gray-500 font-medium">시간</span>
          </div>
          <span className="text-gray-300 font-bold">:</span>
          <div className="flex items-center gap-1.5 flex-1">
            <input type="number" min={0} max={59} value={m}
              onChange={e => setM(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))} placeholder="0"
              className="w-14 px-2 py-2 text-center text-sm font-medium border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400" />
            <span className="text-sm text-gray-500 font-medium">분</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          {value !== undefined && (
            <button onClick={() => { onSave(undefined); onClose(); }}
              className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-2xl text-sm font-medium hover:bg-gray-200 transition-colors">
              목표 삭제
            </button>
          )}
          <button onClick={apply}
            className="flex-1 py-2.5 bg-violet-600 text-white rounded-2xl text-sm font-semibold hover:bg-violet-700 transition-colors shadow-sm">
            {currentVal > 0 ? `${fmtGoal(currentVal)} 설정` : '확인'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Kebab menu ── */

/* ── Subject link modal ── */
function SubjectLinkModal({ current, onSelect, onClose }: {
  current?: string;
  onSelect: (name: string | undefined) => void;
  onClose: () => void;
}) {
  const subjects = loadTimerSubjects();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-sm">
      <div ref={ref} className="w-full sm:w-80 bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Link2 size={15} className="text-blue-500" /> 타이머 과목 연결
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-3">선택한 과목으로 타이머를 돌리면 이 할 일에 자동으로 시간이 누적됩니다.</p>
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {subjects.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">타이머에 과목을 먼저 추가해주세요.</p>
          )}
          {subjects.map(s => (
            <button key={s.name} onClick={() => { onSelect(s.name); onClose(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                current === s.name ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-gray-50 text-gray-700'
              }`}>
              <span className="tossface text-base">{s.emoji}</span>
              <span>{s.name}</span>
              {current === s.name && <span className="ml-auto text-xs text-blue-400">연결됨</span>}
            </button>
          ))}
        </div>
        {current && (
          <button onClick={() => { onSelect(undefined); onClose(); }}
            className="mt-3 w-full py-2 text-sm text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center gap-1.5">
            <Link2Off size={13} /> 연결 해제
          </button>
        )}
      </div>
    </div>
  );
}

function KebabMenu({ onEditGoal, onDelete, onLinkSubject, hasGoal, linkedSubject }: {
  onEditGoal: () => void;
  onDelete: () => void;
  onLinkSubject: () => void;
  hasGoal: boolean;
  linkedSubject?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className="p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100"
      >
        <MoreVertical size={15} />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-30 w-40 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 overflow-hidden
          animate-[fadeIn_0.15s_cubic-bezier(0.4,0,0.2,1)]">
          <button
            onClick={() => { setOpen(false); onEditGoal(); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors"
          >
            <Clock size={14} className="text-violet-400" />
            {hasGoal ? '목표 시간 수정' : '목표 시간 설정'}
          </button>
          <button
            onClick={() => { setOpen(false); onLinkSubject(); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            {linkedSubject ? <Link2Off size={14} className="text-blue-400" /> : <Link2 size={14} className="text-blue-400" />}
            {linkedSubject ? `연결 해제 (${linkedSubject})` : '타이머 과목 연결'}
          </button>
          <div className="my-1 h-px bg-gray-100 mx-2" />
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
            삭제
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Task row ── */
function TaskRow({ task, onToggle, onDelete, onUpdateGoal, onUpdateSubject, liveMs }: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onUpdateGoal: (min: number | undefined) => void;
  onUpdateSubject: (name: string | undefined) => void;
  liveMs?: number; // 실시간 경과 (해당 과목 타이머 실행 중일 때)
}) {
  const [showGoalModal, setShowGoalModal]   = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const c = catColor(task.category);

  const totalActualMs = (task.actualMs || 0) + (liveMs || 0);
  const goalMs = task.goalMinutes ? task.goalMinutes * 60000 : 0;
  const progress = goalMs > 0 ? Math.min((totalActualMs / goalMs) * 100, 100) : 0;

  return (
    <>
      <div className={`group rounded-2xl transition-colors ${task.done ? 'opacity-50' : 'hover:bg-gray-50'}`}>
        <div className="flex items-center gap-3 p-3">
          {/* Checkbox */}
          <button onClick={onToggle}
            className={`flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${
              task.done ? 'bg-violet-500 border-violet-500' : 'border-gray-300 hover:border-violet-400'
            }`}>
            {task.done && <Check size={11} className="text-white" strokeWidth={3} />}
          </button>

          {/* Category chip */}
          <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${c.bg} ${c.text}`}>
            {task.category}
          </span>

          {/* Text */}
          <span className={`flex-1 text-sm leading-snug min-w-0 truncate ${task.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
            {task.text}
          </span>

          {/* Subject tag */}
          {task.subjectName && (
            <span className={`flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              liveMs ? 'bg-green-100 text-green-700 animate-pulse' : 'bg-blue-50 text-blue-600'
            }`}>
              <Timer size={9} />{task.subjectName}
            </span>
          )}

          {/* Time badges */}
          {task.goalMinutes && (
            <span className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs font-medium">
              <Clock size={10} />
              {totalActualMs > 0 ? `${fmtMs(totalActualMs)} / ` : ''}{fmtGoal(task.goalMinutes)}
            </span>
          )}
          {!task.goalMinutes && totalActualMs > 0 && (
            <span className={`flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              liveMs ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              <Clock size={10} />{fmtMs(totalActualMs)}
            </span>
          )}

          {/* Kebab */}
          <KebabMenu
            hasGoal={!!task.goalMinutes}
            linkedSubject={task.subjectName}
            onEditGoal={() => setShowGoalModal(true)}
            onLinkSubject={() => setShowSubjectModal(true)}
            onDelete={onDelete}
          />
        </div>

        {/* Progress bar (목표시간 있고 실제시간 있을 때) */}
        {goalMs > 0 && totalActualMs > 0 && (
          <div className="mx-3 mb-2 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${
              progress >= 100 ? 'bg-emerald-400' : liveMs ? 'bg-green-400' : 'bg-violet-400'
            }`} style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {showGoalModal && (
        <GoalModal value={task.goalMinutes} onSave={onUpdateGoal} onClose={() => setShowGoalModal(false)} />
      )}
      {showSubjectModal && (
        <SubjectLinkModal current={task.subjectName} onSelect={onUpdateSubject} onClose={() => setShowSubjectModal(false)} />
      )}
    </>
  );
}

/* ── Main DailyPlanner ── */
export interface DailyPlannerProps {
  timerElapsed?: { ms: number; subject: string };
}

export function DailyPlanner({ timerElapsed }: DailyPlannerProps = {}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [allData, setAllData]         = useState<Record<string, DayData>>(loadAllPlanner);
  const [newText, setNewText]         = useState('');
  const [newCat, setNewCat]           = useState('공부');
  const [filter, setFilter]           = useState('전체');
  const inputRef = useRef<HTMLInputElement>(null);

  const dateKey = toDateKey(currentDate);
  const tasks   = (allData[dateKey] ?? { tasks: [] }).tasks;

  useEffect(() => { saveAll(allData); }, [allData]);

  // 타이머 elapsed 변화 감지 → 실제 시간 누적
  const prevElapsed = useRef<{ ms: number; subject: string }>({ ms: 0, subject: '' });
  useEffect(() => {
    const prev = prevElapsed.current;
    const curr = timerElapsed || { ms: 0, subject: '' };
    // elapsed가 0으로 리셋됐고 이전에 실행 중이었으면 → 시간 커밋
    if (prev.ms > 0 && curr.ms === 0 && prev.subject) {
      updateTasks(tasks.map(t =>
        t.subjectName === prev.subject
          ? { ...t, actualMs: (t.actualMs || 0) + prev.ms }
          : t
      ));
    }
    prevElapsed.current = curr;
  }, [timerElapsed]);

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

  const toggleTask  = (id: string) => updateTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const deleteTask  = (id: string) => updateTasks(tasks.filter(t => t.id !== id));
  const updateGoal  = (id: string, min: number | undefined) =>
    updateTasks(tasks.map(t => t.id === id ? { ...t, goalMinutes: min } : t));
  const clearDone   = () => updateTasks(tasks.filter(t => !t.done));

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

      {/* Add task */}
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
          <input ref={inputRef} value={newText} onChange={e => setNewText(sanitize(e.target.value, 10))}
            onKeyDown={e => { if (e.key === 'Enter') addTask(); }}
            maxLength={15} placeholder="할 일을 입력하세요... (10자)"
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
            <p className="text-3xl mb-2 tossface">📋</p>
            <p className="text-sm text-gray-400">
              {filter === '전체' ? '할 일을 추가해보세요!' : `${filter} 항목이 없습니다.`}
            </p>
          </div>
        )}

        {pending.map(task => (
          <TaskRow key={task.id} task={task}
            onToggle={() => toggleTask(task.id)}
            onDelete={() => deleteTask(task.id)}
            onUpdateGoal={min => updateGoal(task.id, min)}
            onUpdateSubject={name => updateSubject(task.id, name)}
            liveMs={
              timerElapsed && task.subjectName === timerElapsed.subject && timerElapsed.ms > 0
                ? timerElapsed.ms : undefined
            } />
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
            onUpdateGoal={min => updateGoal(task.id, min)}
            onUpdateSubject={name => updateSubject(task.id, name)}
            liveMs={undefined} />
        ))}
      </div>

      {/* Footer summary */}
      {totalCount > 0 && (
        <div className="px-6 pb-5">
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => {
              const ct = tasks.filter(t => t.category === cat);
              if (!ct.length) return null;
              const c = catColor(cat);
              const dc = ct.filter(t => t.done).length;
              const gm = ct.reduce((s, t) => s + (t.goalMinutes ?? 0), 0);
              return (
                <div key={cat} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${c.bg} ${c.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                  {cat} {dc}/{ct.length}
                  {gm > 0 && <span className="opacity-60">· {fmtGoal(gm)}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

