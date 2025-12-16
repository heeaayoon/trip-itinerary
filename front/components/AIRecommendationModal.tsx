"use client";

import { useState, useEffect, useRef } from 'react';
import { Polyline } from './Polyline';
import { X, Sparkles, Check, RefreshCw, ThumbsUp, MapPin, Utensils, Coffee, Beer, Camera } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { APIProvider, Map, useMap, useMapsLibrary, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import SwipeCard, { PlaceData } from './SwipeCard';

import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCards } from 'swiper/modules';
import { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/effect-cards';

const LIBRARIES: ("places" | "marker")[] = ["places", "marker"];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  currentDayId: string;
  onSuccess: () => void;
  days?:any[];
}

// 🔥 [추가] 기존 일정 데이터 타입
interface ScheduleMarker {
  id: number;
  lat: number;
  lng: number;
  activity: string;
  time: string; // 👈 여기에 time 필드가 꼭 있어야 합니다!
  order: number; // 순서 표시용
}

export function RecommendationContent({ tripId, currentDayId, onClose, onSuccess }: Props) {
  const map = useMap();
  const placesLib = useMapsLibrary("places");
  const swiperRef = useRef<SwiperType | null>(null);

  const [step, setStep] = useState<'input' | 'loading' | 'swipe' | 'result'>('input');
  
  // 🔥 [핵심 변경] 태그 구조 세분화 (대분류 type, 소분류 subtype 추가)
  const [tags, setTags] = useState({ 
    who: '',     // 누구와
    type: '',    // 대분류 (식사, 카페, 술집)
    subtype: '', // 소분류 (한식, 양식 등 - type에 따라 달라짐)
    mood: ''     // 분위기
  });
  
  const [candidates, setCandidates] = useState<PlaceData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedPlace, setLikedPlace] = useState<PlaceData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchBase, setSearchBase] = useState<{lat: number, lng: number} | null>(null);

  // 🔥 [추가] 기존 일정 마커들 상태
  const [existingSchedules, setExistingSchedules] = useState<ScheduleMarker[]>([]);

  const [selectedTime, setSelectedTime] = useState("12:00");

  // 1. DB에서 "오늘의 전체 일정" 가져오기
  useEffect(() => {
    async function fetchDaySchedules() {
      // 맵 로딩 전이라도 데이터는 가져옴
      try {
        // (1) 현재 Day의 모든 일정 가져오기 (시간순)
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
    
    // 1. 검색 범위 설정 (Bounds) - 반경 3km로 살짝 확장 (기존 2km -> 3km)
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
      console.log(`🔍 시도: "${queryText}"`);
      // @ts-ignore
      const { places } = await google.maps.places.Place.searchByText({
        textQuery: queryText,
        fields: ['id', 'displayName', 'formattedAddress', 
              'location', 'photos', 'rating', 'userRatingCount', 'types',
              //'editorialSummary',    // ✨ 한 줄 요약 추가
              //'regularOpeningHours', // ✨ 영업 시간 추가
              'priceLevel'],           // ✨ 가격대 추가
        locationRestriction: boundsLiteral, // 강제 지역 제한 유지
        maxResultCount: 15,
      });
      return places || [];
    };

    try {
      // 핵심 키워드 (예: '한식', '카페')
      const coreKeyword = tags.subtype || tags.type || '맛집';
      
      // 🔥 [1차 시도] 상세 검색: "한식 조용한 연인"
      let finalQuery = `${coreKeyword} ${tags.mood} ${tags.who}`;
      let places = await performSearch(finalQuery);

      // 🔥 [2차 시도] 결과가 없거나 적으면 -> 조건을 완화해서 "핵심 키워드"로만 재검색
      // 예: "한식 조용한 연인" -> 결과 0개 -> "한식"으로 다시 검색
      if (!places || places.length < 3) {
        console.log("⚠️ 상세 검색 결과 부족 -> 핵심 키워드로 재검색 시도");
        // 분위기나 동행 조건을 빼고 검색
        const broadQuery = `${coreKeyword}`;
        const broadPlaces = await performSearch(broadQuery);
        
        // 재검색 결과가 있으면 덮어쓰기
        if (broadPlaces && broadPlaces.length > 0) {
            places = broadPlaces;
        }
      }

      if (places && places.length > 0) {
        const formattedPlaces: PlaceData[] = places.map((p: any) => {
          // 🔥 [핵심 수정] 가격 정보 변환 로직 (String -> Number)
          //console.log(`장소: ${p.displayName}, 가격정보:`, p.priceLevel);
          let priceNum: number | undefined = undefined;
          
          const priceMap: Record<string, number> = {
            'FREE': 0,
            'INEXPENSIVE': 1,      // ₩
            'MODERATE': 2,         // ₩₩
            'EXPENSIVE': 3,        // ₩₩₩
            'VERY_EXPENSIVE': 4    // ₩₩₩₩
          };


          if (p.priceLevel && typeof p.priceLevel === 'string') {
            priceNum = priceMap[p.priceLevel]; 
          } else if (typeof p.priceLevel === 'number') {
            priceNum = p.priceLevel;
          }

          // 🔥 [핵심 수정] 요약 정보 안전하게 꺼내기
          // p.editorialSummary가 객체일 수도 있고 문자열일 수도 있음
          let summaryText = "";
          if (p.editorialSummary) {
             // @ts-ignore (타입 에러 방지)
             summaryText = typeof p.editorialSummary === 'object' ? p.editorialSummary.text : p.editorialSummary;
          }

            return {
            place_id: p.id,
            name: p.displayName,
            vicinity: p.formattedAddress,
            rating: p.rating,
            user_ratings_total: p.userRatingCount,
            photos: p.photos,
            geometry: { location: p.location },
            types: p.types,
            //summary: p.editorialSummary,
            isOpen: p.regularOpeningHours?.openNow,
            price_level: priceNum // 변환된 숫자 전달
          };
        });


        // 평점 필터링 (너무 낮으면 제외)
        const filtered = formattedPlaces.filter(p => (p.rating || 0) >= 3.0);
        if (filtered.length === 0) { alert("조건에 맞는 장소가 없어요."); setStep('input'); return; }

        setCandidates(filtered);
        setStep('swipe');
        setCurrentIndex(0);
        
        // 🔥 검색 완료 시, 첫 번째 장소로 지도 이동하되, 기존 핀들도 보이게
        if (map && filtered[0].geometry?.location) {
            map.panTo(filtered[0].geometry.location);
        }

      } else {
        alert("결과가 없습니다.");
        setStep('input');
      }
    } catch (error: any) {
      console.error(error);
      alert("오류 발생");
      setStep('input');
    }
  };

  const handleSlideChange = (swiper: SwiperType) => {
    const index = swiper.activeIndex;
    setCurrentIndex(index);
    if (candidates[index]?.geometry?.location && map) {
      map.panTo(candidates[index].geometry!.location!);
    }
  };

  const handleVote = (isLike: boolean) => {
    if (isLike) {
      setLikedPlace(candidates[currentIndex]);

       // 🔥 [추가] 결과 화면으로 넘어가기 전에 시간을 미리 계산해서 세팅
      setSelectedTime(calculateNextTime());
      setStep('result');
    } else {
      if (swiperRef.current) swiperRef.current.slideNext();
    }
  };


  // 🔥 [1] 아이콘 결정 로직 (유저 의도 + 구글 데이터)
  const determineIcon = (googleTypes: string[] = []) => {
    // 1순위: 사용자가 검색할 때 선택한 카테고리 (가장 정확함)
    if (tags.type === '카페') return 'coffee';
    if (tags.type === '술집') return 'food'; 
    if (tags.type === '명소') return 'star'; 
    if (tags.type === '식사') return 'food';

    return 'food'; // 기본값
  };

  // 🔥 [2] 시간 자동 계산 로직 수정
  const calculateNextTime = () => {
    // 기존 일정이 없으면 오전 10시 시작
    if (existingSchedules.length === 0) return "10:00";

    // 마지막 일정 가져오기
    const lastSchedule = existingSchedules[existingSchedules.length - 1];
    
    // 이제 lastSchedule.time에 값이 확실히 있습니다.
    const lastTimeStr = lastSchedule.time || "10:00"; 

    try {
      // 시간 포맷이 "HH:MM:SS"일 수도 있고 "HH:MM"일 수도 있음
      // 앞의 2개(시, 분)만 잘라서 사용
      const [hourStr, minuteStr] = lastTimeStr.split(':');
      let hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10); // 분은 그대로 유지

      // 2시간 추가
      hour += 2;

      // 24시 넘어가면 23시로 고정 (당일치기 기준)
      if (hour >= 24) hour = 23;

      // "09:05" 형태로 포맷팅
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    } catch (e) {
      console.error("시간 계산 에러:", e);
      return "12:00"; // 에러 시 기본값
    }
  };

  const handleSaveToDB = async () => {
    if (!likedPlace) return;
    setIsSaving(true);
    try {
      let lat = 0, lng = 0;
      if (typeof likedPlace.geometry?.location?.lat === 'function') {
        lat = likedPlace.geometry.location.lat();
        lng = likedPlace.geometry.location.lng();
      } else {
        // @ts-ignore
        lat = likedPlace.geometry?.location?.lat;
        // @ts-ignore
        lng = likedPlace.geometry?.location?.lng;
      }

      // 스마트한 값 계산
      const nextTime = calculateNextTime();
      const smartIcon = determineIcon(likedPlace.types);

      const placeParams = {
        day_id: currentDayId,
        time: selectedTime,   // 🔥 [수정] 사용자가 최종 확인한 시간을 사용
        activity: likedPlace.name,
        description: '[AI 추천]',
        lat: lat,
        lng: lng,
        icon: smartIcon,
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

  // 🔥 [보조 함수] 대분류에 따른 소분류 옵션 반환
  const getSubtypes = () => {
    switch (tags.type) {
      case '식사': return ['한식', '양식', '일식', '중식', '아시안', '로컬맛집'];
      case '술집': return ['이자카야', '와인', '칵테일', '맥주'];
      case '명소': return ['공원', '박물관', '쇼핑', '야경'];
      default: return [];
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col animate-in fade-in duration-300">
      
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

      {/* 🔥 [핵심 수정] 지도 영역: 기존 일정 핀 + 추천 장소 핀 */}
      <div className={`w-full transition-all duration-500 ease-in-out ${step === 'input' ? 'h-0 opacity-0' : 'h-[40%] shrink-0 relative'}`}>
         <Map 
            defaultZoom={14} 
            defaultCenter={{ lat: 37.5665, lng: 126.9780 }} 
            disableDefaultUI={false}
            mapId="DEMO_MAP_ID" // 🔥 AdvancedMarker를 쓰려면 Map ID가 필요함 (구글 클라우드 콘솔에서 생성 추천, 없으면 DEMO_MAP_ID)
            style={{ width: '100%', height: '100%' }} 
          >
            {/* 🔥 [추가] 1. 일정들을 잇는 선 그리기 (화살표 포함) */}
            {existingSchedules.length > 1 && (
               <Polyline 
                 path={existingSchedules.map(s => ({ lat: s.lat, lng: s.lng }))}
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
            {existingSchedules.map((marker) => (
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
               <AdvancedMarker 
                 key="current-candidate"
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

      {/* 컨텐츠 영역 */}
      <div className="flex-1 bg-white relative overflow-hidden flex flex-col">
        
        {/* Step 1: 입력 화면 (Drill-down 방식) */}
        {step === 'input' && (
          <div className="absolute inset-0 p-6 pb-10 flex flex-col overflow-y-auto">
             <div className="w-full max-w-md mx-auto space-y-8 mt-4">
                
                {/* 1. 누구와? */}
                <section>
                  <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">1. 누구와 함께하시나요?</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {['혼자', '친구', '연인', '가족'].map(who => (
                      <button 
                        key={who} 
                        onClick={() => setTags({...tags, who})} 
                        className={`py-3 rounded-xl text-sm font-bold border transition-all ${
                          tags.who === who ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                                        : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        {who}
                      </button>
                    ))}
                  </div>
                </section>

                {/* 2. 장소 유형 (대분류) */}
                <section>
                  <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">2. 어떤 장소를 찾으세요?</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: '식사', icon: <Utensils className="w-4 h-4" /> }, 
                      { label: '카페', icon: <Coffee className="w-4 h-4" /> }, 
                      { label: '술집', icon: <Beer className="w-4 h-4" /> },
                      { label: '명소', icon: <Camera className="w-4 h-4" /> }
                    ].map(item => (
                      <button 
                        key={item.label} 
                        onClick={() => setTags({ ...tags, type: item.label, subtype: '' })} // 대분류 변경시 소분류 초기화
                        className={`py-4 rounded-xl text-sm font-bold border flex flex-col items-center gap-2 transition-all ${
                          tags.type === item.label ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    ))}
                  </div>
                </section>

                {/* 3. 상세 유형 (소분류 - 조건부 렌더링) */}
                {tags.type && (
                  <section className="animate-in slide-in-from-bottom-2 fade-in duration-300">
                    <div className="flex flex-wrap gap-2">
                      {getSubtypes().map(sub => (
                        <button 
                          key={sub} 
                          onClick={() => setTags({...tags, subtype: sub})} 
                          className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                            tags.subtype === sub ? 'bg-rose-500 text-white border-rose-500 shadow-sm' 
                                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* 4. 분위기 */}
                <section>
                  <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">3. 선호하는 분위기</h3>
                  <div className="flex flex-wrap gap-2">
                    {['조용한', '활기찬', '뷰가 좋은', '가성비', '럭셔리'].map(mood => (
                      <button 
                        key={mood} 
                        onClick={() => setTags({...tags, mood})} 
                        className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                          tags.mood === mood ? 'bg-amber-500 text-white border-amber-500 shadow-sm' 
                                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {mood}
                      </button>
                    ))}
                  </div>
                </section>

                <div className="pt-4">
                    <button 
                      onClick={handleSearch} 
                      disabled={!tags.type} 
                      className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg shadow-xl
                             hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]">
                      AI 추천 시작하기
                    </button>
                </div>
             </div>
          </div>
        )}

        {/* Step 2: 로딩 */}
        {step === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-20">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
            <p className="text-gray-500 font-medium animate-pulse">
                {tags.subtype || tags.type} 장소를 찾고 있어요...
            </p>
          </div>
        )}

        {/* Step 3: 스와이프 (버튼 없음 - 카드 내부에 있음) */}
        {step === 'swipe' && (
          <div className="absolute inset-0 flex flex-col bg-gray-50">
             <div className="flex-1 flex items-center justify-center py-4">
                <div className="w-[300px] h-[450px]">
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
                        {/* 🔥 handleVote 함수를 전달합니다 */}
                        <SwipeCard place={place} onVote={handleVote} />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
             </div>
             {/* 하단 공간 확보용 (버튼이 카드 안에 있으므로 여기는 비워둡니다) */}
             <div className="h-10 bg-white" />
          </div>
        )}

        {/* Step 4: 결과 화면 (동일) */}
        {step === 'result' && likedPlace && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-white z-20">
             <div className="text-center mb-6 animate-in zoom-in duration-300">
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ThumbsUp className="w-12 h-12 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 px-4">{likedPlace.name}</h3>
                <p className="text-gray-500 mt-2 text-sm">{likedPlace.vicinity}</p>
             </div>

              {/* 🔥 [추가] 시간 설정 입력창 */}
             <div className="w-full max-w-sm mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                  Schedule Time
                </label>
                <div className="flex items-center gap-3">
                   <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <RefreshCw className="w-4 h-4 text-gray-400" /> 
                   </div>
                   <input 
                      type="time" 
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="flex-1 bg-white border border-gray-200 text-gray-800 text-lg font-bold rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                   />
                </div>
                <p className="text-xs text-gray-400 mt-2 ml-1">
                  * 예상 시간을 자유롭게 수정하세요.
                </p>
             </div>

             <div className="w-full max-w-sm space-y-3">
               <button onClick={handleSaveToDB} disabled={isSaving} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-indigo-700 transition-all">
                 {isSaving ? <RefreshCw className="animate-spin" /> : "이 시간으로 일정 추가"}
               </button>
               <button onClick={() => setStep('swipe')} className="w-full py-3 text-gray-400 font-medium hover:text-gray-600">다른 곳 볼래요</button>
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
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""} libraries={LIBRARIES}>
      <RecommendationContent {...props} />
    </APIProvider>
  );
}