'use client';

import { useState, useEffect } from 'react';
import { X, CalendarPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { TripDay } from '@/types/db';

interface Props {
  tripId: string;       // 여행 ID
  days: TripDay[];      // 기존 날짜 목록 (다음 날짜 계산용)
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddDayModal({ tripId, days, isOpen, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState('');
  
  // 계산된 다음 날짜 정보 (보여주기용)
  const [nextDayInfo, setNextDayInfo] = useState({ number: 1, date: '' });

  // 모달이 열릴 때마다 '다음 날짜'와 '날짜 번호'를 자동 계산
  useEffect(() => {
    if (isOpen) {
      const lastDay = days[days.length - 1];
      const nextNum = lastDay ? lastDay.day_number + 1 : 1;
      
      let nextDateStr = "";
      if (lastDay && lastDay.date) {
        const dateObj = new Date(lastDay.date);
        dateObj.setDate(dateObj.getDate() + 1); // 하루 더하기
        nextDateStr = dateObj.toISOString().split('T')[0];
      } else {
        nextDateStr = new Date().toISOString().split('T')[0]; // 데이터 없으면 오늘
      }

      setNextDayInfo({ number: nextNum, date: nextDateStr });
      setTheme(''); // 입력창 초기화
    }
  }, [isOpen, days]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!theme.trim()) return alert("테마를 입력해주세요!");

    setLoading(true);

    // Supabase에 Day 추가 (테이블명 대문자 'Days' 확인!)
    const { error } = await supabase
      .from('Days')
      .insert({
        trip_id: tripId,
        day_number: nextDayInfo.number,
        date: nextDayInfo.date,
        day_theme: theme
      });

    setLoading(false);

    if (error) {
      console.error(error);
      alert("날짜 추가 중 오류가 발생했습니다.");
    } else {
      alert(`${nextDayInfo.number}일차가 추가되었습니다! 📅`);
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl relative">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2 flex items-center gap-2">
          <CalendarPlus className="text-rose-500" />
          Day 추가하기
        </h2>

        <div className="mb-6 bg-rose-50 p-4 rounded-xl text-rose-800 text-sm">
          <p className="font-bold text-lg mb-1">{nextDayInfo.number}일차</p>
          <p>{nextDayInfo.date} 날짜로 생성됩니다.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-600 block mb-1">
              오늘의 테마 (제목)
            </label>
            <input 
              type="text" 
              placeholder="예: 아쉬운 귀국일, 근교 여행 등"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-rose-200 outline-none"
              autoFocus
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition-all shadow-md mt-2"
          >
            {loading ? "생성 중..." : "새 날짜 만들기"}
          </button>
        </form>
      </div>
    </div>
  );
}