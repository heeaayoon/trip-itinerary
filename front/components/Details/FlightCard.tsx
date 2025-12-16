// components/FlightCard.tsx

import React from 'react';
import { Plane } from 'lucide-react';
import { TripSchedule } from '@/types/db';
import { ICON_CONFIG } from '@/utils/iconMap';

interface Props {
  item: TripSchedule;
}

export default function FlightCard({ item }: Props) {
  const style = ICON_CONFIG.plane.style;

  // 1. 시간 정보
  const startTime = item.time;
  const endTime = item.time_end; // 👈 새로 추가된 컬럼에서 도착 시간을 가져옵니다

  // 2. 공항 정보 (description 파싱)
  const airportParts = item.description?.split('->').map(a => a.trim()) || ['출발공항', '도착공항'];
  const departureAirport = airportParts[0];
  const arrivalAirport = airportParts[1];

  return (
    <div className={`rounded-2xl border-2 p-4 shadow-sm transition-all ${style.border} bg-linear-to-br from-sky-50 to-indigo-50`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${style.bg} ${style.text}`}>
          <Plane className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800">{item.activity}</h3>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white/70 p-3 rounded-lg border border-gray-100">
        {/* 출발 정보 */}
        <div className="text-center">
          <p className="text-xl font-bold text-gray-800">{startTime}</p>
          {/* <p className="text-xs font-medium text-gray-500">{departureAirport}</p> */}
        </div>

        {/* 비행 경로 */}
        <div className="flex-1 flex items-center justify-center text-gray-300">
          <span className="w-full h-px bg-gray-200 relative">
            <Plane className="w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1 text-sky-500" />
          </span>
        </div>

        {/* 도착 정보 */}
        <div className="text-center">
          <p className="text-xl font-bold text-gray-800">{endTime}</p> {/* 👈 도착 시간 표시 */}
          {/* <p className="text-xs font-medium text-gray-500">{arrivalAirport}</p> */}
        </div>
      </div>
    </div>
  );
}