"use client";

import Link from 'next/link';
import TripHeader from '@/components/Details/TripHeader';
import TripSchedule from '@/components/Details/DailySchedule';
import TravelTips from '@/components/Details/TravelTips';
import SharedNote from '@/components/Details/SharedNote';
import { TripNote, TripTip, TripHeaderInfo, DailyScheduleData } from '@/types/db';

interface Props {
  data: {
    tripHeaderInfo: TripHeaderInfo;
    scheduleData: DailyScheduleData[];
    tripId: string;
    rawDays: any[]; // 이 부분은 AddScheduleModal에서만 사용하므로 any로 두어도 무방
    tripNotes: TripNote[];
    tripTips: TripTip[];
  }
}

export default function TripMainView({ data }: Props) {
  // ▼▼▼ [수정] 비구조화 할당으로 데이터를 명확하게 꺼내 씁니다. ▼▼▼
  const { 
    tripHeaderInfo, 
    scheduleData, 
    tripId, 
    rawDays, 
    tripNotes, 
    tripTips 
  } = data;

  return (
    <div className="max-w-3xl mx-auto font-sans">
      {/* 뒤로가기 링크 */}
      <div className="mb-8">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
                    text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm
                    hover:bg-gray-50 transition-colors">
          ← 목록으로
        </Link>
      </div>

      {/* ① 여행 헤더 */}
      <TripHeader info={tripHeaderInfo} />

      {/* ② 여행 일정 스케줄 (탭 + 리스트) */}
      <TripSchedule 
        tripId={tripId} 
        scheduleData={scheduleData} 
        rawDays={rawDays} 
      />

      {/* ③ 하단 정보 영역 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* ▼▼▼ [수정] DB에서 가져온 실제 팁 데이터(tripTips)를 props로 전달합니다. ▼▼▼ */}
        <TravelTips tips={tripTips} />
        
        {/* ▼▼▼ [수정] DB에서 가져온 실제 노트 데이터(tripNotes)와 tripId를 props로 전달합니다. ▼▼▼ */}
        <SharedNote 
          notes={tripNotes}
          tripId={tripId}
        />
      </div>
    </div>
  );
}