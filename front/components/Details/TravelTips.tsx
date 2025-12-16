'use client';

import React from 'react';
import { Star, Plus } from 'lucide-react'; // Plus 아이콘 추가
import { TripTip } from '@/types/db';

interface Props {
  tips: TripTip[];
}

export default function TravelTips({ tips }: Props) {
  return (
    <div className="w-full">
      {/* ▼▼▼ [추가] SharedNote와 동일한 헤더 및 추가 버튼 영역 ▼▼▼ */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
          💡 여행 꿀팁
        </h3>
        <button className="px-3 py-1.5 bg-yellow-500 text-white text-sm font-bold rounded-lg hover:bg-yellow-600 flex items-center gap-1 transition-colors">
          <Plus size={16} />
          팁 추가
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {tips.length > 0 ? (
          tips.map((item) => (
            <div 
              key={item.id} 
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex-1 relative group"
            >
              {/* ▼▼▼ [추가] 마우스 올렸을 때 삭제/수정 버튼이 나오게 할 수도 있음 (공유노트와 동일 로직) ▼▼▼ */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                 <button className="text-xs text-gray-400 hover:text-gray-600">수정</button>
                 <button className="text-xs text-red-400 hover:text-red-600">삭제</button>
              </div>

              <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                {item.text}
              </h4>
              
              {/* description이 있을 때만 렌더링 */}
              {item.description && (
                <p className="text-sm text-gray-600 leading-relaxed pl-6">
                  {item.description}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
             <p>등록된 여행 팁이 없습니다.</p>
             <p className="text-sm mt-1">잊지 말아야 할 것들을 기록해보세요!</p>
          </div>
        )}
      </div>
    </div>
  );
}