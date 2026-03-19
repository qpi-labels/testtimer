import React from 'react';
import { BookOpen } from 'lucide-react';

interface SubjectStatsProps {
  subjectStats: Record<string, number>;
  totalTime: number;
}

const SUBJECT_COLORS: Record<string, string> = {
  '국어': '#6366f1',
  '수학': '#f59e0b',
  '영어': '#10b981',
  '탐구': '#f43f5e',
  '기타': '#94a3b8',
};

function getColor(subject: string, index: number) {
  if (SUBJECT_COLORS[subject]) return SUBJECT_COLORS[subject];
  const palette = ['#8b5cf6', '#06b6d4', '#84cc16', '#fb923c', '#e879f9'];
  return palette[index % palette.length];
}

function formatTime(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h === 0) return `${m}분`;
  return `${h}시간 ${m}분`;
}

export function SubjectStats({ subjectStats, totalTime }: SubjectStatsProps) {
  const entries = Object.entries(subjectStats).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <BookOpen className="mr-2 text-indigo-500" size={20} /> 과목별 통계
        </h2>
        <p className="text-center text-gray-400 py-6 text-sm">아직 공부 기록이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center">
        <BookOpen className="mr-2 text-indigo-500" size={20} /> 과목별 통계
      </h2>

      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden mb-5 bg-gray-100">
        {entries.map(([subject, ms], idx) => {
          const pct = totalTime > 0 ? (ms / totalTime) * 100 : 0;
          return (
            <div
              key={subject}
              style={{ width: `${pct}%`, backgroundColor: getColor(subject, idx) }}
              title={`${subject}: ${formatTime(ms)}`}
              className="transition-all duration-700"
            />
          );
        })}
      </div>

      {/* Legend + bars */}
      <div className="space-y-3">
        {entries.map(([subject, ms], idx) => {
          const pct = totalTime > 0 ? Math.round((ms / totalTime) * 100) : 0;
          const color = getColor(subject, idx);
          return (
            <div key={subject} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700 truncate">{subject}</span>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-xs text-gray-400">{pct}%</span>
                    <span className="text-sm font-semibold text-gray-800">{formatTime(ms)}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
