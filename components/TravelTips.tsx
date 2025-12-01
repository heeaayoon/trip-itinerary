import React from 'react';
import { Star } from 'lucide-react';

// 데이터 타입 정의 (별도 types 파일이 있다면 거기서 import 하셔도 됩니다)
export interface Consideration {
  text: string;
  desc: string;
}

interface Props {
  tips: Consideration[];
}

export default function TravelTips({ tips }: Props) {
  return (
    <div className="flex flex-col gap-4 h-full">
      {tips.map((item, idx) => (
        <div 
          key={idx} 
          className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex-1"
        >
          <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            {item.text}
          </h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            {item.desc}
          </p>
        </div>
      ))}
    </div>
  );
}