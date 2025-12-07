"use client";

import { useState, useEffect, useCallback } from 'react'; // useCallback 추가
import { getMyTrips } from '@/lib/supabaseData';
import AddTripModal from '@/components/AddTripModal';
import TripListCard from '@/components/TripListCard';
import { TripForList } from '@/types/db';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation'; 
import { Plus, LogOut } from 'lucide-react';

export default function HomePage() {
  const [trips, setTrips] = useState<TripForList[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter(); 

  // 1. 여행 목록 가져오는 함수 (수정됨: userId를 인자로 받음)
  // user state가 업데이트 되기 전에도 실행할 수 있게 하기 위함입니다.
  const fetchTrips = async (userId: string) => {
    setLoading(true);
    // state인 user.id가 아니라, 인자로 받은 userId를 사용
    const tripsData = await getMyTrips(userId);
    setTrips(tripsData);
    setLoading(false);
  };

  // 2. 로그인 체크 및 초기 데이터 로드
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // 로그인 안 했으면 쫓아내기
        router.push('/login');
      } else {
        // 로그인 했으면
        setUser(user);      // 1. 유저 정보 저장하고
        fetchTrips(user.id); // 2. ⭐️ 바로 그 ID로 여행 목록 불러오기 (에러 해결)
      }
    };

    checkUser();
  }, [router]);

  // 3. 새로고침용 함수 (모달 닫히거나 삭제 후 호출)
  // 여기서는 이미 user state가 세팅된 후이므로 user.id를 사용해도 됩니다.
  const handleRefresh = () => {
    if (user?.id) {
      fetchTrips(user.id);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // 로딩 중이거나 유저가 없으면 빈 화면 (깜빡임 방지)
  if (!user) return <div className="min-h-screen bg-stone-100"></div>;

  return (
    <>
      <main className="min-h-screen bg-stone-100 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">나의 여행 목록 🗺️</h1>
              <p className="text-gray-500 text-sm mt-1">반가워요, {user.email?.split('@')[0]}님!</p>
            </div>
            <button 
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-500 transition"
              title="로그아웃"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
         
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-sky-500 rounded-full animate-spin mb-2"></div>
              <p className="text-gray-500">목록을 불러오는 중...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 여행 리스트 */}
              {trips.length > 0 ? (
                trips.map((trip) => (
                  <TripListCard 
                    key={trip.id} 
                    trip={trip} 
                    onDeleteSuccess={handleRefresh} // ⭐️ 수정: 삭제 후 새로고침
                  />
                ))
              ) : (
                <p className="text-center text-gray-500 py-10">아직 등록된 여행이 없습니다.</p>
              )}

              {/* 추가 버튼 */}
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
          )}
        </div>
      </main>

      {/* 여행 추가 모달 */}
      <AddTripModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleRefresh} // ⭐️ 수정: 추가 후 새로고침
        userId={user.id} // ⭐️ 중요: 모달에 유저 ID를 넘겨줘야 'created_by'를 넣을 수 있음!
      />
    </>
  );
}