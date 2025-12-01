// 1. 컴포넌트 불러오기
import TripHeader from '@/components/TripHeader';
import TripSchedule from '@/components/DailySchedule';
import TravelTips from '@/components/TravelTips';
import SharedNote from '@/components/SharedNote';

// 2. 데이터 불러오기 (DB에서 가져오는 것처럼 분리된 파일에서 import)
import { tripInfo, itinerary, considerations } from '@/data/tripData';

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-50 py-10 px-4">
      <div className="max-w-3xl mx-auto font-sans">
        
        {/* ① 여행 헤더 (제목, 날씨, 테마) */}
        {/* 서버 컴포넌트라 렌더링이 빠릅니다. */}
        <TripHeader info={tripInfo} />

        {/* ② 여행 일정 스케줄 (탭 + 리스트) */}
        {/* 클릭 이벤트가 필요한 부분은 이 안에서 ('use client') 처리됩니다. */}
        <TripSchedule itinerary={itinerary} />

        {/* ③ 하단 정보 영역 (꿀팁 & 공유 메모) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* 꿀팁 리스트 */}
          <TravelTips tips={considerations} />
          
          {/* 공유 메모 (Supabase 연동) */}
          <SharedNote />
          
        </div>

      </div>
    </main>
  );
}