import { Heart } from 'lucide-react';
import { TripInfo } from '@/types/itinerary';

export default function TripHeader({ info }: { info: TripInfo }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border-t-4 border-rose-400">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{info.title}</h1>
          <p className="text-gray-600 font-medium flex items-center gap-2">
            <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-sm">
              {info.dates}
            </span>
          </p>
        </div>
        <Heart className="w-10 h-10 text-rose-400 fill-current" />
      </div>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 bg-gray-50 p-4 rounded-xl">
        <div><span className="font-bold text-gray-700">날씨:</span> {info.weather}</div>
        <div><span className="font-bold text-gray-700">컨셉:</span> {info.theme}</div>
      </div>
    </div>
  );
}