import React from 'react';
import { iconMap, ICON_KEYS } from '@/utils/iconMap';

interface Props {
  selectedIcon: string;             // 부모가 알려주는 "현재 선택된 아이콘 이름"
  onSelect: (iconKey: string) => void; // 아이콘을 클릭했을 때 부모에게 알리는 함수
}

export default function IconSelector({ selectedIcon, onSelect }: Props) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {ICON_KEYS.map((key) => (
        <button
          key={key}
          type="button" // 폼 안에서 자동으로 제출(submit)되는 것을 방지
          onClick={() => onSelect(key)}
          className={`
            p-3 rounded-xl flex items-center justify-center transition-all
            border-2 h-14
            ${selectedIcon === key 
              ? 'border-rose-500 bg-rose-50 text-rose-500 shadow-sm ring-1 ring-rose-500' // 선택됨
              : 'border-gray-100 bg-white text-gray-400 hover:bg-gray-50 hover:border-gray-300' // 선택 안 됨
            }
          `}
        >
          {/* 아이콘 출력 */}
          <div className="w-6 h-6 flex items-center justify-center">
            {iconMap[key]}
          </div>
        </button>
      ))}
    </div>
  );
}