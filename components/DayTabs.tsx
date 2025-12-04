// src/components/DayTabs.tsx
"use client";

import Image from 'next/image';
import { Plus, X } from 'lucide-react'; // 아이콘

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
  onDeleteDay: (index: number) => void; // 🔥 삭제 핸들러 (인덱스로 처리)
  isUpdating: boolean;            // 로딩 상태
}

export default function DayTabs({ scheduleData, activeTab, onTabChange, onAddDay, onDeleteDay, isUpdating }: Props) {
  return (
    <div className="w-full border-b border-gray-200 bg-white">
      <div className="flex overflow-x-auto pb-2 px-4 scrollbar-hide gap-2 items-center">
        
        {scheduleData.map((item, index) => {
          const isActive = activeTab === index;
          
          return (
            <div key={item.date} className="relative group shrink-0">
              <button
                onClick={() => onTabChange(index)}
                className={`
                  flex flex-col items-center justify-center
                  min-w-[100px] py-3 px-2 rounded-xl transition-all duration-300 h-full border border-transparent
                  ${isActive 
                    ? 'bg-rose-500 text-white shadow-md transform -translate-y-1' 
                    : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-100'
                  }
                `}
              >
                <div className={`text-xs mb-1 ${isActive ? 'text-rose-100' : 'text-gray-400'}`}>
                  {item.date.slice(5).replace('-', '.')}
                </div>
                <div className="text-lg font-bold mb-1">
                  Day {item.day}
                </div>

                {/* 날씨 정보 표시 */}
                {item.weather ? (
                  <div className="flex items-center gap-1 mt-1 bg-white/20 rounded-full px-2 py-0.5">
                    <div className="relative w-5 h-5">
                      <Image 
                        src={`https://raw.githubusercontent.com/visualcrossing/WeatherIcons/main/SVG/4th%20Set%20-%20Color/${item.weather.icon}.svg`}
                        alt="icon" fill className="object-contain"
                      />
                    </div>
                    <span className={`text-[10px] font-medium ${isActive ? 'text-white' : 'text-gray-600'}`}>
                      {item.weather.tempMax}°
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] opacity-50 h-[22px] flex items-center">No Data</span>
                )}
              </button>

              {/* 🔥 [NEW] 삭제 버튼 (마지막 날짜에만 표시 or 모든 날짜에 표시) */}
              {/* 로직 꼬임을 방지하기 위해 일단 '마지막 날짜'인 경우에만 삭제 버튼을 보여줍니다. */}
              {index === scheduleData.length - 1 && scheduleData.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // 탭 이동 방지
                    onDeleteDay(index);
                  }}
                  disabled={isUpdating}
                  className="
                    absolute -top-2 -right-2 bg-gray-600 text-white rounded-full p-1 shadow-md
                    opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-500 z-10
                  "
                  title="이 날짜 삭제 (기간 단축)"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {/* 날짜 추가 버튼 */}
        <button
          onClick={onAddDay}
          disabled={isUpdating}
          className="flex flex-col shrink-0 items-center justify-center w-[60px] h-[90px] 
                     rounded-xl border-2 border-dashed border-gray-300 text-gray-400 
                     hover:border-rose-400 hover:text-rose-500 hover:bg-rose-50 
                     disabled:opacity-50 transition-all"
        >
           {isUpdating ? (
             <div className="w-5 h-5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
           ) : (
             <>
               <Plus className="w-6 h-6 mb-1" />
               <span className="text-[10px] font-bold">Day 추가</span>
             </>
           )}
        </button>

      </div>
    </div>
  );
}