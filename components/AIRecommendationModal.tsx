"use client";

import { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Check, RefreshCw, ThumbsUp, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { APIProvider, Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import SwipeCard, { PlaceData } from './SwipeCard';

import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCards } from 'swiper/modules';
import { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/effect-cards';

// 🔥 [중요] 최신 Places 라이브러리 사용 선언
const LIBRARIES: ("places" | "marker")[] = ["places", "marker"];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  currentDayId: string;
  onSuccess: () => void;
  days?: any[]; 
}

export function RecommendationContent({ tripId, currentDayId, onClose, onSuccess, days }: Props) {
  const map = useMap();
  const placesLib = useMapsLibrary("places"); // 🔥 라이브러리 로드
  const swiperRef = useRef<SwiperType | null>(null);

  const [step, setStep] = useState<'input' | 'loading' | 'swipe' | 'result'>('input');
  const [tags, setTags] = useState({ who: '', food: '', mood: '' });
  
  const [candidates, setCandidates] = useState<PlaceData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedPlace, setLikedPlace] = useState<PlaceData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

   // 🔥 [핵심 수정] 부모 props(days)에 의존하지 않고, DB에서 직접 마지막 위치를 가져옴
  useEffect(() => {
    async function fetchLastLocation() {
      if (!map) return;

      console.log("📍 위치 탐색 시작... (DB 조회)");

      try {
        // 1. 현재 Day에 등록된 일정 중 좌표가 있는 가장 최근 것 1개 가져오기
        const { data: currentDayData, error: currentError } = await supabase
          .from('Schedules')
          .select('lat, lng, activity')
          .eq('day_id', currentDayId)
          .neq('lat', null) // 좌표 없는 거 제외
          .order('id', { ascending: false }) // 가장 최근에 등록한 순서 (또는 time으로 정렬 가능)
          .limit(1)
          .maybeSingle();

        if (currentDayData) {
          console.log(`✅ 현재 Day의 마지막 일정 [${currentDayData.activity}] 발견!`, currentDayData);
          map.panTo({ lat: currentDayData.lat, lng: currentDayData.lng });
          map.setZoom(15);
          return; // 찾았으면 종료
        }

        // 2. 현재 Day에 없다면? -> 이전 Day들을 뒤져서라도 찾기 (역순 탐색 필요 없으면 생략 가능)
        // 일단은 현재 Day가 없으면 기본 위치(서울)보다는 "가장 최근 저장된 아무 일정"이나 찾는 게 나음
        const { data: anyLastData } = await supabase
          .from('Schedules')
          .select('lat, lng, activity')
          .neq('lat', null)
          .order('id', { ascending: false }) // 전체 통틀어 가장 최근
          .limit(1)
          .maybeSingle();
          
        if (anyLastData) {
           console.log(`ℹ️ 현재 Day엔 없어서, 가장 최근 일정 [${anyLastData.activity}] 근처로 갑니다.`);
           map.panTo({ lat: anyLastData.lat, lng: anyLastData.lng });
           map.setZoom(14);
        } else {
           console.log("❌ 저장된 일정이 하나도 없습니다. 기본 위치(서울) 유지.");
        }

      } catch (error) {
        console.error("위치 가져오기 실패:", error);
      }
    }

    // 모달이 열리거나 맵이 준비되면 실행
    fetchLastLocation();

  }, [map, currentDayId]); // days 의존성 제거함 (더 이상 props 안 기다림)\
  
  // 🔥 [핵심 수정] 최신 Google Places API (New) 사용 로직
  const handleSearch = async () => {
    if (!placesLib || !map) {
      alert("지도가 준비되지 않았습니다. 잠시만 기다려주세요.");
      return;
    }

    setStep('loading');

    const query = `${tags.food || '맛집'} ${tags.mood || ''} ${tags.who ? '추천' : ''}`;
    console.log("🔍 검색어:", query);

    try {
      // 1. 최신 API인 Place.searchByText 사용
      // @ts-ignore (타입스크립트 버전 이슈 방지용)
      const { places } = await google.maps.places.Place.searchByText({
        textQuery: query,
        fields: ['id', 'displayName', 'formattedAddress', 'location', 'photos', 'rating', 'userRatingCount', 'types'],
        locationBias: map.getCenter(), // 현재 지도 중심 기준
        maxResultCount: 10, // 최대 10개
      });

      if (places && places.length > 0) {
        console.log(`🎉 ${places.length}개의 장소를 찾았습니다.`);
        
        // 2. 데이터 포맷 변환 (Place 객체 -> 우리 앱 포맷)
        const formattedPlaces: PlaceData[] = places.map((p: any) => ({
          place_id: p.id,
          name: p.displayName, // 최신 API는 name 대신 displayName을 씀
          vicinity: p.formattedAddress,
          rating: p.rating,
          user_ratings_total: p.userRatingCount,
          photos: p.photos,
          geometry: { 
            location: p.location 
          },
          types: p.types
        }));
        
        // 평점 필터링 (3.5 이상)
        const filtered = formattedPlaces.filter(p => (p.rating || 0) >= 3.5);

        if (filtered.length === 0) {
          alert("조건에 맞는 장소가 없어요. 키워드를 변경해보세요.");
          setStep('input');
          return;
        }

        setCandidates(filtered);
        setStep('swipe');
        setCurrentIndex(0);

      } else {
        alert("장소를 찾지 못했습니다.");
        setStep('input');
      }
    } catch (error: any) {
      console.error("🚨 검색 에러:", error);
      alert("검색 중 오류가 발생했습니다: " + error.message);
      setStep('input');
    }
  };

  const handleSlideChange = (swiper: SwiperType) => {
    const index = swiper.activeIndex;
    setCurrentIndex(index);
    if (candidates[index] && map && candidates[index].geometry?.location) {
      map.panTo(candidates[index].geometry!.location!);
    }
  };

  const handleVote = (isLike: boolean) => {
    if (isLike) {
      setLikedPlace(candidates[currentIndex]);
      setStep('result');
    } else {
      if (swiperRef.current) {
        if (swiperRef.current.isEnd) {
             alert("처음부터 다시 보여드릴게요!");
             swiperRef.current.slideTo(0);
        } else {
             swiperRef.current.slideNext();
        }
      }
    }
  };

  const handleSaveToDB = async () => {
    if (!likedPlace) return;
    setIsSaving(true);
    try {
      // LatLng 객체 처리
      let lat = 0;
      let lng = 0;
      
      // Google Maps LatLng 객체는 함수(.lat())일 수도 있고 숫자일 수도 있음
      if (typeof likedPlace.geometry?.location?.lat === 'function') {
        lat = likedPlace.geometry.location.lat();
        lng = likedPlace.geometry.location.lng();
      } else {
        // @ts-ignore
        lat = likedPlace.geometry?.location?.lat;
        // @ts-ignore
        lng = likedPlace.geometry?.location?.lng;
      }

      const placeParams = {
        day_id: currentDayId,
        time: "12:00",
        activity: likedPlace.name,
        description: `[AI 추천] ${likedPlace.vicinity}`,
        lat: lat,
        lng: lng,
        icon: 'food',
        tips: `평점 ${likedPlace.rating} / 리뷰 ${likedPlace.user_ratings_total}`,
      };
      const { error } = await supabase.from('Schedules').insert(placeParams);
      if (error) throw error;
      onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
      alert("저장 실패");
    } finally {
      setIsSaving(false);
    }
  };

  const mapContainerStyle = { width: '100%', height: '100%' };

  return (
    <div className="fixed inset-0 bg-white z-60 flex flex-col animate-in fade-in duration-300">
      
      {/* 헤더 */}
      <div className="flex justify-between items-center p-4 border-b bg-white z-50">
        <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-700">
          <Sparkles className="w-5 h-5" />
          AI Place Finder
        </h2>
        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* 지도 영역 */}
      <div className={`w-full transition-all duration-500 ease-in-out ${step === 'input' ? 'h-0 opacity-0' : 'h-[45%] shrink-0 relative'}`}>
         <Map 
            defaultZoom={15} 
            defaultCenter={{ lat: 37.5665, lng: 126.9780 }} 
            disableDefaultUI={false} 
            style={mapContainerStyle} 
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
             <MapPin className="w-8 h-8 text-rose-500 fill-rose-500 -mt-8 animate-bounce" />
          </div>
      </div>

      {/* 하단 컨텐츠 영역 */}
      <div className="flex-1 bg-white relative overflow-hidden flex flex-col">
        
        {/* 1. 입력 화면 */}
        {step === 'input' && (
          <div className="absolute inset-0 p-8 flex flex-col items-center justify-center overflow-y-auto">
             <div className="w-full max-w-md space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">어떤 장소를 찾으시나요?</h3>
                  <p className="text-gray-500">키워드를 선택하면 AI가 구글맵을 탐색합니다.</p>
                </div>
                {/* 태그 UI */}
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase ml-1">Companion</span>
                    <div className="flex gap-2 mt-1 overflow-x-auto scrollbar-hide">
                      {['연인', '친구', '부모님', '혼자'].map(t => (
                        <button key={t} onClick={() => setTags({...tags, who: t})} className={`px-4 py-2 rounded-xl text-sm font-bold border ${tags.who===t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-gray-100 text-gray-600'}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase ml-1">Menu</span>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {['맛집', '카페', '술집', '디저트', '한식', '양식'].map(t => (
                        <button key={t} onClick={() => setTags({...tags, food: t})} className={`px-4 py-2 rounded-xl text-sm font-bold border ${tags.food===t ? 'bg-rose-500 text-white border-rose-500' : 'bg-white border-gray-100 text-gray-600'}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase ml-1">Mood</span>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {['조용한', '힙한', '뷰가 좋은', '가성비'].map(t => (
                        <button key={t} onClick={() => setTags({...tags, mood: t})} className={`px-4 py-2 rounded-xl text-sm font-bold border ${tags.mood===t ? 'bg-amber-500 text-white border-amber-500' : 'bg-white border-gray-100 text-gray-600'}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <button onClick={handleSearch} disabled={!tags.food} className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg mt-4 disabled:opacity-30">검색하기</button>
             </div>
          </div>
        )}

        {/* 2. 로딩 화면 */}
        {step === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-20">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
            <p className="text-gray-500 font-medium">최신 장소 데이터를 가져오는 중...</p>
          </div>
        )}

        {/* 3. Swiper 화면 */}
        {step === 'swipe' && (
          <div className="absolute inset-0 flex flex-col bg-gray-50">
             <div className="flex-1 flex items-center justify-center py-4">
                <div className="w-[300px] h-[400px]">
                  <Swiper
                    effect={'cards'}
                    grabCursor={true}
                    modules={[EffectCards]}
                    className="w-full h-full"
                    onSwiper={(swiper) => (swiperRef.current = swiper)}
                    onSlideChange={handleSlideChange}
                  >
                    {candidates.map((place) => (
                      <SwiperSlide key={place.place_id} className="rounded-3xl shadow-lg">
                        <SwipeCard place={place} />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
             </div>
             
             <div className="h-20 bg-white border-t flex items-center justify-center gap-12 shrink-0">
               <button onClick={() => handleVote(false)} className="w-12 h-12 rounded-full border flex items-center justify-center text-red-500 hover:bg-red-50"><X /></button>
               <button onClick={() => handleVote(true)} className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg hover:bg-indigo-700 hover:scale-105 transition"><Check /></button>
             </div>
          </div>
        )}

        {/* 4. 결과 화면 */}
        {step === 'result' && likedPlace && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-white z-20">
             <div className="text-center mb-6">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ThumbsUp className="w-10 h-10 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{likedPlace.name}</h3>
                <p className="text-gray-500 mt-1">{likedPlace.vicinity}</p>
             </div>

             <div className="w-full max-w-sm space-y-3">
               <button onClick={handleSaveToDB} disabled={isSaving} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2">
                 {isSaving ? <RefreshCw className="animate-spin" /> : "이곳으로 일정 추가"}
               </button>
               <button onClick={() => setStep('swipe')} className="w-full py-3 text-gray-400 font-medium hover:text-gray-600">다시 고르기</button>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function AIRecommendationModal(props: Props) {
  if (!props.isOpen) return null;
  
  return (
    <APIProvider 
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""} 
      libraries={LIBRARIES}
    >
      <RecommendationContent {...props} />
    </APIProvider>
  );
}