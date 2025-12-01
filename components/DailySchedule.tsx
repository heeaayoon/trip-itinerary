'use client';

import React, { useState } from 'react';
import { MapPin, Plus,  Trash2  } from 'lucide-react'; // 1. Plus 아이콘 추가
import { useRouter } from 'next/navigation'; // 2. 새로고침(Refresh)을 위해 추가
import { TripDay } from '@/types/db';
import { getIcon } from '@/utils/iconMap';
import DayTabs from './DayTabs'; 
import AddScheduleModal from './AddScheduleModal'; // 3. 모달 컴포넌트 import
import AddDayModal from './AddDayModal'; // 👈 [NEW] Day 모달 import
import { supabase } from '@/lib/supabase'; // supabase import

interface Props {
  tripId: string; // 👈 [NEW] 새 날짜를 만들려면 '어떤 여행'인지 알아야 함
  days: TripDay[]; 
}

export default function TripSchedule({ days, tripId }: Props) {
  const [activeTab, setActiveTab] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false); // 4. 모달 열림/닫힘 상태
  const [isDayModalOpen, setIsDayModalOpen] = useState(false); // 👈 [NEW] 일정 추가 모달
  const [loading, setLoading] = useState(false); // 로딩 상태
  const router = useRouter(); // 라우터 훅 사용

  // 데이터 방어 코드
  if (!days || days.length === 0) {
    return <div className="p-6 bg-white rounded-lg text-center text-gray-500">일정 데이터가 없습니다.</div>;
  }

  const currentDay = days[activeTab];

  // 5. 저장 성공 시 실행할 함수
  const handleSuccess = () => {
    router.refresh(); // 서버 컴포넌트(page.tsx)를 다시 실행해서 최신 DB 데이터를 가져옵니다.
  };

// 날짜 추가 성공 시 (탭을 맨 끝으로 이동)
  const handleDaySuccess = () => {
    router.refresh();
    setTimeout(() => setActiveTab(days.length), 500); 
  };

  // 🔥 [NEW] 일정(Schedule) 삭제 함수
  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm("정말 이 일정을 삭제하시겠습니까?")) return;

    const { error } = await supabase
      .from('Schedules') // 테이블명 대문자 확인
      .delete()
      .eq('id', scheduleId);

    if (error) {
      alert("삭제 실패 ㅠㅠ");
      console.error(error);
    } else {
      router.refresh(); // 새로고침
    }
  };

  // 🔥 [NEW] 날짜(Day) 삭제 함수
  const handleDeleteDay = async (dayId: string) => {
    if (!confirm("이 날짜를 통째로 삭제하시겠습니까?\n(안에 포함된 일정도 모두 삭제됩니다!)")) return;

    const { error } = await supabase
      .from('Days') // 테이블명 대문자 확인
      .delete()
      .eq('id', dayId);

    if (error) {
      alert("삭제 실패 ㅠㅠ");
      console.error(error);
    } else {
      // 삭제 후 탭 인덱스 조정 (0번으로 가거나 유지)
      setActiveTab(0);
      router.refresh();
    }
  };

  return (
    <>
      <DayTabs 
        days={days} 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onAddDay={() => setIsDayModalOpen(true)}
        onDeleteDay={handleDeleteDay} // 👈 삭제 함수 전달
      />

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        
        {/* 헤더 부분 수정: 제목과 버튼을 양옆으로 배치 (justify-between) */}
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex justify-between items-center pb-4 border-b">
          <div className="flex items-center gap-2">
            <MapPin className="text-indigo-500" />
            {currentDay.day_theme}
          </div>

          {/* 6. 일정 추가 버튼 */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-sm bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-lg flex items-center gap-1 transition font-bold border border-rose-100"
          >
            <Plus className="w-4 h-4" /> 일정 추가
          </button>
        </h2>
        {/* 리스트 영역 */}
        <div className="space-y-6">
          {currentDay.Schedules && currentDay.Schedules.length > 0 ? (
            currentDay.Schedules.map((item) => (
              <div key={item.id} className="group relative pl-8 border-l-2 border-rose-200 last:border-0 pb-6 last:pb-0 hover:bg-gray-50/50 rounded-r-xl transition-colors p-2 -ml-2">
                <div className="absolute -left-[9px] top-0 bg-white p-1 rounded-full border border-rose-200">
                  {getIcon(item.icon)}
                </div>
                {/* 내용 영역 */}
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-1">
                  <span className="font-bold text-rose-600 text-lg w-16 shrink-0">
                    {item.time}
                  </span>
                  <h3 className="font-bold text-gray-800 text-lg">
                    {item.activity}
                  </h3>
                </div>
                
                <p className="text-gray-600 mb-2">
                  {item.description}
                </p>
                
                {item.tips && (
                  <div className="bg-amber-50 text-amber-800 text-sm p-3 rounded-lg inline-block">
                    <span className="font-bold">💡 Tip:</span> {item.tips}
                  </div>
                )}
              </div>

              {/* ✨ [NEW] 스케줄 삭제 버튼 (Hover 시 등장) */}
                  <button
                    onClick={() => handleDeleteSchedule(item.id)}
                    className="
                      opacity-0 group-hover:opacity-100 transition-opacity duration-200 
                      text-gray-400 hover:text-red-500 p-2
                    "
                    title="일정 삭제"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  </div>
              </div>
            ))
          ) : (
            // 데이터가 없을 때 안내 문구
            <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p>아직 등록된 일정이 없어요.</p>
              <p className="text-sm mt-1">우측 상단 <strong>[+ 일정 추가]</strong> 버튼을 눌러보세요!</p>
            </div>
          )}
        </div>
      </div>

      {/* 7. 모달 컴포넌트 연결 */}
      <AddScheduleModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        //dayId={currentDay.id} // 현재 보고 있는 탭의 날짜 ID(UUID)를 넘겨줌
        days={days}  // 👇 [수정] 전체 날짜 목록을 넘겨줍니다 (선택 박스용)
        initialDayId={currentDay.id}  // 👇 [수정] 기본값은 '현재 보고 있는 탭의 ID'로 설정
        onSuccess={handleSuccess}
      />

      <AddDayModal 
        isOpen={isDayModalOpen}
        onClose={() => setIsDayModalOpen(false)}
        tripId={tripId}
        days={days}
        onSuccess={handleDaySuccess}
      />
    </>
  );
}