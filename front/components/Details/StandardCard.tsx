import { TripSchedule } from '@/types/db';
import { getIcon, ICON_CONFIG } from '@/utils/iconMap';

interface Props {
  item: TripSchedule;
}

const DEFAULT_CONFIG = {
  label: '일정',
  style: { text: 'text-gray-600', iconBg: 'bg-gray-100' }
};

export default function StandardCard({ item }: Props) {
  const config = ICON_CONFIG[item.icon] || DEFAULT_CONFIG;
  const style = config.style;

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-4"> {/* 👈 여기를 items-center로 변경하면 좋습니다 */}
        
        {/* 🔥 [수정] 아이콘 + 라벨 컨테이너 */}
        <div className="flex flex-col items-center justify-center w-16 shrink-0">
          {/* 아이콘 */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${style.bg} ${style.text}`}>
            {getIcon(item.icon || 'default')}
          </div>
          {/* 라벨 (아이콘 아래) */}
          <p className={`mt-1.5 text-xs font-bold transition-colors ${style.text}`}>
            {config.label}
          </p>
        </div>
        
        {/* 내용 */}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800 tracking-tight">{item.activity}</h3>
          {item.description && (
            <p className="mt-1 text-sm text-gray-600">{item.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}