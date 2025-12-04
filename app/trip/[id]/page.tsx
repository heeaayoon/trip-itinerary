// src/app/trips/[id]/page.tsx
import Link from 'next/link';
import { getTripFullData } from '@/lib/trip-service'; // 1단계에서 만든 함수
import TripMainView from '@/components/TripMainView'; // 2단계에서 만든 컴포넌트

export default async function TripDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  
  // 🔥 모든 복잡한 데이터 로직은 여기서 처리 (Server Side)
  const fullData = await getTripFullData(id);

  // 데이터가 없을 때 (404 처리)
  if (!fullData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center p-10">
          <h2 className="text-2xl font-bold text-gray-700 mb-2">여행정보를 찾을 수 없습니다. 😢</h2>
          <Link href="/" className="text-sky-600 hover:underline">홈으로 돌아가기</Link>
        </div>
      </div>
    );
  }

  // 화면 렌더링은 Client Component에게 위임
  return (
    <main className="min-h-screen bg-stone-50 py-10 px-4">
      <TripMainView data={fullData} />
    </main>
  );
}