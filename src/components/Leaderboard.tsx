import React, { useEffect, useState } from 'react';
import { Trophy, RefreshCw } from 'lucide-react';
import { api, LeaderboardEntry } from '../api';

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await api.getLeaderboard();
      setEntries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const formatTime = (ms: number) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}시간 ${m}분`;
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <Trophy className="text-yellow-500 mr-2" /> 랭킹
        </h2>
        <button 
          onClick={fetchLeaderboard} 
          disabled={loading}
          className="p-2 text-gray-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {entries.length === 0 && !loading && (
          <p className="text-center text-gray-500 py-8">아직 기록이 없습니다.</p>
        )}
        {entries.map((entry, idx) => (
          <div 
            key={idx} 
            className={`flex items-center justify-between p-4 rounded-2xl ${
              idx === 0 ? 'bg-yellow-50 border border-yellow-100' :
              idx === 1 ? 'bg-gray-50 border border-gray-200' :
              idx === 2 ? 'bg-orange-50 border border-orange-100' :
              'bg-white border border-gray-100'
            }`}
          >
            <div className="flex items-center space-x-4">
              <span className={`font-bold w-6 text-center ${
                idx === 0 ? 'text-yellow-600 text-lg' :
                idx === 1 ? 'text-gray-600 text-lg' :
                idx === 2 ? 'text-orange-600 text-lg' :
                'text-gray-400'
              }`}>
                {idx + 1}
              </span>
              <span className="font-medium text-gray-800">{entry.nickname}</span>
            </div>
            <span className="text-indigo-600 font-semibold">{formatTime(entry.totalTime)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
