import React, { useState, useEffect } from 'react';
import { Play, Square, Save } from 'lucide-react';
import { api } from '../api';

interface TimerProps {
  token: string;
  onLogAdded: (totalTime: number) => void;
}

export function Timer({ token, onLogAdded }: TimerProps) {
  const [subject, setSubject] = useState('수학');
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Load state from localStorage on mount (Recovery)
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
    localStorage.setItem('timerState', JSON.stringify({ isRunning, startTime, subject }));
  }, [isRunning, startTime, subject]);

  const handleStart = () => {
    setStartTime(Date.now());
    setIsRunning(true);
  };

  const handleStop = async () => {
    if (!startTime) return;
    const endTime = Date.now();
    const durationMs = endTime - startTime;
    
    setIsRunning(false);
    setStartTime(null);
    setElapsedMs(0);
    localStorage.removeItem('timerState');

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
      const newTotal = await api.addLog(token, subject, startTime, endTime);
      onLogAdded(newTotal);
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
      <h2 className="text-xl font-bold text-gray-800 mb-6">타이머</h2>
      
      <select 
        value={subject} 
        onChange={(e) => setSubject(e.target.value)}
        disabled={isRunning}
        className="mb-8 px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        <option value="국어">국어</option>
        <option value="수학">수학</option>
        <option value="영어">영어</option>
        <option value="탐구">탐구</option>
        <option value="기타">기타</option>
      </select>

      <div className="text-6xl font-mono font-bold text-indigo-600 mb-10 tracking-tight">
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
