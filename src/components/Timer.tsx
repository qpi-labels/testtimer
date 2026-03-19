import React, { useState, useEffect } from 'react';
import { Play, Square } from 'lucide-react';
import { api, User } from '../api';

interface TimerProps {
  user: User;
}

export function Timer({ user }: TimerProps) {
  const [subject, setSubject] = useState(user.subjects[0] || '기타');
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Sync subject if current list doesn't include it
  useEffect(() => {
    if (!user.subjects.includes(subject)) {
      setSubject(user.subjects[0] || '기타');
    }
  }, [user.subjects]);

  // Load state from localStorage on mount (Recovery)
  useEffect(() => {
    const savedState = localStorage.getItem('timerState');
    if (savedState) {
      const { isRunning: wasRunning, startTime: wasStartTime, subject: wasSubject, uid: wasUid } = JSON.parse(savedState);
      // Only recover if it's the same user
      if (wasUid === user.uid && wasRunning && wasStartTime) {
        setSubject(wasSubject);
        setStartTime(wasStartTime);
        setIsRunning(true);
        setElapsedMs(Date.now() - wasStartTime);
      }
    }
  }, [user.uid]);

  // Timer interval
  useEffect(() => {
    let interval: number;
    if (isRunning && startTime) {
      interval = window.setInterval(() => {
        setElapsedMs(Date.now() - startTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (isRunning) {
      localStorage.setItem('timerState', JSON.stringify({ isRunning, startTime, subject, uid: user.uid }));
    } else {
      localStorage.removeItem('timerState');
    }
  }, [isRunning, startTime, subject, user.uid]);

  const handleStart = async () => {
    const now = Date.now();
    setStartTime(now);
    setIsRunning(true);
    await api.startStudy(user.uid, subject);
  };

  const handleStop = async () => {
    if (!startTime) return;
    const durationMs = elapsedMs;
    
    setIsRunning(false);
    setStartTime(null);
    setElapsedMs(0);
    localStorage.removeItem('timerState');

    if (durationMs < 60000) {
      await api.stopStudy(user.uid, subject, 0); // Just stop without adding time
      alert('1분 미만의 기록은 저장되지 않습니다.');
      return;
    }

    try {
      setIsSaving(true);
      await api.stopStudy(user.uid, subject, durationMs);
      alert('기록이 저장되었습니다!');
    } catch (err: any) {
      alert('저장 실패: ' + err.message);
    } finally {
      setIsSaving(false);
    }
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
      <h2 className="text-xl font-bold text-gray-800 mb-6">공부 타이머</h2>
      
      <div className="w-full max-w-xs mb-8">
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">과목 선택</label>
        <select 
          value={subject} 
          onChange={(e) => setSubject(e.target.value)}
          disabled={isRunning}
          className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-gray-50 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 appearance-none cursor-pointer"
        >
          {user.subjects.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="text-7xl font-mono font-bold text-indigo-600 mb-10 tracking-tighter tabular-nums">
        {formatTime(elapsedMs)}
      </div>

      <div className="flex space-x-4">
        {!isRunning ? (
          <button 
            onClick={handleStart}
            disabled={isSaving}
            className="flex items-center justify-center w-24 h-24 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-200"
          >
            <Play size={40} className="ml-2" />
          </button>
        ) : (
          <button 
            onClick={handleStop}
            className="flex items-center justify-center w-24 h-24 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-200"
          >
            <Square size={36} />
          </button>
        )}
      </div>
      {isSaving && <p className="mt-4 text-sm text-gray-500 animate-pulse">저장 중...</p>}
      {isRunning && (
        <p className="mt-6 text-indigo-600 font-bold flex items-center">
          <span className="w-2 h-2 bg-indigo-600 rounded-full animate-ping mr-2"></span>
          {subject} 공부 중...
        </p>
      )}
    </div>
  );
}
