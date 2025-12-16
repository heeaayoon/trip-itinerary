"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit2, Trash2, MoreVertical } from 'lucide-react';
import { TripSchedule } from '@/types/db';
import { ICON_CONFIG } from '@/utils/iconMap';
import FlightCard from './FlightCard';
import StandardCard from './StandardCard';

interface Props {
  item: TripSchedule;
  isLast: boolean;
  onEdit: (item: TripSchedule) => void;
  onDelete: (id: string) => void;
}

export default function ScheduleCard({ item, isLast, onEdit, onDelete }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const dndStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const config = ICON_CONFIG[item.icon];
  const ringColor = config ? config.style.border : 'ring-gray-300';

  return (
    // 🔥 1. 최상위 div: dnd 속성, group, 간격(pb-6) 담당
    <div ref={setNodeRef} style={dndStyle} {...attributes} className="group relative touch-none pb-6 last:pb-0">
      
      {/* 🔥 2. 메인 컨테이너: 반응형 레이아웃의 핵심 */}
      {/* 모바일에서는 세로(flex-col), 데스크탑(md:)에서는 가로(md:flex-row)로 배치 */}
      <div className="flex flex-col md:flex-row md:items-start md:gap-4">

        {/* [왼쪽] 핸들 + 시간 영역 */}
        <div className="flex items-center w-full md:w-24 shrink-0 mb-2 md:mb-0 md:pt-3">
          {/* 핸들 */}
          <div {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600 p-1">
            <MoreVertical className="w-5 h-5" />
          </div>
          {/* 시간 */}
          <p className="font-bold text-gray-700 text-sm w-16 text-right">
            {item.time?.split('-')[0].trim()}
          </p>
        </div>

        {/* [오른쪽] 카드 영역 */}
        <div className="flex-1">
          <div className="relative transition-all duration-300 transform group-hover:-translate-y-1">
            <div className={`relative rounded-2xl group-hover:ring-2 group-hover:ring-offset-2 ${ringColor}`}>
              
              {item.icon === 'plane' ? (
                <FlightCard item={item} />
              ) : (
                <StandardCard item={item} />
              )}

              {/* 수정/삭제 버튼 */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(item)} className="p-2 bg-white/70 backdrop-blur-sm rounded-full shadow-md text-gray-500 hover:text-sky-600">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(item.id)} className="p-2 bg-white/70 backdrop-blur-sm rounded-full shadow-md text-gray-500 hover:text-rose-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}