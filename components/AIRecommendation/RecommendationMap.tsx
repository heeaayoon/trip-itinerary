
import { Polyline } from '../Polyline';
import { X, Sparkles, Check, RefreshCw, ThumbsUp, MapPin, Utensils, Coffee, Beer, Camera } from 'lucide-react';
import { APIProvider, Map, useMap, useMapsLibrary, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

interface MapProps {
  step: string;
  schedules: any[];
  candidates: any[];
  currentIndex: number;
}

export default function RecommendationMap({ step, schedules, candidates, currentIndex }: MapProps) {
  return (
        <div className={`w-full transition-all duration-500 ease-in-out ${step === 'input' ? 'h-0 opacity-0' : 'h-[40%] shrink-0 relative'}`}>
         <Map defaultZoom={14} 
              defaultCenter={{ lat: 37.5665, lng: 126.9780 }} 
              disableDefaultUI={false}
              mapId="DEMO_MAP_ID" // 🔥 AdvancedMarker를 쓰려면 Map ID가 필요함 (구글 클라우드 콘솔에서 생성 추천, 없으면 DEMO_MAP_ID)
              style={{ width: '100%', height: '100%' }} >

            {/* 🔥 [추가] 일정들을 잇는 선 그리기 (화살표 포함) */}
            {schedules.length > 1 && (
               <Polyline 
                 path={schedules.map(s => ({ lat: s.lat, lng: s.lng }))}
                 strokeColor="#4B5563" // 회색 (Gray-600)
                 strokeOpacity={0.6}   // 투명도
                 strokeWeight={3}      // 두께
                 geodesic={true}
                 icons={[              // 선 중간에 화살표 표시
                   {
                     icon: { 
                       path: 2, // 2 = google.maps.SymbolPath.FORWARD_CLOSED_ARROW
                       scale: 3 // 화살표 크기 조절 (선택사항)
                     },    
                     offset: '50%',      // 선의 중간
                     repeat: '100px'     // 100px 간격 반복
                   }
                 ]}
               />
            )}
            {/* 1. 기존 일정 마커들 (회색/작게) */}
            {schedules.map((marker) => (
               <AdvancedMarker 
                 key={marker.id} 
                 position={{ lat: marker.lat, lng: marker.lng }}
                 zIndex={10} // 추천 장소보다 아래
               >
                 <div className="flex flex-col items-center">
                    <div className="w-6 h-6 bg-gray-600 rounded-full border-2 border-white shadow-md 
                                flex items-center justify-center text-white text-[10px] font-bold">
                       {marker.order}
                    </div>
                    {/* 선택사항: 이름 표시 (너무 복잡하면 제거) */}
                    <span className="text-[10px] bg-white/80 px-1 rounded mt-0.5 font-medium text-gray-600 truncate max-w-20">
                      {marker.activity}
                    </span>
                 </div>
               </AdvancedMarker>
            ))}

            {/* 2. 현재 추천 장소 마커 (빨간색/크게) */}
            {step === 'swipe' && candidates[currentIndex] && candidates[currentIndex].geometry?.location && (
               <AdvancedMarker key="current-candidate"
                               position={candidates[currentIndex].geometry!.location!}
                               zIndex={50} // 제일 위에
                               >
                  <div className="relative flex flex-col items-center">
                     <div className="w-10 h-10 bg-indigo-600 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white animate-bounce">
                        <MapPin className="w-5 h-5 fill-white" />
                     </div>
                     <div className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md mt-1">
                        New
                     </div>
                  </div>
               </AdvancedMarker>
            )}
          </Map>
      </div>
  )
}

