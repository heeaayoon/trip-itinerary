"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Sparkles, MapPin, Calendar, Search, Wallet, Hotel } from 'lucide-react'; // 아이콘 활용
import FlightInputSection from './FlightInputSection'; 
// Props 정의
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

// Cities 테이블 데이터 타입
interface CityData {
  id: number;
  city: string;
  city_ascii: string;
  admin_name: string;
  country: string;
  lat: number;
  lng: number;
}

export default function AddTripModal({ isOpen, onClose, onSuccess, userId }: Props) {
  const [loading, setLoading] = useState(false);
  
  // --- 1. 기본 여행 정보 (기존 로직) ---
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [theme, setTheme] = useState(''); // 기본 테마 (한줄 요약용)

  // --- 2. 도시 검색 관련 (기존 로직 유지) ---
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<CityData[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityData | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // --- 3. [NEW] AI 추천 관련 상태 ---
  const [useAI, setUseAI] = useState(true); // 기본값: AI 사용
  const [companion, setCompanion] = useState('친구');
  const [pace, setPace] = useState('보통');           // pace_preference
  const [accommodation, setAccommodation] = useState('호텔'); // accommodation_type (NEW)
  const [budget, setBudget] = useState('보통');       // budget_level (NEW)
  const [interests, setInterests] = useState<string[]>([]);

  // 관심사 태그 목록
  const INTEREST_TAGS = ['맛집탐방', '카페투어', '자연/풍경', '쇼핑', '예술/박물관', '액티비티', '호캉스', '야경'];

  // 태그 토글 함수
  const toggleInterest = (tag: string) => {
    if (interests.includes(tag)) setInterests(interests.filter(t => t !== tag));
    else setInterests([...interests, tag]);
  };

  // 🔥 [NEW] 4가지 비행 시간 상태
  const [flightOutDept, setFlightOutDept] = useState('');
  const [flightOutArr, setFlightOutArr] = useState('');
  const [flightInDept, setFlightInDept] = useState('');
  const [flightInArr, setFlightInArr] = useState('');

  // 초기화
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSearchResults([]);
      setSelectedCity(null);
      setTitle('');
      setStartDate('');
      setEndDate('');
      setTheme('');
      // AI 상태 초기화
      setUseAI(true);
      setCompanion('친구');
      setPace('보통');
      setAccommodation('호텔');
      setBudget('보통');
      setInterests([]);
      //비행 시간 상태
      setFlightOutDept('');
      setFlightOutArr('');
      setFlightInDept('');
      setFlightInArr('');
    }
  }, [isOpen]);

  // 외부 클릭 감지 (검색창 닫기)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 검색 로직 (Debounce)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }
      // 이미 선택된 도시와 검색어가 같으면 검색 안 함 (불필요한 호출 방지)
      if (selectedCity && searchTerm === `${selectedCity.city}, ${selectedCity.country}`) return;

      setShowDropdown(true);

      const { data, error } = await supabase
        .from('Cities')
        .select('id, city, city_ascii, admin_name, country, lat, lng')
        .ilike('city_ascii', `${searchTerm}%`)
        .order('population', { ascending: false })
        .limit(10);

      if (!error && data) {
        setSearchResults(data);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedCity]);

  // 시작일 변경 핸들러 (기존 로직 유지)
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    if (endDate && newStartDate > endDate) {
      setEndDate('');
    }
  };

  // 도시 선택 핸들러
  const handleSelectCity = (city: CityData) => {
    setSelectedCity(city);
    setSearchTerm(`${city.city}, ${city.country}`);
    setShowDropdown(false);
    // 제목이 비어있으면 자동 완성 센스
    if (!title) setTitle(`${city.city} 여행`);
  };

  // --- 🔥 [핵심] 저장 로직 ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate || !selectedCity) {
      alert("여행지, 제목, 날짜는 필수 입력 항목입니다!");
      return;
    }

    setLoading(true);

    try {
      // 1. Trips 테이블 생성 (기존 유지)
      const { data: tripData, error: tripError } = await supabase
        .from('Trips')
        .insert({ 
          title, 
          start_date: startDate, 
          end_date: endDate, 
          theme, // 사용자가 직접 입력한 한줄 테마
          location: selectedCity.city,
          country: selectedCity.country,
          admin_name: selectedCity.admin_name,
          latitude: selectedCity.lat,
          longitude: selectedCity.lng,
          created_by: userId,
          status: 'PLANNING' // 상태 추가
        })
        .select()
        .single();

      if (tripError || !tripData) throw tripError;

      // 2. Days 테이블 생성 (기존 유지)
      const daysToInsert = [];
      const current = new Date(startDate);
      const end = new Date(endDate);
      let dayCount = 1;

      while (current <= end) {
        daysToInsert.push({
          trip_id: tripData.id,
          day_number: dayCount,
          date: current.toISOString().split('T')[0],
          day_theme: ''
        });
        current.setDate(current.getDate() + 1);
        dayCount++;
      }

      const { error: daysError } = await supabase.from('Days').insert(daysToInsert);
      if (daysError) throw daysError;

      // 3. [NEW] AI 사용 시 Trip_preferences 테이블 저장
      if (useAI) {
        const { error: prefError } = await supabase
          .from('Trip_preferences')
          .insert({
            trip_id: tripData.id,
            travel_style: theme || '자유 여행', // travel_style (입력 없으면 기본값)
            pace_preference: pace,             // pace_preference
            companion_type: companion,         // companion_type
            accommodation_type: accommodation, // accommodation_type (NEW)
            budget_level: budget,              // budget_level (NEW)
            interests: interests,               // interests (Array)
            // 🔥 새로 추가된 4개 컬럼 저장
            flight_out_dept: flightOutDept || null,
            flight_out_arr: flightOutArr || null,
            flight_in_dept: flightInDept || null,
            flight_in_arr: flightInArr || null
          });
        
        if (prefError) throw prefError;
      }

       // --- 🔥 [여기 추가] AI 함수 호출 ---
    if (useAI) {
      // 사용자에게 알림용 (옵션)
      console.log("AI 일정 생성 요청 시작...");

      // Edge Function 호출
      // tripData.id는 1번 과정에서 생성된 여행 ID입니다.
      const { error: aiError } = await supabase.functions.invoke('generate-itinerary', {
        body: { trip_id: tripData.id }
      });

      if (aiError) {
        console.error("AI 생성 실패:", aiError);
        // 실패해도 여행은 만들어졌으니 넘어가거나, 사용자에게 알림
        alert("여행은 생성되었지만, AI 일정 추천에 실패했습니다.");
      }
    }
    // ----------------------------------

    alert(useAI ? "AI가 맞춤 일정을 생성했습니다! 🤖✈️" : "여행이 생성되었습니다!");
    onSuccess();
    onClose();

    } catch (error: any) {
      console.error('생성 실패:', error);
      alert("여행 생성 중 오류가 발생했습니다: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* 헤더 */}
        <div className="flex justify-between items-center p-6 border-b shrink-0">
          <h2 className="text-xl font-bold text-gray-800">새로운 여행 계획</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* 폼 영역 */}
        <div className="overflow-y-auto p-6 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 기본 정보 */}
            <div className="space-y-4">
              <div className="relative" ref={wrapperRef}>
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-1">
                  <MapPin className="w-4 h-4 mr-1 text-sky-500"/> 여행지
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input type="text" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setSelectedCity(null); }}
                    placeholder="도시 검색 (예: Seoul, Tokyo)"
                    className="w-full pl-10 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none" required />
                </div>
                {showDropdown && searchResults.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border border-gray-100 rounded-xl shadow-xl mt-2 max-h-60 overflow-y-auto">
                    {searchResults.map((city) => (
                      <li key={city.id} onClick={() => handleSelectCity(city)} className="p-3 hover:bg-sky-50 cursor-pointer border-b flex flex-col">
                        <span className="font-bold text-gray-800">{city.city}</span>
                        <span className="text-xs text-gray-500">{city.country}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">여행 제목</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required 
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-1"><Calendar className="w-4 h-4 mr-1 text-sky-500"/> 시작일</label>
                  <input type="date" value={startDate} onChange={handleStartDateChange} required className="w-full p-3 border border-gray-200 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-1"><Calendar className="w-4 h-4 mr-1 text-gray-400"/> 종료일</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} disabled={!startDate} required className="w-full p-3 border border-gray-200 rounded-xl outline-none disabled:bg-gray-50" />
                </div>
              </div>

              {(startDate && endDate) && (
                <FlightInputSection 
                outDept={flightOutDept} setOutDept={setFlightOutDept}
                outArr={flightOutArr} setOutArr={setFlightOutArr}
                inDept={flightInDept} setInDept={setFlightInDept}
                inArr={flightInArr} setInArr={setFlightInArr}/>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">한줄 테마 (선택)</label>
                <input type="text" value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="예: 힐링 여행" className="w-full p-3 border border-gray-200 rounded-xl outline-none" />
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* AI 토글 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-rose-50 p-4 rounded-xl border border-rose-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-rose-500" />
                  <span className="font-bold text-gray-800">AI 맞춤 설정</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={useAI} onChange={e => setUseAI(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-rose-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>

              {/* 상세 취향 입력 (테이블 컬럼 대응) */}
              {useAI && (
                <div className="space-y-5 pt-2 animate-slideDown">
                  
                  {/* 동행 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">누구와 함께?</label>
                    <div className="flex gap-2 flex-wrap">
                      {['혼자', '연인', '친구', '가족'].map((t) => (
                        <button type="button" key={t} onClick={() => setCompanion(t)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${companion === t ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{t}</button>
                      ))}
                    </div>
                  </div>

                  {/* 숙소 & 예산 (NEW) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                        <Hotel className="w-4 h-4 mr-1 text-rose-500"/> 숙소 유형
                      </label>
                      <select value={accommodation} onChange={(e) => setAccommodation(e.target.value)}
                        className="w-full p-2 border rounded-lg outline-none text-sm bg-white">
                        <option>호텔</option>
                        <option>에어비앤비/팬션</option>
                        <option>리조트</option>
                        <option>게스트하우스/호스텔</option>
                      </select>
                    </div>
                    <div>
                      <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                        <Wallet className="w-4 h-4 mr-1 text-rose-500"/> 예산 수준
                      </label>
                      <div className="flex gap-1">
                        {['가성비', '보통', '럭셔리'].map((t) => (
                          <button type="button" key={t} onClick={() => setBudget(t)}
                            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${budget === t ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{t}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 속도 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">여행 속도</label>
                    <div className="flex gap-2">
                      {['여유롭게', '보통', '빡빡하게'].map((t) => (
                        <button type="button" key={t} onClick={() => setPace(t)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${pace === t ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{t}</button>
                      ))}
                    </div>
                  </div>

                  {/* 관심사 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">관심사</label>
                    <div className="flex flex-wrap gap-2">
                      {INTEREST_TAGS.map((tag) => (
                        <button type="button" key={tag} onClick={() => toggleInterest(tag)}
                          className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${interests.includes(tag) ? 'bg-rose-50 border-rose-200 text-rose-600 font-bold' : 'bg-white border-gray-200 text-gray-500'}`}>{tag}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4">
              <button type="submit" disabled={loading}
                className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all ${loading ? 'bg-gray-400' : useAI ? 'bg-gradient-to-r from-rose-500 to-orange-500 hover:opacity-90' : 'bg-gray-800'}`}>
                {loading ? "저장 중..." : useAI ? "✨ AI로 여행 만들기" : "기본 여행 생성하기"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}