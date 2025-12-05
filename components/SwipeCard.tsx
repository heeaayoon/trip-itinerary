"use client";

import { MapPin, Star } from 'lucide-react';

export interface PlaceData {
  place_id: string;
  name: string;
  rating?: number;
  user_ratings_total?: number;
  vicinity?: string;
  geometry?: {
    location: google.maps.LatLng;
  };
  photos?: google.maps.places.PlacePhoto[];
  types?: string[];
}

interface Props {
  place: PlaceData;
}

export default function SwipeCard({ place }: Props) {
  // 🔥 [핵심 수정] 이미지 URL 가져오는 로직 개선 (New API 대응)
  let photoUrl = 'https://via.placeholder.com/400x400?text=No+Image';
  
  const photo = place.photos && place.photos.length > 0 ? place.photos[0] : null;

  if (photo) {
    try {
      // 1. 최신 API (Place Class) 방식: .getURI()
      // @ts-ignore (타입 정의가 구버전일 경우를 대비해 ignore 처리)
      if (typeof photo.getURI === 'function') {
        // @ts-ignore
        photoUrl = photo.getURI(); 
      }
      // 2. 구버전 API (PlacesService) 방식: .getUrl()
      else if (typeof photo.getUrl === 'function') {
        photoUrl = photo.getUrl({ maxWidth: 400, maxHeight: 400 });
      }
    } catch (e) {
      console.warn("이미지 URL을 가져오는 데 실패했습니다.", e);
    }
  }

  return (
    <div className="w-full h-full bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100 relative select-none">
      
      {/* 이미지 영역 (60%) */}
      <div className="relative w-full h-[60%] bg-gray-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={photoUrl} 
          alt={place.name} 
          className="w-full h-full object-cover pointer-events-none" 
        />
        {/* 평점 뱃지 */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          <span className="font-bold text-sm text-gray-800">{place.rating || "N/A"}</span>
        </div>
      </div>

      {/* 정보 영역 (40%) */}
      <div className="p-6 h-[40%] flex flex-col justify-between bg-white">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
            {place.name}
          </h3>
          <div className="flex items-start gap-1.5 text-gray-500 text-sm">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
            <p className="line-clamp-2">{place.vicinity}</p>
          </div>
        </div>
        
        <div className="flex gap-2 mt-2">
          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg">
            {place.types?.[0] || '장소'}
          </span>
          {place.user_ratings_total && (
            <span className="px-3 py-1 bg-sky-50 text-sky-600 text-xs font-bold rounded-lg">
              리뷰 {place.user_ratings_total}+
            </span>
          )}
        </div>
      </div>
    </div>
  );
}