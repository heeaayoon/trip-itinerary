"use client";

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Plus, Trash2, Edit2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getIcon } from '@/utils/iconMap';
import { extendTripOneDay, shortenTripOneDay } from '@/lib/actions'; 
import TripMap from './TripMap';
import { TripSchedule as TSchedule } from '@/types/db';

// 컴포넌트
import DayTabs from './DayTabs'; 
import AddScheduleModal from './AddScheduleModal'; 
import AIRecommendationModal from './AIRecommendationModal';

// 데이터 타입 정의
interface ScheduleItem {
  day: number;      
  date: string;     
  weather: any;     
  plans: any[];     
  dayId?: string;   
}

interface Props {
  tripId: string;
  scheduleData: ScheduleItem[]; 
  rawDays: any[];               
}

export default function TripSchedule({ tripId, scheduleData, rawDays }: Props) {
  const [activeTab, setActiveTab] = useState(0);
  
  //모달 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false); // 수동 입력 모달
  const [isAIModalOpen, setIsAIModalOpen] = useState(false); // AI 추천 모달 상태 추가
  const [editingSchedule, setEditingSchedule] = useState<TSchedule | null>(null); // 수정할 스케줄 데이터를 담을 상태
 
  const [isPending, startTransition] = useTransition(); 
  const router = useRouter();


  if (!scheduleData || scheduleData.length === 0) {
    return <div className="p-6 bg-white rounded-lg text-center text-gray-500">일정 데이터가 없습니다.</div>;
  }
  // 현재 탭의 데이터 (일정들)
  const currentData = scheduleData[activeTab] || scheduleData[0];

  // 1. 날짜 연장 (Add Day)
  const handleExtendTrip = () => {
    if (!confirm("여행 기간을 하루 더 연장하시겠습니까?")) return;
    startTransition(async () => {
      try {
        const lastDate = scheduleData[scheduleData.length - 1].date;
        await extendTripOneDay(tripId, lastDate);
      } catch (error) {
        alert("날짜 연장에 실패했습니다.");
      }
    });
  };

  // 2. 날짜 삭제 (Delete Day)
  const handleDeleteDay = (index: number) => {
    if (index !== scheduleData.length - 1) {
      alert("여행 일정의 꼬임을 방지하기 위해 '마지막 날짜'만 삭제하여 기간을 줄일 수 있습니다.");
      return;
    }
    if (!confirm(`Day ${scheduleData[index].day} (${scheduleData[index].date})을 삭제하시겠습니까?`)) return;

    startTransition(async () => {
      try {
        const lastDate = scheduleData[scheduleData.length - 1].date;
        await shortenTripOneDay(tripId, lastDate);
        if (activeTab >= index) {
          setActiveTab(Math.max(0, index - 1));
        }
      } catch (e) {
        alert("날짜 단축에 실패했습니다.");
      }
    });
  };

  // 3. 스케줄 삭제
  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm("정말 이 일정을 삭제하시겠습니까?")) return;
    const { error } = await supabase.from('Schedules').delete().eq('id', scheduleId);
    if (error) alert("삭제 실패");
    else router.refresh();
  };

    // ▼▼▼ [수정] "수정" 버튼을 클릭했을 때 실행될 함수를 추가합니다. ▼▼▼
  const handleEditClick = (schedule: TSchedule) => {
    setEditingSchedule(schedule); // 수정할 데이터를 state에 저장
    setIsModalOpen(true);         // 모달 열기
  };

  // ▼▼▼ [수정] "일정 추가" 버튼 클릭 시, 수정 상태를 null로 초기화합니다. ▼▼▼
  const handleAddClick = () => {
    if (!currentData.dayId) {
      alert("일정을 추가하려면 먼저 데이터가 생성되어야 합니다.");
      return;
    }
    setEditingSchedule(null); // 추가 모드이므로 수정 데이터는 비움
    setIsModalOpen(true);
  };
  
  // ▼▼▼ [수정] 모달이 닫힐 때, 수정 상태도 함께 초기화합니다. ▼▼▼
  const handleCloseModal = () => {
    setIsModalOpen(false);
    // 애니메이션을 위해 약간의 딜레이 후 state 초기화
    setTimeout(() => setEditingSchedule(null), 300);
  };

  const handleSuccess = () => {
    handleCloseModal(); // 모달을 닫고
    setIsAIModalOpen(false); // AI 모달도 성공 시 닫아줌
    router.refresh();   // 페이지를 새로고침
  };

  return (
    <>
      <DayTabs 
        scheduleData={scheduleData}
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onAddDay={handleExtendTrip}    
        onDeleteDay={handleDeleteDay}  
        isUpdating={isPending}         
      />

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 mt-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex justify-between items-center pb-4 border-b">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <MapPin className="text-indigo-500 w-5 h-5" />
              <span>Day {currentData.day}</span>
              <span className="text-sm font-normal text-gray-500">({currentData.date})</span>
            </div>
            <span className="text-xs text-rose-500 mt-1 pl-7 font-medium">
              {currentData.weather 
                ? `${currentData.weather.desc}, 최고 ${currentData.weather.tempMax}°` 
                : "날씨 정보 없음"}
            </span>
          </div>
          {/* ▼▼▼ 오른쪽: 버튼 그룹 (AI 추천 + 수동 추가) ▼▼▼ */}
          <div className="flex items-center gap-2">
            {/* ✨ AI 추천 버튼 */}
            <button 
              onClick={() => setIsAIModalOpen(true)}
              className="text-sm bg-linear-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white px-3 py-1.5 rounded-lg 
                        flex items-center gap-1 transition font-bold shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
              <Sparkles className="w-4 h-4" /> AI 추천
            </button>
            <button 
              onClick={handleAddClick}
              className="text-sm bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-lg 
                        flex items-center gap-1 transition font-bold border border-rose-100 shadow-sm">
              <Plus className="w-4 h-4" /> 일정 추가
            </button>
          </div>
        </h2>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 mt-6">
          {/* //지도 추가 */}
          {currentData.plans && currentData.plans.some((p: any) => p.lat && p.lng) && (
          <TripMap schedules={currentData.plans} />)}
          {currentData.plans && currentData.plans.length > 0 ? (
            currentData.plans.map((item: any) => (
              <div key={item.id} className="group relative pl-8 border-l-2 border-rose-200 last:border-0 pb-6 last:pb-0 hover:bg-gray-50/50 rounded-r-xl transition-colors p-2 -ml-2">
                <div className="absolute -left-[9px] top-0 bg-white p-1 rounded-full border border-rose-200 shadow-sm">
                  {getIcon(item.icon)}
                </div>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-1">
                      <span className="font-bold text-rose-600 text-lg w-16 shrink-0">{item.time}</span>
                      <h3 className="font-bold text-gray-800 text-lg">{item.activity}</h3>
                    </div>
                    <p className="text-gray-600 mb-2">{item.description}</p>
                    {item.tips && (
                      <div className="bg-amber-50 text-amber-800 text-sm p-3 rounded-lg inline-block border border-amber-100">
                        <span className="font-bold">💡 Tip:</span> {item.tips}
                      </div>
                    )}
                  </div>
                  {/* ▼▼▼ [수정] 수정 버튼과 삭제 버튼을 담을 컨테이너를 추가합니다. ▼▼▼ */}
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button 
                      onClick={() => handleEditClick(item)} 
                      className="text-gray-400 hover:text-sky-500 p-2"
                      aria-label="일정 수정"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteSchedule(item.id)} 
                      className="text-gray-400 hover:text-red-500 p-2"
                      aria-label="일정 삭제"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-400 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200">
              <p>아직 등록된 일정이 없어요.</p>
              <p className="text-sm mt-1">우측 상단 <strong>[+ 일정 추가]</strong> 버튼을 눌러보세요!</p>
            </div>
          )}
        </div>
      </div>

      {/* 기존 수동 입력 모달 */}
      <AddScheduleModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        days={rawDays} 
        initialDayId={currentData.dayId || ""} 
        onSuccess={handleSuccess}
        scheduleToEdit={editingSchedule}/>

      {/* ✨ AI 추천 모달 (새로 추가됨) */}
      <AIRecommendationModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        days={rawDays}
        tripId={tripId}
        currentDayId={currentData.dayId || ""} // 현재 보고 있는 탭의 Day ID를 전달
        onSuccess={handleSuccess}/>
    </>
  );
}