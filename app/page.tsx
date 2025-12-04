"use client";

import { useState, useEffect } from 'react';
import { getAllTrips } from '@/lib/supabaseData';
import AddTripModal from '@/components/AddTripModal';
import TripListCard from '@/components/TripListCard'; // 👈 [추가] 카드 컴포넌트 import
import { TripForList } from '@/types/db';
import { Plus } from 'lucide-react';

export default function HomePage() {
  const [trips, setTrips] = useState<TripForList[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 여행 목록 불러오기
  const fetchTrips = async () => {
    setLoading(true);
    const tripsData = await getAllTrips();
    setTrips(tripsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  return (
    <>
      <main className="min-h-screen bg-stone-100 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">나의 여행 목록 🗺️</h1>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-sky-500 rounded-full animate-spin mb-2"></div>
              <p className="text-gray-500">목록을 불러오는 중...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 여행 리스트 출력 */}
              {trips.length > 0 ? (
                trips.map((trip) => (
                  // 🔥 [수정] Link 태그 대신 TripListCard 컴포넌트 사용
                  <TripListCard 
                    key={trip.id} 
                    trip={trip} 
                    onDeleteSuccess={fetchTrips} // 삭제되면 목록 다시 불러오기
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
        onSuccess={fetchTrips} // 추가되면 목록 다시 불러오기
      />
    </>
  );
}