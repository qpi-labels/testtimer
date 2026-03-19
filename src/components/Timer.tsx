import React, { useState, useEffect } from 'react';
import { Play, Square, Plus, X, BookOpen } from 'lucide-react';
import { api } from '../api';

interface TimerProps {
  token: string;
  onLogAdded: (totalTime: number, subjectStats: Record<string, number>) => void;
}

const DEFAULT_SUBJECTS = ['국어', '수학', '영어', '탐구', '기타'];
const STORAGE_KEY_SUBJECTS = 'customSubjects';

export function Timer({ token, onLogAdded }: TimerProps) {
  const [subjects, setSubjects] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SUBJECTS);
      return saved ? JSON.parse(saved) : DEFAULT_SUBJECTS;
    } catch { return DEFAULT_SUBJECTS; }
  });
  const [subject, setSubject] = useState(subjects[0] || '기타');
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [showAddSubject, setShowAddSubject] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem('timerState');
    if (savedState) {
      const { isRunning, startTime, subject } = JSON.parse(savedState);
      if (isRunning && startTime) {
        setSubject(subject);
        setStartTime(startTime);
        setIsRunning(true);
        setElapsedMs(Date.now() - startTime);
      }
    }
  }, []);

  useEffect(() => {
    let interval: number;
    if (isRunning && startTime) {
      interval = window.setInterval(() => {
        setElapsedMs(Date.now() - startTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  useEffect(() => {
    localStorage.setItem('timerState', JSON.stringify({ isRunning, startTime, subject }));
  }, [isRunning, startTime, subject]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SUBJECTS, JSON.stringify(subjects));
  }, [subjects]);

  const handleStart = async () => {
    const now = Date.now();
    setStartTime(now);
    setIsRunning(true);
    try { await api.setActive(token, subject, now); } catch {}
  };

  const handleStop = async () => {
    if (!startTime) return;
    const endTime = Date.now();
    const durationMs = endTime - startTime;

    setIsRunning(false);
    setStartTime(null);
    setElapsedMs(0);
    localStorage.removeItem('timerState');

    try { await api.setActive(token, subject, null); } catch {}

    if (durationMs < 60000) {
      alert('1분 미만의 기록은 저장되지 않습니다.');
      return;
    }
    if (durationMs > 7 * 60 * 60 * 1000) {
      alert('부정행위 방지: 7시간을 초과하는 기록은 저장되지 않습니다.');
      return;
    }

    try {
      setIsSaving(true);
      const result = await api.addLog(token, subject, startTime, endTime);
      onLogAdded(result.totalTime, result.subjectStats);
      alert('기록이 저장되었습니다!');
    } catch (err: any) {
      alert('저장 실패: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const addSubject = () => {
    const trimmed = newSubject.trim();
    if (!trimmed) return;
    if (subjects.includes(trimmed)) { alert('이미 있는 과목입니다.'); return; }
    setSubjects(prev => [...prev, trimmed]);
    setSubject(trimmed);
    setNewSubject('');
    setShowAddSubject(false);
  };

  const removeSubject = (s: string) => {
    if (isRunning) return;
    const next = subjects.filter(x => x !== s);
    setSubjects(next.length ? next : DEFAULT_SUBJECTS);
    if (subject === s) setSubject(next[0] || '기타');
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-3xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-5">타이머</h2>

      {/* Subject chips */}
      <div className="w-full mb-6">
        <div className="flex flex-wrap gap-2 mb-2">
          {subjects.map(s => (
            <div key={s} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer select-none
              ${subject === s
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } ${isRunning && subject !== s ? 'opacity-40 cursor-not-allowed' : ''}`}
              onClick={() => !isRunning && setSubject(s)}
            >
              {s}
              {!isRunning && (
                <button
                  onClick={e => { e.stopPropagation(); removeSubject(s); }}
                  className="ml-0.5 rounded-full hover:bg-white/30 p-0.5"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          ))}

          {!isRunning && (
            showAddSubject ? (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addSubject(); if (e.key === 'Escape') setShowAddSubject(false); }}
                  className="w-24 px-2 py-1 text-sm border border-indigo-300 rounded-full outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="과목명"
                />
                <button onClick={addSubject} className="px-2 py-1 text-xs bg-indigo-600 text-white rounded-full">추가</button>
                <button onClick={() => setShowAddSubject(false)} className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded-full">취소</button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddSubject(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-dashed border-2 border-dashed border-gray-300 text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
              >
                <Plus size={13} /> 추가
              </button>
            )
          )}
        </div>
        <p className="text-xs text-gray-400">선택된 과목: <span className="font-semibold text-indigo-600">{subject}</span></p>
      </div>

      <div className={`text-6xl font-mono font-bold mb-10 tracking-tight transition-colors ${isRunning ? 'text-indigo-600' : 'text-gray-300'}`}>
        {formatTime(elapsedMs)}
      </div>

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
