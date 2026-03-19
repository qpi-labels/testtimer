import React, { useEffect, useState } from 'react';
import { Zap, RefreshCw } from 'lucide-react';
import { api, ActiveUser } from '../api';

function formatElapsed(startTime: number) {
  const ms = Date.now() - startTime;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}시간 ${m}분`;
  if (m > 0) return `${m}분 ${s}초`;
  return `${s}초`;
}

const SUBJECT_EMOJI: Record<string, string> = {
  '국어': '📖',
  '수학': '📐',
  '영어': '✏️',
  '탐구': '🔬',
  '기타': '📝',
};

function getEmoji(subject: string) {
  return SUBJECT_EMOJI[subject] || '📚';
}

export function ActiveUsers() {
  const [users, setUsers] = useState<ActiveUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getActiveUsers();
      setUsers(data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchUsers();
    const refresh = setInterval(fetchUsers, 30000);
    return () => clearInterval(refresh);
  }, []);

  // Tick every second to update elapsed times
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          지금 공부 중
          <span className="text-sm font-normal text-gray-400">({users.length}명)</span>
        </h2>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="p-2 text-gray-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {users.length === 0 && !loading && (
          <p className="text-center text-gray-400 py-6 text-sm">지금 공부 중인 사람이 없습니다.</p>
        )}
        {users.map((u, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getEmoji(u.subject)}</span>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{u.nickname}</p>
                <p className="text-xs text-green-600 font-medium">{u.subject}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono font-bold text-green-700">{formatElapsed(u.startTime)}</p>
              <p className="text-xs text-gray-400">집중 중</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
