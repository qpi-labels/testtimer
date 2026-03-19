import React, { useEffect, useState } from 'react';
import { Trophy, RefreshCw } from 'lucide-react';
import { api, LeaderboardEntry } from '../api';

type Period = 'daily' | 'weekly' | 'monthly';

const PERIOD_LABELS: Record<Period, string> = {
  daily:   '일간',
  weekly:  '주간',
  monthly: '월간',
};

export function Leaderboard() {
  const [period, setPeriod]   = useState<Period>('weekly');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async (p: Period) => {
    setLoading(true);
    try {
      const data = await api.getLeaderboard(p);
      setEntries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaderboard(period); }, [period]);

  const formatTime = (ms: number) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (h === 0) return `${m}분`;
    if (m === 0) return `${h}시간`;
    return `${h}시간 ${m}분`;
  };

  const medalColor = (idx: number) => {
    if (idx === 0) return { wrap: 'bg-yellow-50 border-yellow-100', rank: 'text-yellow-600' };
    if (idx === 1) return { wrap: 'bg-gray-50 border-gray-200',     rank: 'text-gray-500'   };
    if (idx === 2) return { wrap: 'bg-orange-50 border-orange-100', rank: 'text-orange-500' };
    return           { wrap: 'bg-white border-gray-100',            rank: 'text-gray-400'   };
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <Trophy className="text-yellow-500 mr-2" size={20} /> 랭킹
        </h2>
        <button
          onClick={() => fetchLeaderboard(period)}
          disabled={loading}
          className="p-2 text-gray-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Period tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-4">
        {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
              period === p
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {entries.length === 0 && !loading && (
          <p className="text-center text-gray-400 py-8 text-sm">
            {PERIOD_LABELS[period]} 기록이 없습니다.
          </p>
        )}
        {entries.map((entry, idx) => {
          const { wrap, rank } = medalColor(idx);
          return (
            <div key={idx}
              className={`flex items-center justify-between p-3 rounded-2xl border ${wrap}`}>
              <div className="flex items-center gap-3">
                <span className={`font-bold w-6 text-center text-sm ${rank}`}>
                  {idx < 3 ? ['🥇','🥈','🥉'][idx] : idx + 1}
                </span>
                <span className="font-medium text-gray-800 text-sm">{entry.nickname}</span>
                {entry.grade && (
                  <span className="text-[10px] font-bold text-gray-400">{entry.grade}학년</span>
                )}
              </div>
              <span className="text-indigo-600 font-semibold text-sm">
                {formatTime(entry.totalTime)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
