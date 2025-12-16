"use client";

import Image from 'next/image';
import { Plus, X } from 'lucide-react';

interface ScheduleItem {
  day: number;
  date: string;
  weather: any;
}

interface Props {
  scheduleData: ScheduleItem[];
  activeTab: number;
  onTabChange: (index: number) => void;
  onAddDay: () => void;           // 날짜 추가 핸들러
  onDeleteDay: (index: number) => void; // 삭제 핸들러
  isUpdating: boolean;            // 로딩 상태
}

export default function DayTabs({ scheduleData, activeTab, onTabChange, onAddDay, onDeleteDay, isUpdating }: Props) {
 const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [_, month, day] = dateStr.split('-');
    return `${month}.${day}`;
  };

  return (
    <div className="w-full bg-white/80 rounded-2xl backdrop-blur-sm sticky top-0 z-20 shadow-sm">
      {/* 🔥 [수정] 삭제 버튼이 잘리지 않도록 상단에 여백(pt-4) 추가 */}
      <div className="flex overflow-x-auto px-4 pt-4 pb-2 custom-scrollbar gap-3 items-start">
        
        {scheduleData.map((item, index) => {
          const isActive = activeTab === index;
          
          return (
            <div key={item.date} className="relative group shrink-0">
              <button
                onClick={() => onTabChange(index)}
                // 🔥 [색상 수정] Blue 계열로 변경
                className={`
                  flex flex-col items-center justify-center
                  w-24 h-24 rounded-2xl transition-all duration-300 border
                  ${isActive 
                    ? 'bg-blue-500 text-white shadow-lg transform -translate-y-1 border-transparent' 
                    : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-100'
                  }
                `}
              >
                {/* Day 번호 */}
                <div className="text-sm font-bold">
                  Day {item.day}
                </div>
                {/* 날짜 (MM.DD) */}
                <div className={`text-xs mb-1 ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>
                  {formatDate(item.date)}
                </div>

              {/* 🔥 [수정] 날씨 정보 표시 부분 */}
              <div className={`flex items-center justify-center h-[26px] mt-1`}>
                {item.weather && item.weather.icon ? (
                  <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${isActive ? 'bg-white/20' : 'bg-gray-100'}`}>
                    <div className="relative w-5 h-5">
                      <Image 
                        key={item.weather.icon} // 아이콘이 바뀔 때 리렌더링을 돕기 위해 key 추가
                        src={`https://raw.githubusercontent.com/visualcrossing/WeatherIcons/main/SVG/4th%20Set%20-%20Color/${item.weather.icon}.svg`}
                        alt={item.weather.desc || 'weather icon'}
                        fill
                        sizes="20px" // 이미지 크기에 대한 힌트 제공
                        className="object-contain"/>
                    </div>
                    <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-gray-700'}`}>
                      {Math.round(item.weather.tempMax)}°
                    </span>
                  </div>
                ) : (
                  // 날씨 정보가 없을 때도 높이를 유지하여 UI가 깨지지 않도록 함
                  <div className="h-[26px]"></div>
                )}
              </div>
            </button>

              {/* 삭제 버튼 */}
              {index === scheduleData.length - 1 && scheduleData.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteDay(index); }}
                  disabled={isUpdating}
                  // 🔥 [수정] z-index를 더 높게 주고, 색상 변경
                  className="absolute -top-1 -right-1 bg-white text-gray-400 rounded-full p-0.5 border shadow-md
                             opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white z-30"
                  title="이 날짜 삭제"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}

        {/* 날짜 추가 버튼 */}
        <button
          onClick={onAddDay}
          disabled={isUpdating}
          // 🔥 [수정] 호버 색상을 Blue 계열로 변경
          className="flex flex-col shrink-0 items-center justify-center w-24 h-24
                     rounded-2xl border-2 border-dashed border-gray-300 text-gray-400 
                     hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 
                     disabled:opacity-50 transition-all"
        >
           {isUpdating ? (
             <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
           ) : (
             <>
               <Plus className="w-6 h-6" />
               <span className="text-xs font-bold mt-1">Day 추가</span>
             </>
           )}
        </button>

      </div>
    </div>
  );
}