// components/FlightInputSection.tsx
import React from 'react';
import { Plane, PlaneTakeoff, PlaneLanding } from 'lucide-react';

interface Props {
  outDept: string; setOutDept: (v: string) => void;
  outArr: string; setOutArr: (v: string) => void;
  inDept: string; setInDept: (v: string) => void;
  inArr: string; setInArr: (v: string) => void;
}

export default function FlightInputSection({ 
  outDept, setOutDept, outArr, setOutArr, 
  inDept, setInDept, inArr, setInArr 
}: Props) {
  return (
    <div className="bg-sky-50 p-5 rounded-2xl border border-sky-100 space-y-4 animate-fadeIn">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 bg-white rounded-full shadow-sm text-sky-600">
          <Plane className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-gray-800 text-sm">항공편 상세 일정</h3>
          <p className="text-xs text-sky-600">AI가 비행 시간을 스케줄에 포함시켜 드려요.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 가는 편 */}
        <div className="bg-white p-4 rounded-xl border border-sky-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-sky-700 font-bold text-sm">
            <PlaneTakeoff className="w-4 h-4" /> 가는 편 (출국)
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">출발 시간 (집/공항)</label>
              <input type="time" value={outDept} onChange={(e) => setOutDept(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-sky-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">도착 시간 (여행지)</label>
              <input type="time" value={outArr} onChange={(e) => setOutArr(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-sky-500 transition-colors" />
            </div>
          </div>
        </div>

        {/* 오는 편 */}
        <div className="bg-white p-4 rounded-xl border border-sky-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-sky-700 font-bold text-sm">
            <PlaneLanding className="w-4 h-4" /> 오는 편 (귀국)
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">출발 시간 (여행지)</label>
              <input type="time" value={inDept} onChange={(e) => setInDept(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-sky-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">도착 시간 (집/공항)</label>
              <input type="time" value={inArr} onChange={(e) => setInArr(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-sky-500 transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}