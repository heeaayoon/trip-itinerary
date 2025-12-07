import { Heart } from 'lucide-react';
// ▼▼▼ 정리된 타입 파일에서 TripHeaderInfo를 가져옵니다. ▼▼▼
import { TripHeaderInfo } from '@/types/db'; 

export default function TripHeader({ info }: { info: TripHeaderInfo }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border-t-4 border-blue-400">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{info.title}</h1>
          <p className="text-gray-600 font-medium flex items-center gap-2">
            <span className="bg-blue-100 text- px-3 py-1 rounded-full text-sm">
              {info.dates}
            </span>
            {/* location 정보가 있다면 보여주는 것도 좋습니다. */}
            {info.location && (
               <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                {info.location}
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}