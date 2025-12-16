"use client";

import { useState, useEffect, useRef } from 'react';
import { X, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { APIProvider, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { PlaceData } from '../SwipeCard';
import { calculateNextTime, determineIcon, formatGooglePlace } from './utils';

// 분리한 컴포넌트 import
import RecommendationMap from './RecommendationMap';
import StepInput from './StepInput';
import StepSwipe from './StepSwipe';
import StepResult from './StepResult';

const LIBRARIES: ("places" | "marker")[] = ["places", "marker"];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  currentDayId: string;
  onSuccess: () => void;
  days?: any[];
}

export function RecommendationContent({ tripId, currentDayId, onClose, onSuccess }: Props) {
  const map = useMap();
  const placesLib = useMapsLibrary("places");
  const swiperRef = useRef<any>(null);

  const [step, setStep] = useState<'input' | 'loading' | 'swipe' | 'result'>('input');
  
  const [tags, setTags] = useState({ who: '', type: '', subtype: '', mood: ''});  // 태그 구조 세분화 (대분류 type, 소분류 subtype 추가)
  const [candidates, setCandidates] = useState<PlaceData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedPlace, setLikedPlace] = useState<PlaceData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchBase, setSearchBase] = useState<{lat: number, lng: number} | null>(null);
  const [existingSchedules, setExistingSchedules] = useState<any[]>([]);
  const [selectedTime, setSelectedTime] = useState("12:00");

  // 1. DB에서 "오늘의 전체 일정" 가져오기
  useEffect(() => {
    async function fetchDaySchedules() {
      try {
        // 현재 Day의 모든 일정 가져오기 (시간순)
        const { data: dayRows } = await supabase
          .from('Schedules')
          .select('id, lat, lng, activity, time') // time 정렬을 위해 가져옴
          .eq('day_id', currentDayId)
          .not('lat', 'is', null) // 좌표 있는 것만
          .order('time', { ascending: true }); // 시간 순서대로

        let baseLocation = { lat: 37.5665, lng: 126.9780 }; // 기본값

        if (dayRows && dayRows.length > 0) {
          // 마커 데이터로 변환
          const markers = dayRows.map((row, idx) => ({
            id: row.id,
            lat: row.lat,
            lng: row.lng,
            activity: row.activity,
            time: row.time,
            order: idx + 1 // 1, 2, 3... 순서
          }));
          setExistingSchedules(markers);

          // 검색 기준점은 "가장 마지막 일정"의 위치로 설정
          const lastSchedule = markers[markers.length - 1];
          baseLocation = { lat: lastSchedule.lat, lng: lastSchedule.lng };
          
          console.log(`✅ 기존 일정 ${markers.length}개 로드 완료. 기준점: ${lastSchedule.activity}`);
        } else {
          // (2) 일정이 없으면 Trip 전체에서 찾기 (이전 코드와 동일 로직)
          const { data: anyLastData } = await supabase
            .from('Schedules')
            .select('lat, lng')
            .eq('trip_id', tripId)
            .not('lat', 'is', null)
            .order('time', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (anyLastData) {
             baseLocation = { lat: anyLastData.lat, lng: anyLastData.lng };
          }
        }

        setSearchBase(baseLocation);
        if (map) {
           map.panTo(baseLocation);
           map.setZoom(14); // 줌을 살짝 넓혀서 주변을 보여줌
        }
      } catch (error) {
        console.error(error);
      }
    }
    fetchDaySchedules();
  }, [map, currentDayId, tripId]); 
  
  // 2. 검색 핸들러
   const handleSearch = async () => {
    if (!placesLib || !map || !searchBase) return;
    setStep('loading');

    // 지도 중심 무시하고, 무조건 searchBase 사용
    const center = searchBase;
    
    // 1. 검색 범위 설정 (Bounds) - 반경 3km
    const r = 3000 / 6378137; 
    const latRad = (center.lat * Math.PI) / 180;
    const dy = r; 
    const dx = r / Math.cos(latRad);
    const boundsLiteral = {
      north: center.lat + (dy * 180) / Math.PI,
      south: center.lat - (dy * 180) / Math.PI,
      east: center.lng + (dx * 180) / Math.PI,
      west: center.lng - (dx * 180) / Math.PI,
    };

    // 2. 검색 헬퍼 함수 (재사용을 위해 분리)
    const performSearch = async (queryText: string) => {
      //console.log(`"${queryText}"`);
      // @ts-ignore
      const { places } = await google.maps.places.Place.searchByText({
        textQuery: queryText,
        fields: ['id', 'displayName', 'formattedAddress', 
              'location', 'photos', 'rating', 'userRatingCount', 'types',
              'priceLevel'],           // ✨ 가격대 추가
        locationRestriction: boundsLiteral, // 강제 지역 제한 유지
        maxResultCount: 15,
      });
      return places || [];
    };

    try {
      // 3. 검색어 조합
      const coreKeyword = tags.subtype || tags.type || '맛집';
      
      // [1차 시도] 상세 검색: "한식 조용한 연인"
      let finalQuery = `${coreKeyword} ${tags.mood} ${tags.who}`;
      let places = await performSearch(finalQuery);

      // [2차 시도] 결과가 없거나 적으면 -> 조건을 완화해서 "핵심 키워드"로만 재검색
      if (!places || places.length < 3) {
        const broadQuery = `${coreKeyword}`;
        const broadPlaces = await performSearch(broadQuery);
        if (broadPlaces?.length > 0) places = broadPlaces;
        }

      // 4. 데이터 가공 및 상태 업데이트
      if (places?.length > 0) {
        // utils.ts에서 가져온 formatGooglePlace 함수 사용
        const formatted = places.map(formatGooglePlace).filter((p: any) => (p.rating || 0) >= 3.0);
        
        if (formatted.length === 0) throw new Error("조건 불충분");

        setCandidates(formatted);
        setStep('swipe');
        setCurrentIndex(0);
        map?.panTo(formatted[0].geometry.location);
      } else {
        alert("결과가 없습니다.");
        setStep('input');
      }
    } catch (e) {
      console.error(e);
      alert("오류 발생");
      setStep('input');
    }
  };

  const handleSlideChange = (swiper: any) => {
    const index = swiper.activeIndex;
    setCurrentIndex(index);
    if (candidates[index]?.geometry?.location && map) {
      map.panTo(candidates[index].geometry!.location!);
    }
  };

  const handleVote = (isLike: boolean) => {
    if (isLike) {
      setLikedPlace(candidates[currentIndex]);
      setSelectedTime(calculateNextTime(existingSchedules)); //시간 자동 계산
      setStep('result');
    } else {
      if (swiperRef.current) swiperRef.current.slideNext();
    }
  };

  const handleSaveToDB = async () => {
    if (!likedPlace) return;
    setIsSaving(true);
    try {
      // @ts-ignore
      const lat = likedPlace.geometry?.location?.lat?.() || likedPlace.geometry?.location?.lat;
      // @ts-ignore
      const lng = likedPlace.geometry?.location?.lng?.() || likedPlace.geometry?.location?.lng;

      await supabase.from('Schedules').insert({
        day_id: currentDayId,
        time: selectedTime,
        activity: likedPlace.name,
        description: '[AI 추천]',
        lat, lng,
        icon: determineIcon(tags.type),
        tips: `평점 ${likedPlace.rating} / 리뷰 ${likedPlace.user_ratings_total}`,
      });
      onSuccess(); onClose();
    } catch (e) { alert("저장 실패"); } finally { setIsSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col animate-in fade-in duration-300">
      <div className="flex justify-between items-center p-4 border-b bg-white z-50">
        <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-700">
          <Sparkles className="w-5 h-5" /> AI Place Finder
        </h2>
        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X className="w-5 h-5 text-gray-600" /></button>
      </div>

      <RecommendationMap 
        step={step} 
        schedules={existingSchedules} 
        candidates={candidates} 
        currentIndex={currentIndex} 
      />

      <div className="flex-1 bg-white relative overflow-hidden flex flex-col">
        {step === 'input' && <StepInput tags={tags} setTags={setTags} handleSearch={handleSearch} existingCount={existingSchedules.length} />}
        
        {step === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-20">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
            <p className="text-gray-500 font-medium animate-pulse">장소를 찾고 있어요...</p>
          </div>
        )}

        {step === 'swipe' && (
          <StepSwipe 
            candidates={candidates} 
            onSwiperInit={(s: any) => swiperRef.current = s} 
            onSlideChange={handleSlideChange} 
            handleVote={handleVote} 
          />
        )}

        {step === 'result' && likedPlace && (
          <StepResult 
            likedPlace={likedPlace} 
            selectedTime={selectedTime} 
            setSelectedTime={setSelectedTime} 
            handleSave={handleSaveToDB} 
            isSaving={isSaving} 
            onRetry={() => setStep('swipe')} 
          />
        )}
      </div>
    </div>
  );
}

export default function AIRecommendationModal(props: Props) {
  if (!props.isOpen) return null;
  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""} libraries={LIBRARIES}>
      <RecommendationContent {...props} />
    </APIProvider>
  );
}