import React, { useEffect, useState } from 'react';
import { Trophy, Loader2 } from 'lucide-react';
import { api, LeaderboardEntry } from '../api';

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = api.subscribeLeaderboard((data) => {
      setEntries(data);
      setLoading(false);
    });
    return () => unsubscribe();
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
        {loading && <Loader2 size={20} className="animate-spin text-gray-400" />}
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {entries.length === 0 && !loading && (
          <p className="text-center text-gray-500 py-8">아직 기록이 없습니다.</p>
        )}
        {entries.map((entry, idx) => (
          <div 
            key={entry.uid} 
            className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
              idx === 0 ? 'bg-yellow-50 border border-yellow-100' :
              idx === 1 ? 'bg-gray-50 border border-gray-200' :
              idx === 2 ? 'bg-orange-50 border border-orange-100' :
              'bg-white border border-gray-100'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className={`font-bold w-6 text-center ${
                idx === 0 ? 'text-yellow-600 text-lg' :
                idx === 1 ? 'text-gray-600 text-lg' :
                idx === 2 ? 'text-orange-600 text-lg' :
                'text-gray-400'
              }`}>
                {idx + 1}
              </span>
              <div className="flex flex-col">
                <div className="flex items-center">
                  <span className="font-medium text-gray-800">{entry.nickname}</span>
                  {entry.isStudying && (
                    <span className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" title="공부 중"></span>
                  )}
                </div>
              </div>
            </div>
            <span className="text-indigo-600 font-semibold text-sm">{formatTime(entry.totalTime)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
