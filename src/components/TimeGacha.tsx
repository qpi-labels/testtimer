import React, { useState } from 'react';
import { api } from '../api';
import { Sparkles, Loader2, Zap } from 'lucide-react';

export function TimeGacha({ token, onLogAdded }: { token: string; onLogAdded: (total: number, stats: Record<string, number>) => void }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text: string; isJackpot: boolean } | null>(null);

  const handleGacha = async () => {
    if (loading) return;
    setLoading(true);
    setResult(null);

    const roll = Math.random();

    try {
      if (roll < 0.00001) {
        // 0.001% jackpot (24 hours)
        const chunk = 6 * 60 * 60 * 1000; // 6 hours
        let lastStats: any;
        // Split into 4 chunks to bypass the 7-hour limit per log
        for (let i = 0; i < 4; i++) {
          const end = Date.now() - (i * chunk);
          const start = end - chunk;
          lastStats = await api.addLog(token, "공부시간 뽑기", start, end);
        }
        if (lastStats) onLogAdded(lastStats.totalTime, lastStats.subjectStats);
        setResult({ text: "🎉 기적적인 운! 0.001% 확률로 24시간이 추가되었습니다! 🎉", isJackpot: true });

      } else {
        let timeMs = 0;
        let message = "";
        let isJackpot = false;

        if (roll < 0.01) {
          // 0.999% chance (11 ~ 600sec)
          const sec = Math.floor(Math.random() * 590) + 11;
          timeMs = sec * 1000;
          if (sec >= 60) message = `🎊 당첨! ${Math.floor(sec / 60)}분 ${sec % 60}초 추가 완료!`;
          else message = `🎊 당첨! ${sec}초 추가 완료!`;
          isJackpot = true;
        } else {
          // 99% chance (3 ~ 10sec)
          const sec = Math.floor(Math.random() * 8) + 3;
          timeMs = sec * 1000;
          message = `+ ${sec}초 추가 완료!`;
        }

        const stats = await api.addLog(token, "공부시간 뽑기", Date.now() - timeMs, Date.now());
        onLogAdded(stats.totalTime, stats.subjectStats);
        setResult({ text: message, isJackpot });
      }
    } catch (e: any) {
      console.error(e);
      setResult({ text: "오류 발생: " + e.message, isJackpot: false });
    } finally {
      // 1.5s cooldown before user can click again
      setTimeout(() => setLoading(false), 1500);
    }
  };

  return (
    <div className="group flex flex-col p-6 bg-white border border-gray-100 rounded-3xl hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-indigo-100 transition-all duration-300 h-full relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl font-bold tracking-tight text-gray-900" style={{ fontFamily: '"Playfair Display", serif' }}>Time Gacha</span>
        <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
          <Zap size={16} className="text-orange-400 group-hover:text-orange-600 transition-colors" />
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-end">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">공부시간 가챠</h3>
        <p className="text-xs text-gray-500 leading-relaxed mb-4">최대 24시간 공부 시간 뽑기</p>

        {result && (
          <div className={`mb-4 p-3 rounded-xl border text-center text-sm font-bold ${result.isJackpot ? 'bg-orange-50 border-orange-200 text-orange-600 animate-pulse' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
            {result.text}
          </div>
        )}

        <button
          onClick={handleGacha}
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} className="text-yellow-400" />}
          {loading ? '운 시험하는 중...' : '공부시간 뽑기'}
        </button>
      </div>
    </div>
  );
}
