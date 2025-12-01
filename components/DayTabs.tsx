import React from 'react';
import { TripDay } from '@/types/db';
import { Plus, X } from 'lucide-react'; // 아이콘 추가

interface Props {
  days: TripDay[];
  activeTab: number;
  onTabChange: (index: number) => void;
  onAddDay: () => void; // 👈 [NEW] 부모에게 "날짜 추가해줘!"라고 요청하는 함수
  onDeleteDay: (dayId: string) => void; // 👈 [NEW] 삭제 요청 함수 추가
}

export default function DayTabs({ days, activeTab, onTabChange, onAddDay, onDeleteDay }: Props) {
  return (
    <div className="flex gap-2 mb-6 overflow-x-auto items-center pb-2"> {/* pb-2는 그림자 잘림 방지 */}
      {days.map((item, idx) => (
        <div 
          key={item.id} 
          className="relative group shrink-0" // 👈 group 클래스 중요! (자식의 hover 제어)
        >
          <button
            onClick={() => onTabChange(idx)}
            className={`
              py-3 px-4 rounded-xl font-bold transition-all duration-300 min-w-[100px] h-full
              ${activeTab === idx
                ? 'bg-rose-500 text-white shadow-md transform -translate-y-1'
                : 'bg-white text-gray-500 hover:bg-gray-100'
              }
            `}
          >
            <div className="text-xs opacity-80">{item.date}</div>
            <div className="text-lg">{item.day_number}일차</div>
          </button>

          {/* ✨ [NEW] 삭제 버튼 (Hover 시에만 등장) */}
          <button
            onClick={(e) => {
              e.stopPropagation(); // 탭 이동 방지 (삭제만 실행)
              onDeleteDay(item.id);
            }}
            className={`
              absolute -top-2 -right-2 bg-gray-600 text-white rounded-full p-1 shadow-md
              opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-500
              ${activeTab === idx ? 'block' : ''} // 선택된 탭은 조금 더 잘 보이게 처리 가능
            `}
            title="이 날짜 삭제"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}

      {/* ✨ [NEW] 날짜 추가 버튼 */}
      <button
        onClick={onAddDay}
        className="py-3 px-4 rounded-xl border-2 border-dashed border-gray-300 text-gray-400
          hover:border-rose-400 hover:text-rose-500 hover:bg-rose-50
          transition-all duration-300 min-w-[60px] flex flex-col items-center justify-center shrink-0 h-[72px]"
        title="새 날짜 추가"
      >
        <Plus className="w-6 h-6" />
        <span className="text-[10px] font-bold mt-1">Day 추가</span>
      </button>
    </div>
  );
}