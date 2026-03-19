import React, { useState, useEffect } from 'react';
import { Play, Square, Loader2, Plus } from 'lucide-react';
import { api, User, Subject } from '../api';

interface TimerProps {
  user: User;
  onLogAdded: (totalTime: number) => void;
}

export function Timer({ user, onLogAdded }: TimerProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  // Load subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const data = await api.getSubjects(user.uid);
        setSubjects(data);
        if (data.length > 0) {
          setSelectedSubjectId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch subjects:', err);
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, [user.uid]);

  // Load state from localStorage on mount (Recovery)
  useEffect(() => {
    const savedState = localStorage.getItem('timerState');
    if (savedState) {
      const { isRunning, startTime, subjectId } = JSON.parse(savedState);
      if (isRunning && startTime) {
        setSelectedSubjectId(subjectId);
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
    if (isRunning && startTime) {
      localStorage.setItem('timerState', JSON.stringify({ isRunning, startTime, subjectId: selectedSubjectId }));
    } else {
      localStorage.removeItem('timerState');
    }
  }, [isRunning, startTime, selectedSubjectId]);

  const handleStart = async () => {
    if (!selectedSubjectId) {
      alert('공부할 과목을 선택해주세요. 과목이 없다면 설정에서 추가할 수 있습니다.');
      return;
    }
    
    try {
      await api.updateStudyStatus(user.uid, true, selectedSubjectId);
      setStartTime(Date.now());
      setIsRunning(true);
    } catch (err: any) {
      alert('시작 실패: ' + err.message);
    }
  };

  const handleStop = async () => {
    if (!startTime) return;
    const endTime = Date.now();
    const durationMs = endTime - startTime;
    const selectedSubject = subjects.find(s => s.id === selectedSubjectId);
    
    if (!selectedSubject) return;

    setIsRunning(false);
    setStartTime(null);
    setElapsedMs(0);
    localStorage.removeItem('timerState');

    if (durationMs < 60000) {
      await api.updateStudyStatus(user.uid, false);
      alert('1분 미만의 기록은 저장되지 않습니다.');
      return;
    }

    try {
      setIsSaving(true);
      const newTotal = await api.addLog(user.uid, selectedSubject, startTime, endTime);
      onLogAdded(newTotal);
      alert('기록이 저장되었습니다!');
    } catch (err: any) {
      alert('저장 실패: ' + err.message);
      // If saving failed, still update status to not studying
      await api.updateStudyStatus(user.uid, false);
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

  if (loadingSubjects) {
    return (
      <div className="flex flex-col items-center p-12 bg-white rounded-3xl shadow-sm border border-gray-100">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <p className="mt-4 text-gray-500">과목 정보를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-8 bg-white rounded-3xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-6">타이머</h2>
      
      {subjects.length === 0 ? (
        <div className="text-center mb-8">
          <p className="text-gray-500 mb-4">추가된 과목이 없습니다.</p>
          <p className="text-sm text-indigo-600 font-medium">설정 탭에서 과목을 추가해주세요!</p>
        </div>
      ) : (
        <select 
          value={selectedSubjectId} 
          onChange={(e) => setSelectedSubjectId(e.target.value)}
          disabled={isRunning}
          className="mb-8 px-6 py-3 border border-gray-200 rounded-2xl bg-gray-50 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 appearance-none text-center min-w-[200px]"
        >
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      )}

      <div className="text-7xl font-mono font-bold text-indigo-600 mb-10 tracking-tight">
        {formatTime(elapsedMs)}
      </div>

      <div className="flex space-x-4">
        {!isRunning ? (
          <button 
            onClick={handleStart}
            disabled={isSaving || subjects.length === 0}
            className="flex items-center justify-center w-24 h-24 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play size={40} className="ml-2" />
          </button>
        ) : (
          <button 
            onClick={handleStop}
            className="flex items-center justify-center w-24 h-24 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all active:scale-95 shadow-lg"
          >
            <Square size={32} />
          </button>
        )}
      </div>
      {isSaving && (
        <div className="mt-6 flex items-center text-indigo-600 font-medium animate-pulse">
          <Loader2 className="animate-spin mr-2" size={18} />
          기록 저장 중...
        </div>
      )}
    </div>
  );
}
