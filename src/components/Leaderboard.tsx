import React, { useEffect, useState, useRef } from 'react';
import { Trophy, RefreshCw } from 'lucide-react';
import { api, LeaderboardEntry } from '../api';

type Period = 'daily' | 'weekly' | 'monthly';

const PERIODS: Period[] = ['daily', 'weekly', 'monthly'];
const PERIOD_LABELS: Record<Period, string> = {
  daily:   '일간',
  weekly:  '주간',
  monthly: '월간',
};

export function Leaderboard() {
  const [period, setPeriod]   = useState<Period>('daily');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Animated pill
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs      = useRef<(HTMLButtonElement | null)[]>([]);
  const [pill, setPill]       = useState({ left: 0, width: 0 });
  const initialized            = useRef(false);

  useEffect(() => {
    const idx  = PERIODS.indexOf(period);
    const btn  = btnRefs.current[idx];
    const cont = containerRef.current;
    if (!btn || !cont) return;
    const br = btn.getBoundingClientRect();
    const cr = cont.getBoundingClientRect();
    setPill({ left: br.left - cr.left, width: br.width });
    initialized.current = true;
  }, [period]);

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

      {/* Period tabs — animated pill */}
      <div
        ref={containerRef}
        className="relative flex gap-0 bg-gray-100 p-1 rounded-xl mb-4"
      >
        {/* sliding pill */}
        <span
          className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm pointer-events-none"
          style={{
            left:  pill.left,
            width: pill.width,
            transition: initialized.current
              ? 'left 0.3s cubic-bezier(0.4,0,0.2,1), width 0.3s cubic-bezier(0.4,0,0.2,1)'
              : 'none',
          }}
        />
        {PERIODS.map((p, i) => (
          <button
            key={p}
            ref={el => { btnRefs.current[i] = el; }}
            onClick={() => setPeriod(p)}
            className={`relative z-10 flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 select-none ${
              period === p ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
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
                  {idx < 3 ? <span className="tossface">{['🥇','🥈','🥉'][idx]}</span> : idx + 1}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-gray-800 text-sm">{entry.nickname}</span>
                  {entry.grade && (
                    <span className="text-[10px] font-bold text-gray-400">{entry.grade}학년</span>
                  )}
                </div>
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
