"use client";

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { MapPin, Plus, Calendar, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { extendTripOneDay, shortenTripOneDay } from '@/lib/actions'; 
import { TripSchedule as TSchedule } from '@/types/db';

// dnd-kit 라이브러리 import
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

// 컴포넌트
import DayTabs from './DayTabs'; 
import AddScheduleModal from './AddScheduleModal'; 
import AIRecommendationModal from './AIRecommendation/index';
import TripMap from './TripMap';
import ScheduleCard from './ScheduleCard';

// 데이터 타입 정의
interface ScheduleItem {
  day: number;      
  date: string;     
  weather: any;     
  plans: TSchedule[];
  dayId?: string;   
}

interface Props {
  tripId: string;
  scheduleData: ScheduleItem[]; 
  rawDays: any[];               
}

export default function TripSchedule({ tripId, scheduleData: initialScheduleData, rawDays }: Props) {
  const [activeTab, setActiveTab] = useState(0);

  // 드래그 시 상태 변경 관리
  const [scheduleData, setScheduleData] = useState(initialScheduleData);
  
  //모달 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false); // 수동 입력 모달
  const [isAIModalOpen, setIsAIModalOpen] = useState(false); // AI 추천 모달 상태 추가
  const [editingSchedule, setEditingSchedule] = useState<TSchedule | null>(null); // 수정할 스케줄 데이터를 담을 상태
 
  const [isPending, startTransition] = useTransition(); 
  const router = useRouter();

  // dnd-kit 센서 설정
  const sensors = useSensors(useSensor(PointerSensor, {
    // 그냥 클릭하는 것과 드래그를 구분하기 위해,
    // 마우스를 8px 이상 움직였을 때만 드래그로 인식
    activationConstraint: {distance: 8,},
  }));

  if (!scheduleData || scheduleData.length === 0) {
    return <div className="p-6 bg-white rounded-lg text-center text-gray-500">일정 데이터가 없습니다.</div>;
  }
  // 현재 탭의 데이터 (일정들)
  const currentData = scheduleData[activeTab] || scheduleData[0];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [_, month, day] = dateStr.split('-');
    return `${month}.${day}`;
  };

  // 1. 날짜 연장
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

  // 2. 날짜 삭제
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

    // 4. "수정" 버튼을 클릭했을 때 실행될 함수
  const handleEditClick = (schedule: TSchedule) => {
    setEditingSchedule(schedule); // 수정할 데이터를 state에 저장
    setIsModalOpen(true);         // 모달 열기
  };

  // 5. "추가" 버튼 클릭 시, 수정 상태를 null로 초기화
  const handleAddClick = () => {
    if (!currentData.dayId) {
      alert("일정을 추가하려면 먼저 데이터가 생성되어야 합니다.");
      return;
    }
    setEditingSchedule(null); // 추가 모드이므로 수정 데이터는 비움
    setIsModalOpen(true);
  };
  
  // 모달이 닫힐 때, 수정 상태도 함께 초기화
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

  // 드래그 종료 시 실행될 함수
  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      // 1. 화면 즉시 업데이트 (Optimistic Update)
      const oldIndex = currentData.plans.findIndex(p => p.id === active.id);
      const newIndex = currentData.plans.findIndex(p => p.id === over.id);
      
      const reorderedPlans = arrayMove(currentData.plans, oldIndex, newIndex);

      // 전체 scheduleData 상태 업데이트
      const updatedScheduleData = scheduleData.map((dayData, index) => 
        index === activeTab ? { ...dayData, plans: reorderedPlans } : dayData
      );
      setScheduleData(updatedScheduleData);

      // 2. DB에 변경된 순서(display_order) 저장
      try {
        const updates = reorderedPlans.map((plan, index) => ({
          id: plan.id,
          display_order: index
        }));

        // rpc 함수 호출
        const { error } = await supabase.rpc('update_schedule_order', {
          updates: updates 
        });

        if (error) throw error;
        //console.log("순서가 RPC를 통해 성공적으로 저장되었습니다.");

      } catch (error) {
        alert("순서 변경 저장에 실패했습니다.");
        setScheduleData(initialScheduleData);
      }
    }
  };

  const hasPlansWithLocation = currentData.plans.some(p => p.lat && p.lng);

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

      {/* 🔥 [수정] 메인 컨텐츠: Day 상세 정보 전체를 하나의 카드로 통합 */}
      <div className="mt-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          {/* 1. Day 헤더 & 액션 버튼 */}
          <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="text-blue-500 w-5 h-5" />
                <span className="text-xl font-bold text-gray-800">Day {currentData.day}</span>
                <span className="text-gray-400 text-sm">({formatDate(currentData.date)})</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-500 pl-7">
                {currentData.weather?.icon ? (
                  <>
                    <div className="relative w-5 h-5">
                      <Image key={currentData.weather.icon} src={`https://raw.githubusercontent.com/visualcrossing/WeatherIcons/main/SVG/4th%20Set%20-%20Color/${currentData.weather.icon}.svg`} alt={currentData.weather.desc || '날씨 아이콘'} fill sizes="20px" className="object-contain" />
                    </div>
                    <span>{currentData.weather.desc}, 최고 {Math.round(currentData.weather.tempMax)}°</span>
                  </>
                ) : <span>날씨 정보 없음</span>}
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto shrink-0">
              <button onClick={() => setIsAIModalOpen(true)} 
                      className="flex-1 sm:flex-none text-sm bg-linear-to-r from-blue-500 to-indigo-600 
                                text-white px-3 py-2 rounded-xl font-bold 
                                hover:shadow-lg transition flex items-center justify-center gap-1 shadow-md">
                <Sparkles className="w-4 h-4" /> <span className="sm:inline">AI 추천</span>
              </button>
              <button onClick={handleAddClick} 
                      className="flex-1 sm:flex-none text-sm bg-gray-900 text-white px-3 py-2 rounded-xl font-bold
                               hover:bg-black transition flex items-center justify-center gap-1 shadow-md">
                <Plus className="w-4 h-4" /> <span className="sm:inline">추가</span>
              </button>
            </div>
          </div>
          
          {/* 2. 지도 영역 */}
          <div className="h-64 md:h-80 w-full">
             {hasPlansWithLocation ? (
               <TripMap schedules={currentData.plans} />
             ) : (
               <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                 <MapPin className="w-8 h-8 mb-2 opacity-20" />
                 <p className="text-sm">지도에 표시할 장소가 없습니다.</p>
               </div>
             )}
          </div>

        </div>
          {/* 3. 일정 리스트 */}
          <div className="mt-6">
            <div className=" bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={currentData.plans.map(p => p.id)} strategy={verticalListSortingStrategy}>
                  <div className="p-4 sm:p-6 min-h-[400px]">
                    {currentData.plans.length > 0 ? (
                      <div className="flex flex-col">
                        {currentData.plans.map((item, index) => (
                          <ScheduleCard key={item.id} 
                                        item={item} 
                                        isLast={index === currentData.plans.length - 1} 
                                        onEdit={handleEditClick} 
                                        onDelete={handleDeleteSchedule} />
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                        <Calendar className="w-12 h-12 mb-2 opacity-20" />
                        <p>아직 등록된 일정이 없어요.</p>
                        <button onClick={handleAddClick} className="mt-2 text-blue-500 font-bold hover:underline">첫 일정 추가하기</button>
                      </div>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
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

      {/* AI 추천 모달 */}
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