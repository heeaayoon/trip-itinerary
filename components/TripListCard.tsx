"use client";

import Link from 'next/link';
import { Trash2, Calendar } from 'lucide-react';
import { deleteTrip } from '@/lib/actions';
import { TripForList } from '@/types/db';
import { useTransition } from 'react';

interface Props {
  trip: TripForList;
  onDeleteSuccess: () => void;
}

export default function TripListCard({ trip, onDeleteSuccess }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = async (e: React.MouseEvent) => {
    // 클릭 이벤트가 부모(Link)로 전파되는 것을 막습니다.
    e.preventDefault(); 
    e.stopPropagation();

    if (!confirm(`정말 "${trip.title}" 여행을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`)) return;

    startTransition(async () => {
      try {
        await deleteTrip(trip.id);
        onDeleteSuccess();
      } catch (error) {
        alert("삭제에 실패했습니다.");
      }
    });
  };

  return (
    <Link
      href={`/trip/${trip.id}`} // 폴더명에 맞게 경로 확인 (/trip 또는 /trips)
      // 🔥 [핵심 1] 부모 요소에 'group' 클래스를 줍니다.
      className="group block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-all relative border border-transparent hover:border-sky-100"
    >
      <div className="flex justify-between items-start">
        {/* 왼쪽: 여행 정보 */}
        <div>
          <h2 className="text-2xl font-semibold text-sky-700 group-hover:text-sky-600 transition-colors">
            {trip.title}
          </h2>
          <div className="flex items-center text-gray-500 mt-2 text-sm">
            <Calendar className="w-4 h-4 mr-1" />
            {trip.start_date} ~ {trip.end_date}
          </div>
          {trip.theme && (
            <span className="inline-block bg-sky-50 text-sky-600 text-xs mt-3 px-2 py-1 rounded-md font-medium">
              #{trip.theme}
            </span>
          )}
        </div>

        {/* 오른쪽: 삭제 버튼 */}
        <button
          onClick={handleDelete}
          disabled={isPending}
          // 🔥 [핵심 2] 평소엔 opacity-0 (투명), 부모가 호버되면(group-hover) opacity-100 (불투명)
          className="
            opacity-0 group-hover:opacity-100 
            transition-opacity duration-200 
            p-2 rounded-full 
            text-gray-300 hover:text-red-500 hover:bg-red-50
          "
          title="여행 삭제"
        >
          {isPending ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin" />
          ) : (
            <Trash2 className="w-5 h-5" />
          )}
        </button>
      </div>
    </Link>
  );
}