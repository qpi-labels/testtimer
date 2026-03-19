import React, { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { api, LeaderboardEntry } from '../api';

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = api.onLeaderboardUpdate((data) => {
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
          <Trophy className="text-yellow-500 mr-2" /> 실시간 랭킹
        </h2>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : entries.length === 0 ? (
          <p className="text-center text-gray-500 py-8">아직 기록이 없습니다.</p>
        ) : (
          entries.map((entry, idx) => (
            <div 
              key={entry.uid} 
              className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                idx === 0 ? 'bg-yellow-50 border border-yellow-200 shadow-sm' :
                idx === 1 ? 'bg-slate-50 border border-slate-200' :
                idx === 2 ? 'bg-orange-50 border border-orange-200' :
                'bg-white border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <span className={`font-black w-6 text-center inline-block ${
                    idx === 0 ? 'text-yellow-600 text-xl' :
                    idx === 1 ? 'text-slate-500 text-lg' :
                    idx === 2 ? 'text-orange-600 text-lg' :
                    'text-gray-300'
                  }`}>
                    {idx + 1}
                  </span>
                  {entry.isStudying && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse border border-white"></span>
                  )}
                </div>
                <div>
                  <span className="font-bold text-gray-800 block leading-tight">{entry.nickname}</span>
                  {entry.isStudying && (
                    <span className="text-[10px] text-green-600 font-bold uppercase tracking-tighter">Studying {entry.currentSubject}</span>
                  )}
                </div>
              </div>
              <span className="text-indigo-600 font-bold tabular-nums">{formatTime(entry.totalTime)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
