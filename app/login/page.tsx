"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  
  // 입력 폼 상태들
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // 회원가입 때만 쓸 이름
  
  // 모드 전환 상태 (true: 로그인 모드, false: 회원가입 모드)
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);

  // 폼 제출 처리 (로그인 or 회원가입)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLoginMode) {
      // 🔵 로그인 로직
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert('로그인 실패: ' + error.message);
      } else {
        router.push('/'); // 메인으로 이동
        router.refresh(); // 상단 헤더 갱신
      }

    } else {
      // 🟢 회원가입 로직
      if (!name) {
        alert('이름을 입력해주세요!');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name, // ⭐️ 중요: DB에 저장될 이름
          },
        },
      });

      if (error) {
        alert('가입 실패: ' + error.message);
      } else {
        alert('회원가입 성공! 자동으로 로그인됩니다.');
        router.push('/');
        router.refresh();
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 transition-all duration-300">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            {isLoginMode ? '여행 시작하기 ✈️' : '회원가입 ✨'}
          </h2>
          <p className="text-gray-500 mt-2 text-sm">
            {isLoginMode ? '나만의 여행 컨시어지를 만나보세요.' : '간단한 정보만 입력하면 됩니다.'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 회원가입 모드일 때만 '이름' 입력칸 등장 */}
          {!isLoginMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700">이름 (닉네임)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
                placeholder="홍길동"
                required={!isLoginMode} // 회원가입일 때만 필수 입력
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
              placeholder="name@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-bold text-white transition-all shadow-md hover:shadow-lg
              ${loading ? 'bg-gray-400 cursor-not-allowed' : 
                isLoginMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-500 hover:bg-rose-600'
              }`}
          >
            {loading ? '처리 중...' : (isLoginMode ? '로그인' : '회원가입')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            {isLoginMode ? '아직 계정이 없으신가요?' : '이미 계정이 있으신가요?'}
          </p>
          <button
            onClick={() => {
              setIsLoginMode(!isLoginMode); // 모드 토글
              setEmail(''); setPassword(''); setName(''); // 입력창 초기화
            }}
            className="mt-2 text-sm font-bold text-blue-600 hover:text-blue-800 underline transition-colors"
          >
            {isLoginMode ? '회원가입 하러가기' : '로그인 하러가기'}
          </button>
        </div>
      </div>
    </div>
  );
}