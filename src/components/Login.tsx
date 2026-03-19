import React from 'react';
import { GoogleLogin } from '@react-oauth/google';

interface LoginProps {
  onSuccess: (credential: string) => void;
}

export function Login({ onSuccess }: LoginProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">충곽 타이머</h1>
      <p className="text-gray-500 text-center">
        충곽 학생들과 경쟁하다!
      </p>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <GoogleLogin
          onSuccess={(credentialResponse) => {
            if (credentialResponse.credential) {
              onSuccess(credentialResponse.credential);
            }
          }}
          onError={() => {
            console.error('Login Failed');
            alert('로그인에 실패했습니다.');
          }}
        />
      </div>
    </div>
  );
}
