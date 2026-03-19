import React from 'react';
import { BookOpen } from 'lucide-react';

interface LoginProps {
  onSuccess: () => void;
}

export function Login({ onSuccess }: LoginProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 text-center">
      <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 rotate-3">
        <BookOpen size={40} />
      </div>
      
      <div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">StudyTimer</h1>
        <p className="text-gray-500 font-medium">
          공부 시간을 기록하고 친구들과 경쟁해보세요.
        </p>
      </div>

      <button 
        onClick={onSuccess}
        className="group relative flex items-center justify-center w-full px-6 py-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-indigo-600 hover:bg-indigo-50 transition-all duration-300 shadow-sm"
      >
        <img 
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
          alt="Google" 
          className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform"
          referrerPolicy="no-referrer"
        />
        <span className="text-gray-700 font-bold text-lg">Google 계정으로 시작하기</span>
      </button>

      <p className="text-xs text-gray-400">
        로그인 시 서비스 이용약관 및 개인정보 처리방침에 동의하게 됩니다.
      </p>
    </div>
  );
}
