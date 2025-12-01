'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import IconSelector from './IconSelector'; // 👈 요청하신 import 부분
import { TripDay } from '@/types/db'; // 타입 import

interface Props {
  days: TripDay[];      // 👈 [수정] 전체 날짜 목록을 받음 (선택지용)
  initialDayId: string; // 👈 [수정] 처음에 선택되어 있을 날짜 ID
    //dayId: string;        // 1. 어느 날짜(TripDay)에 추가할지 ID를 받음
  isOpen: boolean;      // 2. 모달이 열려있는지 여부
  onClose: () => void;  // 3. 닫기 버튼 누르면 실행할 함수
  onSuccess: () => void; // 4. 저장 성공 시 부모에게 알리는 함수 (새로고침용)
}

export default function AddScheduleModal({ days, initialDayId, isOpen, onClose, onSuccess }: Props) {
  // 폼 상태 관리
  // 1. 선택된 날짜 ID 상태 관리 (기본값: props로 받은 초기값)
  const [selectedDayId, setSelectedDayId] = useState(initialDayId);
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState('12:00');
  const [activity, setActivity] = useState('');
  const [description, setDescription] = useState('');
  const [tips, setTips] = useState('');
  const [icon, setIcon] = useState('plane'); // 기본값: 비행기

  // 모달이 닫혀있으면 아무것도 렌더링하지 않음
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // 새로고침 방지

    if (!activity.trim()) {
      alert("활동명을 입력해주세요!");
      return;
    }

    setLoading(true);

    // Supabase에 데이터 저장 (테이블명 대문자 주의!)
    const { error } = await supabase
      .from('Schedules') 
      .insert({
        //day_id: dayId,      // 외래키(Foreign Key) 연결
        day_id: selectedDayId, // 👈 [수정] 사용자가 선택한 날짜 ID로 저장
        time: time,
        activity: activity,
        description: description,
        tips: tips,
        icon: icon          // 선택된 아이콘 문자열(예: 'food') 저장
      });

    setLoading(false);

    if (error) {
      console.error('저장 실패:', error);
      alert("일정 저장 중 오류가 발생했습니다.");
    } else {
      // 성공 시 처리
      alert("일정이 추가되었습니다! 🎉");
      onSuccess(); // 부모 컴포넌트(TripSchedule) 새로고침
      onClose();   // 모달 닫기
      
      // 입력 폼 초기화
      setActivity('');
      setDescription('');
      setTips('');
      setIcon('plane');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      {/* 모달 박스 */}
      <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* 닫기 버튼 (우측 상단) */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">
          새 일정 추가하기
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ✨ 날짜 선택 박스 추가 */}
          <div>
            <label className="text-sm font-bold text-gray-600 block mb-1">날짜 선택</label>
            <select
              value={selectedDayId}
              onChange={(e) => setSelectedDayId(e.target.value)}
              className="w-full border border-gray-300 p-2.5 rounded-xl focus:ring-2 focus:ring-rose-200 outline-none bg-white"
            >
              {days.map((day) => (
                <option key={day.id} value={day.id}>
                  {day.day_number}일차 ({day.date}) - {day.day_theme}
                </option>
              ))}
            </select>
          </div>
          {/* 1. 시간 & 활동명 입력 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="text-sm font-bold text-gray-600 block mb-1">시간</label>
              <input 
                type="time" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full border border-gray-300 p-2.5 rounded-xl focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none transition"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-bold text-gray-600 block mb-1">활동명</label>
              <input 
                type="text" 
                placeholder="예: 맛집 탐방, 체크인"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="w-full border border-gray-300 p-2.5 rounded-xl focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none transition"
              />
            </div>
          </div>

          {/* 2. 상세 설명 */}
          <div>
            <label className="text-sm font-bold text-gray-600 block mb-1">설명</label>
            <textarea 
              placeholder="상세 내용을 적어주세요 (예: 메뉴 추천, 이동 방법 등)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 p-3 rounded-xl h-24 resize-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none transition"
            />
          </div>

          {/* 3. 아이콘 선택 (IconSelector 사용) */}
          <div>
            <label className="text-sm font-bold text-gray-600 block mb-2">아이콘 선택</label>
            {/* 👇 여기서 사용합니다! */}
            <IconSelector selectedIcon={icon} onSelect={setIcon} />
          </div>

          {/* 4. 꿀팁 (선택 사항) */}
          <div>
            <label className="text-sm font-bold text-amber-600 block mb-1">꿀팁 (선택)</label>
            <input 
              type="text" 
              placeholder="예: 웨이팅 있으니 10분 전 도착 필수!"
              value={tips}
              onChange={(e) => setTips(e.target.value)}
              className="w-full border border-amber-200 bg-amber-50 p-2.5 rounded-xl focus:ring-2 focus:ring-amber-200 outline-none placeholder-amber-300/70"
            />
          </div>

          {/* 5. 저장 버튼 */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-[0.98] mt-4"
          >
            {loading ? "저장 중..." : "일정 저장하기 ✨"}
          </button>

        </form>
      </div>
    </div>
  );
}