'use client'; // 상태(useState)가 있으므로 클라이언트 컴포넌트 유지

import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { ItineraryDay } from '@/types/itinerary';
import DayTabs from './DayTabs'; // 👈 분리한 컴포넌트 import

interface Props {
  itinerary: ItineraryDay[];
}

export default function TripSchedule({ itinerary }: Props) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <>
      {/* 1. 탭 버튼 영역 (분리된 컴포넌트 사용) */}
      <DayTabs 
        days={itinerary} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} // setActiveTab 함수 자체를 넘겨줌
      />

      {/* 2. 일별 상세 일정 영역 */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 pb-4 border-b">
          <MapPin className="text-rose-500" />
          {itinerary[activeTab].theme}
        </h2>
        
        <div className="space-y-6">
          {itinerary[activeTab].schedule.map((item, idx) => (
            <div key={idx} className="relative pl-8 border-l-2 border-rose-200 last:border-0 pb-6 last:pb-0">
              <div className="absolute -left-[9px] top-0 bg-white p-1 rounded-full border border-rose-200">
                {item.icon}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-1">
                <span className="font-bold text-rose-600 text-lg w-16 shrink-0">{item.time}</span>
                <h3 className="font-bold text-gray-800 text-lg">{item.activity}</h3>
              </div>
              <p className="text-gray-600 mb-2">{item.desc}</p>
              {item.tips && (
                <div className="bg-amber-50 text-amber-800 text-sm p-3 rounded-lg inline-block">
                  <span className="font-bold">💡 Tip:</span> {item.tips}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}