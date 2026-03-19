import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Plus, X } from 'lucide-react';
import { api } from '../api';

interface TimerProps {
  token: string;
  nickname: string;
  grade?: number;
  onLogAdded: (totalTime: number, subjectStats: Record<string, number>) => void;
}

interface Subject {
  emoji: string;
  name: string;
}


// 스프레드시트 인젝션 방지 + 길이 제한
function sanitize(value: string, maxLen = 10): string {
  let v = value.replace(/[\r\n\t\x00-\x1F\x7F]/g, '');
  v = v.replace(/^[=+\-@/]+/, '');
  return [...v].slice(0, maxLen).join('');
}
const DEFAULT_SUBJECTS: Subject[] = [
  { emoji: '📖', name: '국어' },
  { emoji: '📐', name: '수학' },
  { emoji: '✏️', name: '영어' },
  { emoji: '🔬', name: '탐구' },
  { emoji: '📝', name: '기타' },
];
const STORAGE_KEY = 'customSubjects_v2';

function loadSubjects(): Subject[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_SUBJECTS;
    const parsed = JSON.parse(saved);
    // 구버전 string[] 포맷 마이그레이션
    if (parsed.length && typeof parsed[0] === 'string') {
      return parsed.map((s: string) => ({ emoji: '📚', name: s }));
    }
    return parsed;
  } catch { return DEFAULT_SUBJECTS; }
}

export function Timer({ token, nickname, grade, onLogAdded }: TimerProps) {
  const [subjects, setSubjects]     = useState<Subject[]>(loadSubjects);
  const [subject, setSubject]       = useState<Subject>(subjects[0] || DEFAULT_SUBJECTS[0]);
  const [isRunning, setIsRunning]   = useState(false);
  const [startTime, setStartTime]   = useState<number | null>(null);
  const [elapsedMs, setElapsedMs]   = useState(0);
  const [isSaving, setIsSaving]     = useState(false);
  const [showAdd, setShowAdd]       = useState(false);
  const [newEmoji, setNewEmoji]     = useState('📚');
  const [newName, setNewName]       = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Restore timer state
  useEffect(() => {
    const saved = localStorage.getItem('timerState');
    if (saved) {
      const { isRunning, startTime, subjectName } = JSON.parse(saved);
      if (isRunning && startTime) {
        const found = subjects.find(s => s.name === subjectName);
        if (found) setSubject(found);
        setStartTime(startTime);
        setIsRunning(true);
        setElapsedMs(Date.now() - startTime);
      }
    }
  }, []);

  useEffect(() => {
    let interval: number;
    if (isRunning && startTime) {
      interval = window.setInterval(() => setElapsedMs(Date.now() - startTime), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  useEffect(() => {
    localStorage.setItem('timerState', JSON.stringify({ isRunning, startTime, subjectName: subject.name }));
  }, [isRunning, startTime, subject]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
  }, [subjects]);

  const handleStart = async () => {
    const now = Date.now();
    setStartTime(now);
    setIsRunning(true);
    try { await api.setActive(token, subject.name, subject.emoji, now, nickname, grade); } catch {}
  };

  const handleStop = async () => {
    if (!startTime) return;
    const endTime = Date.now();
    const durationMs = endTime - startTime;

    setIsRunning(false);
    setStartTime(null);
    setElapsedMs(0);
    localStorage.removeItem('timerState');

    try { await api.setActive(token, subject.name, subject.emoji, null); } catch {}

    if (durationMs < 60000) { alert('1분 미만의 기록은 저장되지 않습니다.'); return; }
    if (durationMs > 7 * 60 * 60 * 1000) { alert('부정행위 방지: 7시간을 초과하는 기록은 저장되지 않습니다.'); return; }

    try {
      setIsSaving(true);
      const result = await api.addLog(token, subject.name, startTime, endTime);
      onLogAdded(result.totalTime, result.subjectStats);
      alert('기록이 저장되었습니다!');
    } catch (err: any) {
      alert('저장 실패: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const openAdd = () => {
    setNewEmoji('📚');
    setNewName('');
    setShowAdd(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  const addSubject = () => {
    const name = newName.trim();
    if (!name) return;
    if (subjects.some(s => s.name === name)) { alert('이미 있는 과목입니다.'); return; }
    const ns: Subject = { emoji: newEmoji, name };
    setSubjects(prev => [...prev, ns]);
    setSubject(ns);
    setShowAdd(false);
  };

  const removeSubject = (name: string) => {
    if (isRunning) return;
    const next = subjects.filter(s => s.name !== name);
    const safe = next.length ? next : DEFAULT_SUBJECTS;
    setSubjects(safe);
    if (subject.name === name) setSubject(safe[0]);
  };

  const fmt = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${String(Math.floor(s / 3600)).padStart(2,'0')}:${String(Math.floor((s % 3600) / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-3xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-5">타이머</h2>

      {/* Subject chips */}
      <div className="w-full mb-6">
        <div className="flex flex-wrap gap-2 mb-3">
          {subjects.map(s => (
            <div
              key={s.name}
              onClick={() => !isRunning && setSubject(s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer select-none
                ${subject.name === s.name
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } ${isRunning && subject.name !== s.name ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <span>{s.emoji}</span>
              <span>{s.name}</span>
              {!isRunning && (
                <button
                  onClick={e => { e.stopPropagation(); removeSubject(s.name); }}
                  className="ml-0.5 rounded-full hover:bg-white/30 p-0.5"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          ))}

          {!isRunning && !showAdd && (
            <button
              onClick={openAdd}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border-2 border-dashed border-gray-300 text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
            >
              <Plus size={13} /> 추가
            </button>
          )}
        </div>

        {/* Inline add form */}
        {showAdd && !isRunning && (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-2 space-y-3">
            {/* Emoji input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-gray-400 font-medium">이모지</p>
                <p className="text-[11px] text-gray-300">
                  <span className="font-semibold text-gray-400">Win</span> + .&nbsp;&nbsp;
                  <span className="font-semibold text-gray-400">Mac</span> ⌘+Ctrl+Space&nbsp;&nbsp;
                  모바일은 이모지 키보드
                </p>
              </div>
              <input
                type="text"
                value={newEmoji}
                onChange={e => {
                  // 제어문자·스프레드시트 함수 문자 차단
                  const raw = e.target.value.replace(/[\r\n\t\x00-\x1F\x7F=+\-@/]/g, '');
                  const chars = [...raw];
                  const val = chars.slice(-2).join('');
                  if (val) setNewEmoji(val);
                }}
                placeholder="😀"
                className="w-full px-4 py-2.5 text-2xl text-center bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-shadow"
              />
            </div>

            {/* Name input */}
            <div>
              <p className="text-xs text-gray-400 mb-1.5 font-medium">과목 이름</p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-transparent transition-all">
                  <span className="text-base flex-shrink-0">{newEmoji}</span>
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={newName}
                    onChange={e => setNewName(sanitize(e.target.value, 10))}
                    onKeyDown={e => {
                      if (e.key === 'Enter') addSubject();
                      if (e.key === 'Escape') setShowAdd(false);
                    }}
                    maxLength={15} placeholder="과목명 입력"
                    className="flex-1 text-sm text-gray-700 outline-none bg-transparent"
                  />
                </div>
                <button
                  onClick={addSubject}
                  disabled={!newName.trim()}
                  className="px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                >
                  추가
                </button>
                <button
                  onClick={() => setShowAdd(false)}
                  className="px-3 py-2 bg-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-300 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400">
          선택된 과목: <span className="font-semibold text-indigo-600">{subject.emoji} {subject.name}</span>
        </p>
      </div>

      {/* Timer display */}
      <div className={`text-6xl font-mono font-bold mb-10 tracking-tight transition-colors ${isRunning ? 'text-indigo-600' : 'text-gray-300'}`}>
        {fmt(elapsedMs)}
      </div>

      {/* Controls */}
      <div className="flex space-x-4">
        {!isRunning ? (
          <button
            onClick={handleStart}
            disabled={isSaving}
            className="flex items-center justify-center w-20 h-20 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-transform active:scale-95 shadow-md"
          >
            <Play size={32} className="ml-2" />
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="flex items-center justify-center w-20 h-20 bg-red-500 text-white rounded-full hover:bg-red-600 transition-transform active:scale-95 shadow-md"
          >
            <Square size={28} />
          </button>
        )}
      </div>

      {isSaving && <p className="mt-4 text-sm text-gray-500 animate-pulse">저장 중...</p>}
    </div>
  );
}
