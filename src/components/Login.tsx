import React from 'react';
import { LogIn } from 'lucide-react';

interface LoginProps {
  onSuccess: () => void;
}

export function Login({ onSuccess }: LoginProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6">
      <h1 className="text-3xl font-bold text-indigo-600">Study Timer</h1>
      <p className="text-gray-500 text-center">
        구글 계정으로 로그인하고<br />공부 시간을 기록해보세요.
      </p>
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 w-full">
        <button
          onClick={onSuccess}
          className="w-full flex items-center justify-center space-x-2 bg-white border border-gray-300 py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700 shadow-sm"
        >
          <LogIn size={20} className="text-indigo-600" />
          <span>Google 계정으로 시작하기</span>
        </button>
      </div>
    </div>
  );
}
