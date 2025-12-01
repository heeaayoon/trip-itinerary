import React from 'react';
import { supabase } from '@/lib/supabase'; // Supabase 클라이언트 import

// 1. 컴포넌트 불러오기
import TripHeader from '@/components/TripHeader';
import TripSchedule from '@/components/DailySchedule'; // 이름이 DailySchedule로 되어 있다면 유지
import TravelTips from '@/components/TravelTips';
import SharedNote from '@/components/SharedNote';

// 2. [중요] DB 데이터 타입 불러오기 (아까 만든 파일)
import { Trip } from '@/types/db';

// 3. 데이터 가져오는 함수 (서버 사이드)
async function getTripData() {
  const { data, error } = await supabase
    .from('Trips') // 테이블 이름이 대문자(Trips)인지 소문자(trips)인지 꼭 확인하세요!
    .select(`
      *,
      Days (
        *,
        Schedules (*)
      )
    `)
    // 정렬: 날짜 순(day_number), 시간 순(time)
    .order('day_number', { foreignTable: 'Days', ascending: true })
    .order('time', { foreignTable: 'Days.Schedules', ascending: true })
    .limit(1) // 여행이 여러 개여도 일단 1개만 가져옴
    .single();

  if (error) {
    console.error('DB 에러:', error);
    return null;
  }

  return data as Trip; // DB에서 온 데이터를 Trip 타입으로 취급
}

// 4. 메인 컴포넌트 (async 필수!)
export default async function Home() {
  // DB에서 데이터 가져오기
  const trip = await getTripData();

  // 데이터가 없을 때 (DB가 비었거나 에러)
  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center p-10">
          <h2 className="text-2xl font-bold text-gray-700 mb-2">데이터가 없습니다 😢</h2>
          <p className="text-gray-500">Supabase 테이블에 여행 정보를 추가해주세요.</p>
        </div>
      </div>
    );
  }

  // 5. 컴포넌트에 넘겨줄 데이터 가공
  // (TripHeader가 좋아하는 모양으로 변환)
  const tripInfo = {
    title: trip.title,
    dates: `${trip.start_date} ~ ${trip.end_date}`,
    theme: trip.theme,
    weather: trip.weather_info
  };

  // 꿀팁은 아직 DB에 테이블을 안 만들었으므로 일단 하드코딩 유지 (나중에 테이블 추가 가능)
  const considerations = [
    { text: "이동 최소화", desc: "4인 기준 택시비 N분의 1 하면 부담스럽지 않습니다." },
    { text: "쇼핑 스팟", desc: "시모토리 아케이드, 츠루야 백화점, 아뮤플라자 추천." },
    { text: "음식", desc: "아카우시(소고기), 두부 요리, 장어 추천." },
    { text: "준비물", desc: "편한 신발, 스카프, 110v 돼지코." }
  ];

  return (
    <main className="min-h-screen bg-stone-50 py-10 px-4">
      <div className="max-w-3xl mx-auto font-sans">
        
        {/* ① 여행 헤더 */}
        <TripHeader info={tripInfo} />

        {/* ② 여행 일정 스케줄 */}
        <TripSchedule tripId={trip.id} days={trip.Days} />

        {/* ③ 하단 정보 영역 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TravelTips tips={considerations} />
          <SharedNote />
        </div>

      </div>
    </main>
  );
}