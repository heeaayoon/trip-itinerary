"use client";

import { useState } from 'react';
//import { supabase } from '@/lib/supabase';
import apiClient from '@/lib/api'; //supabase 대신 axios API 클라이언트 사용
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

  //apiClient를 이용한 폼 제출 처리 함수
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try{
      //로그인 모드
      if(isLoginMode){ 
        const resp = await apiClient.post('/api/auth/login', {email, password}); //요청 본문에 사용자가 입력한 email과 password를 JSON 객체 형태로 담아 보냄
        const { token } = resp.data; //응답 데이터에서(백) 토큰 추출
        if(token){ //토큰이 존재하면
          localStorage.setItem('accessToken', token); //local storage에 저장
          alert('로그인 성공! 환영합니다.');
          router.push('/'); //메인 페이지로 이동
          router.refresh(); //서버 컴포넌트 데이터 새로고침
        } else {
          alert('로그인 실패: 서버로부터 받은 토큰이 없습니다.'); //응답 본문에 토큰이 없으면 실패 처리
        }
      } else {
        //회원가입 모드
        const resp = await apiClient.post('/api/auth/signup', {name, email, password});
        alert('회원가입 성공! 자동으로 로그인됩니다.');
        //회원가입 후 자동 로그인 처리
        const loginResp = await apiClient.post('/api/auth/login', {email, password});
        const { token } = loginResp.data;
        if(token){
          localStorage.setItem('accessToken', token);
          router.push('/'); //메인 페이지로 이동
          router.refresh();
        } else {
          alert('회원가입 실패: 서버로부터 받은 토큰이 없습니다.');
        }
      }
    }catch(error){
      console.error("폼 제출 오류:", error);
      alert("문제가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

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