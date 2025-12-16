"use client";

import { ICON_CONFIG } from '@/utils/iconMap';

interface Props {
  selectedIcon: string;
  onSelect: (icon: string) => void;
}

export default function IconSelector({ selectedIcon, onSelect }: Props) {
  const iconKeys = Object.keys(ICON_CONFIG);

  return (
    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-3 w-full place-items-center">
      {iconKeys.map((key) => {
        const config = ICON_CONFIG[key];
        const isSelected = selectedIcon === key;
        const IconComponent = config.Icon;
        
        // 🔥 [핵심] 조립하지 않고 설정 파일의 클래스를 그대로 사용
        const { active, hover } = config.style;

        // 1. 선택됨: 정의된 Active 스타일 + 그림자/링 효과
        const activeClass = `${active} shadow-lg ring-2 ring-offset-1 scale-110 font-bold z-10`;
        
        // 2. 기본: 회색 + 정의된 Hover 스타일
        const inactiveClass = `bg-gray-50 text-gray-400 ${hover} hover:scale-105`;

        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={`
              flex flex-col items-center justify-center
              w-16 h-16 rounded-2xl transition-all duration-300 ease-in-out
              ${isSelected ? activeClass : inactiveClass}
            `}
            title={config.label}
          >
            <IconComponent 
              className={`w-6 h-6 mb-1 ${isSelected ? 'stroke-[2.5px]' : 'stroke-2'}`} 
            />
            <span className="text-[10px] tracking-wide">{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}