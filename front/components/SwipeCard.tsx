"use client";

import { MapPin, Star, X, Check } from 'lucide-react';

export interface PlaceData {
  place_id: string;
  name: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;   // 🔥 [추가] 가격대 (0~4)
  vicinity?: string;
  geometry?: {
    location: google.maps.LatLng;
  };
  photos?: google.maps.places.PlacePhoto[];
  types?: string[];
}

interface Props {
  place: PlaceData;
  onVote: (like: boolean) => void; // 🔥 부모에게 결과를 전달할 함수 추가
}

export default function SwipeCard({ place, onVote }: Props) {
  let photoUrl = 'https://via.placeholder.com/400x400?text=No+Image';
  const photo = place.photos && place.photos.length > 0 ? place.photos[0] : null;

  if (photo) {
    try {
      // @ts-ignore
      if (typeof photo.getURI === 'function') {
        // @ts-ignore
        photoUrl = photo.getURI(); 
      }
      else if (typeof photo.getUrl === 'function') {
        photoUrl = photo.getUrl({ maxWidth: 400, maxHeight: 400 });
      }
    } catch (e) { console.warn(e); }
  }

  
  // 🔥 가격대 렌더링 함수 (숫자 -> ₩₩₩)
  const renderPrice = (level?: number) => {
    // 1. 정보가 없으면(undefined/null) 아무것도 안 보여줌
    if (level === undefined || level === null||level === 0) return null;
    // 3. 그 외(1~4)는 개수만큼 반복
    return (
      <span className="text-gray-400 font-normal ml-1 border-l border-gray-300 pl-1">
        {'$'.repeat(level)}
      </span>
    );
  };

  return (
    <div className="w-full h-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 relative select-none flex flex-col">
      
      {/* 🔥 [이미지 높이 고정] 
        기존 % 대신 h-80 (320px) 등으로 고정하여 들쭉날쭉함 방지 
      */}
      <div className="relative w-full h-80 shrink-0 bg-gray-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={photoUrl} 
          alt={place.name} 
          className="w-full h-full object-cover pointer-events-none" 
        />
        
        {/* 평점 & 가격 뱃지 */}
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm z-10 border border-gray-100">
          <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
          <span className="font-bold text-sm text-gray-800">{place.rating || "N/A"}</span>
          
          {/* 가격 정보 표시 */}
          {renderPrice(place.price_level)}
        </div>

        {/* 🔥 [핵심] 카드 내부 버튼 오버레이 */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-8 z-20">
          <button 
            onClick={(e) => { e.stopPropagation(); onVote(false); }}
            className="w-14 h-14 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-red-500 hover:scale-110 hover:bg-red-50 transition-all active:scale-95"
          >
            <X className="w-8 h-8" />
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onVote(true); }}
            className="w-14 h-14 bg-indigo-600/90 backdrop-blur-md rounded-full shadow-lg border border-indigo-500 flex items-center justify-center text-white hover:scale-110 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <Check className="w-8 h-8" />
          </button>
        </div>
        
        {/* 그라데이션 (텍스트 가독성용) */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/40 to-transparent pointer-events-none" />
      </div>

      {/* 정보 영역 */}
      <div className="p-5 h-[30%] bg-white flex flex-col justify-center">
        <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-1 leading-tight">
          {place.name}
        </h3>
        <div className="flex items-start gap-1.5 text-gray-500 text-sm mb-3">
          <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
          <p className="line-clamp-2 text-xs">{place.vicinity}</p>
        </div>
        
        <div className="flex gap-2">
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-lg">
            {place.types?.[0] || '장소'}
          </span>
          {place.user_ratings_total && (
            <span className="px-2 py-1 bg-sky-50 text-sky-600 text-[10px] font-bold rounded-lg">
              리뷰 {place.user_ratings_total}+
            </span>
          )}
        </div>
      </div>
    </div>
  );
}