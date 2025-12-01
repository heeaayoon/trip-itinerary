import { ItineraryDay } from '@/types/itinerary';

interface Props {
  days: ItineraryDay[];
  activeTab: number;
  onTabChange: (index: number) => void;
}

export default function DayTabs({ days, activeTab, onTabChange }: Props) {
  return (
    <div className="flex gap-2 mb-6 overflow-x-auto">
      {days.map((item, idx) => (
        <button
          key={idx}
          onClick={() => onTabChange(idx)}
          className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all duration-300 ${
            activeTab === idx
              ? 'bg-rose-500 text-white shadow-md transform -translate-y-1'
              : 'bg-white text-gray-500 hover:bg-gray-100'
          }`}
        >
          <div className="text-xs opacity-80">{item.date}</div>
          <div className="text-lg">{item.day}</div>
        </button>
      ))}
    </div>
  );
}