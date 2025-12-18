"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AddTripModal from '@/components/AddTripModal';
import TripListCard from '@/components/TripListCard';
import { Plus, LogOut } from 'lucide-react';

// API 클라이언트
import apiClient from '@/lib/api'; 
import { TripForList } from '@/types/db';
// 타입 정의
// '/api/users/me' API가 반환하는 사용자 정보 타입
interface User {
  email: string;
  name: string;
}

// 메인 컴포넌트
export default function HomePage() {
  const [trips, setTrips] = useState<TripForList[]>([]);  //여행 목록
  const [loading, setLoading] = useState(true);           //로딩 중 상태 스위치
  const [isModalOpen, setIsModalOpen] = useState(false);  //모달 열림 상태 스위치
  const [user, setUser] = useState<User | null>(null);    //로그인한 사용자 정보
  const router = useRouter(); 

  // 초기화 로직
  // 이 페이지가 화면에 처음 그려진 직후, 딱 한 번만 실행
  useEffect(() => {
    const initializePage = async () => {
      //API 부르기 전에 토큰이 있는지 먼저 확인
      const token = localStorage.getItem('accessToken');
      // 토큰이 아예 없다면?
      if (!token) {
        router.push('/login'); //-> 바로 로그인 페이지로 이동
        return;
      }

      try {
        // 토큰이 있을 때만 API 호출
        const userResponse = await apiClient.get('/api/users/me');
        setUser(userResponse.data);

        const tripsResponse = await apiClient.get('/api/trips/my');
        setTrips(tripsResponse.data);

      } catch (error: any) {
        // 401(인증안됨), 403(권한없음)은 예상된 에러
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          // 조용히 토큰 삭제하고 이동
          localStorage.removeItem('accessToken');
          router.push('/login');
        } else {
          // 예상치 못한 에러(서버 다운 등)만 콘솔에 찍기
          console.error("시스템 오류 발생:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, [router]); //(router는 예외)

  // 이벤트 핸들러 : 사용자의 행동(클릭 등)에 반응하는 함수

  // 로그아웃 처리
  const handleLogout = () => {
    // JWT 방식 로그아웃
    // 클라이언트(브라우저)에 저장된 토큰만 삭제
    localStorage.removeItem('accessToken');
    router.push('/login');
  };
  
  // 데이터 새로고침 처리(여행 추가/삭제 후 목록을 다시 불러올 때)
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

  // 로딩 화면
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-sky-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-stone-100 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">나의 여행 목록</h1>
              <p className="text-gray-500 text-sm mt-1">반가워요, {user.name}님!</p>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-rose-500 transition" title="로그아웃">
              <LogOut className="w-6 h-6" />
            </button>
          </div>
         
          <div className="space-y-4">
            {/*여행 목록*/}
            {trips.length > 0 ? (
              trips.map((trip) => (
                <TripListCard 
                  key={trip.id} 
                  trip={trip}
                  onDeleteSuccess={handleRefresh}
                />
              ))
            ) : (
              <p className="text-center text-gray-500 py-10">아직 등록된 여행이 없습니다.</p>
            )}

            {/* + 버튼을 누르면 모달 열림 스위치가 켜짐 */}
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

      {/* 모달 열림=true일 때만 AddTripModal을 화면에 보여줌 */}
      <AddTripModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleRefresh}
        // userId를 props로 넘길 필요 없음 -> 백엔드 서버가 요청 헤더의 토큰을 보고 누군지 알기 때문
      />
    </>
  );
}