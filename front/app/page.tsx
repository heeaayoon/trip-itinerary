"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AddTripModal from '@/components/AddTripModal';
import TripListCard from '@/components/TripListCard';
import { Plus, LogOut } from 'lucide-react';

// 1. [API 클라이언트 Import]
// Supabase 관련 import는 모두 제거하고, 우리가 만든 '만능 비서' apiClient만 가져옵니다.
import apiClient from '@/lib/api'; 
import { TripForList } from '@/types/db';
// 2. [타입 정의]
// '/api/users/me' API가 반환하는 사용자 정보에 대한 타입입니다.
// UserDto.UserInfoResponse 와 일치시킵니다.
interface User {
  email: string;
  name: string;
}

// 3. [메인 컴포넌트]
export default function HomePage() {
  // --- 3-1. 상태 관리 (useState) ---
  // 이 페이지가 기억해야 할 모든 정보를 저장하는 "서랍장"입니다.
  const [trips, setTrips] = useState<TripForList[]>([]);           // '여행 목록' 서랍
  const [loading, setLoading] = useState(true);           // '로딩 중' 상태 스위치
  const [isModalOpen, setIsModalOpen] = useState(false);  // '모달 열림' 상태 스위치
  const [user, setUser] = useState<User | null>(null);    // '로그인한 사용자 정보' 서랍
  const router = useRouter(); 

  // --- 3-2. 초기화 로직 (useEffect) ---
  // 이 페이지가 화면에 처음 그려진 직후, 딱 한 번만 실행되는 매우 중요한 부분입니다.
  // "이 사용자가 이 페이지를 볼 자격이 있는가?"를 검증하고, 초기 데이터를 가져옵니다.
  useEffect(() => {
    const initializePage = async () => {
      try {
        // [1단계: 인증 검사] - "티켓 검사"
        // apiClient는 localStorage의 토큰을 자동으로 헤더에 담아 요청을 보냅니다.
        // 이 요청이 성공하면, 토큰이 유효하다는 것이 증명됩니다.
        const userResponse = await apiClient.get('/api/users/me');
        const userData: User = userResponse.data;
        setUser(userData); // 검사를 통과한 사용자의 정보를 '사용자 정보' 서랍에 저장합니다.

        // [2단계: 데이터 가져오기]
        // 인증 검사를 통과했으므로, 이 사용자의 여행 목록을 서버에 요청합니다.
        const tripsResponse = await apiClient.get('/api/trips/my');
        setTrips(tripsResponse.data); // 받아온 목록을 '여행 목록' 서랍에 저장합니다.

      } catch (error) {
        // [3단계: 실패 처리] - "가짜 티켓 발견!"
        // 위 API 호출 중 하나라도 실패하면(주로 인증 실패), 이 코드가 실행됩니다.
        console.error("인증 실패 또는 데이터 로드 실패:", error);
        
        // 브라우저에 남아있을 수 있는 유효하지 않은 토큰을 삭제하고,
        localStorage.removeItem('accessToken');
        // 로그인 페이지로 강제로 보냅니다.
        router.push('/login');
      } finally {
        // [4단계: 마무리]
        // 모든 과정이 성공하든 실패하든, 검문이 끝났으므로 로딩 상태를 해제합니다.
        setLoading(false);
      }
    };

    initializePage();
  }, [router]); // 빈 배열 `[]`은 "처음 한 번만 실행"을 의미합니다. (router는 예외)

  // --- 3-3. 이벤트 핸들러 ---
  // 사용자의 행동(클릭 등)에 반응하는 함수들입니다.
  
  // [로그아웃 처리]
  const handleLogout = () => {
    // JWT 방식의 로그아웃은 간단합니다. 클라이언트(브라우저)에 저장된 토큰만 삭제하면 됩니다.
    localStorage.removeItem('accessToken');
    router.push('/login');
  };
  
  // [데이터 새로고침 처리] - (예: 여행 추가/삭제 후 목록을 다시 불러올 때)
  const handleRefresh = async () => {
    try {
      setLoading(true);
      const tripsResponse = await apiClient.get('/api/trips/my');
      setTrips(tripsResponse.data);
    } catch (error) {
      console.error("여행 목록 새로고침 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- 3-4. UI 렌더링 (return) ---
  // 위 로직들을 통해 준비된 데이터를 바탕으로 실제 화면을 그립니다.

  // [로딩 화면]
  // 데이터가 준비되기 전에 화면이 잠시 비어 보이는 '깜빡임' 현상을 방지합니다.
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-sky-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // [메인 화면]
  return (
    <>
      <main className="min-h-screen bg-stone-100 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* 헤더: '사용자 정보' 서랍에서 이름을 꺼내와 환영 메시지를 보여줍니다. */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">나의 여행 목록 🗺️</h1>
              <p className="text-gray-500 text-sm mt-1">반가워요, {user.name}님!</p>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition" title="로그아웃">
              <LogOut className="w-6 h-6" />
            </button>
          </div>
         
          <div className="space-y-4">
            {/* '여행 목록' 서랍을 열어 내용물이 있으면 목록을 그리고, 없으면 메시지를 보여줍니다. */}
            {trips.length > 0 ? (
              trips.map((trip) => (
                <TripListCard 
                  key={trip.id} 
                  trip={trip} // TripListCard 컴포넌트가 Trip 타입의 데이터를 받을 수 있도록 props를 맞춰주세요.
                  onDeleteSuccess={handleRefresh}
                />
              ))
            ) : (
              <p className="text-center text-gray-500 py-10">아직 등록된 여행이 없습니다.</p>
            )}

            {/* '추가' 버튼을 누르면 '모달 열림' 스위치를 켭니다. */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="py-3 px-4 rounded-xl border-2 border-dashed border-gray-300 text-gray-400
                        hover:border-rose-400 hover:text-rose-500 hover:bg-rose-50
                        w-full transition-all duration-300 flex flex-col items-center justify-center shrink-0 h-[72px]"
              title="새 여행 추가">
                <Plus className="w-6 h-6" />
                <span className="text-[10px] font-bold mt-1">Trip 추가</span>
            </button>
          </div>
        </div>
      </main>

      {/* '모달 열림' 스위치가 켜져 있을 때만 AddTripModal을 화면에 보여줍니다. */}
      <AddTripModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleRefresh}
        // [중요!] userId를 props로 넘길 필요가 없습니다.
        // 백엔드 서버가 요청 헤더의 토큰을 보고 "누가 이 요청을 보냈는지" 스스로 알기 때문입니다.
      />
    </>
  );
}