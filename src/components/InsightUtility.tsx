import React, { useState, useEffect, useRef } from 'react';
import { generateInsight } from './geminiService';
import { ChevronDown, ExternalLink, Key, Loader2, Sparkles } from 'lucide-react';

function parseInline(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function renderMarkdown(text: string) {
  return text.split('\n\n').map((paragraph, index) => {
    paragraph = paragraph.trim();
    if (!paragraph) return null;

    if (paragraph.startsWith('* ') || paragraph.startsWith('- ')) {
      const items = paragraph.split('\n').map(line => line.trim().replace(/^[-*]\s+/, ''));
      return (
        <ul key={index} className="list-disc ml-5 mb-4">
          {items.map((item, i) => <li key={i} className="mb-1">{parseInline(item)}</li>)}
        </ul>
      );
    }
    if (paragraph.match(/^\d+\.\s+/)) {
      const items = paragraph.split('\n').map(line => line.trim().replace(/^\d+\.\s+/, ''));
      return (
        <ol key={index} className="list-decimal ml-5 mb-4">
          {items.map((item, i) => <li key={i} className="mb-1">{parseInline(item)}</li>)}
        </ol>
      );
    }
    if (paragraph.startsWith('### ')) {
      return <h3 key={index} className="text-lg font-bold mb-3">{parseInline(paragraph.replace('### ', ''))}</h3>;
    }
    if (paragraph.startsWith('## ')) {
      return <h2 key={index} className="text-xl font-bold mb-3">{parseInline(paragraph.replace('## ', ''))}</h2>;
    }
    if (paragraph.startsWith('# ')) {
      return <h1 key={index} className="text-2xl font-bold mb-4">{parseInline(paragraph.replace('# ', ''))}</h1>;
    }
    if (paragraph.startsWith('> ')) {
      return <blockquote key={index} className="pl-4 border-l-4 border-indigo-300 italic text-gray-600 mb-4 bg-gray-50/50 py-2">{parseInline(paragraph.replace(/^>\s*/gm, ''))}</blockquote>;
    }
    
    return <p key={index} className="mb-4 last:mb-0 leading-relaxed">{parseInline(paragraph.replace(/\n/g, ' '))}</p>;
  });
}

export function InsightUtility() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const key = localStorage.getItem('gemini_api_key');
    if (key) setSavedKey(key);
  }, []);

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      setSavedKey(apiKey.trim());
    }
  };

  const clearKey = () => {
    localStorage.removeItem('gemini_api_key');
    setSavedKey(null);
    setApiKey('');
  };

  const handleGenerate = async () => {
    if (!savedKey || !topic.trim()) return;
    setLoading(true);
    setResult('');
    try {
      const res = await generateInsight(savedKey, topic);
      setResult(res || '');
    } catch (e: any) {
      console.error(e);
      setResult('오류가 발생했습니다. API 키가 유효한지 확인해주세요.\n' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // We enforce a transition by calculating the scrollHeight. 
  // However, flex layouts can shift, so max-height is usually easiest.
  return (
    <div className="bg-white border border-gray-100 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden transition-all duration-300">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-gray-50/50 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Insight</h3>
            <p className="text-sm text-gray-500 font-medium mt-0.5">Google Gemini 기반 심연 분석 AI</p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50/80 group-hover:bg-white transition-colors">
          <ChevronDown
            size={20}
            className={`text-gray-400 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      <div
        className="transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] overflow-hidden"
        style={{
          maxHeight: isExpanded ? '1000px' : '0px',
          opacity: isExpanded ? 1 : 0
        }}
        ref={contentRef}
      >
        <div className="px-6 pb-6 pt-2">
          {!savedKey ? (
            <div className="bg-gradient-to-b from-gray-50 to-white border border-gray-100 rounded-3xl p-8 text-center shadow-sm">
              <div className="w-16 h-16 bg-white border border-gray-100 shadow-sm rounded-2xl mx-auto flex items-center justify-center mb-4">
                <Key size={28} className="text-indigo-400" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">API 키 설정이 필요합니다</h4>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto leading-relaxed">
                가장 강력한 AI 모델을 사용하기 위해 Google AI Studio에서 무료 API 키를 발급받아 등록해주세요. (키는 브라우저에만 안전하게 보관됩니다)
              </p>
              <div className="flex justify-center mb-6">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-sm text-indigo-700 font-semibold rounded-xl hover:bg-indigo-100 transition-colors"
                >
                  <ExternalLink size={16} /> API 키 발급받기
                </a>
              </div>
              <div className="flex max-w-sm mx-auto items-center p-1.5 bg-gray-50 border border-gray-200 rounded-2xl focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all">
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="flex-1 px-4 py-2 bg-transparent focus:outline-none text-sm font-mono"
                  onKeyDown={e => e.key === 'Enter' && handleSaveKey()}
                />
                <button
                  onClick={handleSaveKey}
                  disabled={!apiKey.trim()}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:translate-y-[-1px] hover:shadow-md active:translate-y-0 transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  저장
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">Input Text</span>
                <button onClick={clearKey} className="text-xs font-medium text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1">
                  <Key size={12} /> 재설정
                </button>
              </div>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="마음속 깊은 곳에 있는 불편한 진실을 꺼내보세요. (예: 완벽주의, 시기심, 사랑)"
                className="w-full h-28 p-5 rounded-3xl bg-gray-50/50 border border-gray-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50/50 focus:bg-white transition-all resize-none text-gray-800 text-[15px] leading-relaxed shadow-inner"
              />
              <button
                onClick={handleGenerate}
                disabled={loading || !topic.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                {loading ? '심연을 들여다보는 중...' : '통찰 마주하기'}
              </button>

              {result && (
                <div 
                  className="mt-6 p-6 rounded-3xl bg-gray-50 border border-gray-100 text-gray-800"
                  style={{ fontFamily: '"Noto Serif KR", serif' }}
                >
                  {renderMarkdown(result)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
