"use client";

import { useState, useEffect, useRef } from 'react';
//import { supabase } from '@/lib/supabase';
import apiClient from '@/lib/api';
import { X, Sparkles, MapPin, Calendar, Search, Wallet, Hotel } from 'lucide-react'; // 아이콘 활용
import FlightInputSection from './FlightInputSection'; 
// Props 정의
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Cities 테이블 데이터 타입
interface CityData {
  id: number;
  city: string;
  country: string;
  lat: number;
  lng: number;
  population: number;
}

export default function AddTripModal({ isOpen, onClose, onSuccess }: Props) {
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

  // --- 3. AI 추천 관련 상태 ---
  const [useAI, setUseAI] = useState(true); // 기본값: AI 사용
  const [style, setStyle] = useState(''); // travelStyle -> style (사용자가 입력하는 '한줄 테마'와 공유 가능)
  const [pace, setPace] = useState('보통');           // pace_preference
  const [accommodation, setAccommodation] = useState('호텔'); // accommodation_type (NEW)
  const [companion, setCompanion] = useState('친구');
  const [budget, setBudget] = useState('보통');       // budget_level (NEW)
  const [interests, setInterests] = useState<string[]>([]);

  // 관심사 태그 목록
  const INTEREST_TAGS = ['맛집탐방', '카페투어', '자연/풍경', '쇼핑', '예술/박물관', '액티비티', '호캉스', '야경'];

  // 태그 토글 함수
  const toggleInterest = (tag: string) => {
    if (interests.includes(tag)) setInterests(interests.filter(t => t !== tag));
    else setInterests([...interests, tag]);
  };

  // 4가지 비행 시간 상태
  const [flightOutDept, setFlightOutDept] = useState('');
  const [flightOutArr, setFlightOutArr] = useState('');
  const [flightInDept, setFlightInDept] = useState('');
  const [flightInArr, setFlightInArr] = useState('');

  // 모달이 닫힐 때 모든 상태를 초기화
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
      setStyle('');
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

  // 외부 클릭시 검색창 드롭다운창 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 도시 검색 로직 (Debounce) - 도시 검색 API 호출 포함
   useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchTerm.length < 2 || (selectedCity && searchTerm === `${selectedCity.city}, ${selectedCity.country}`)) {
        setSearchResults([]);
        return;
      }
      setShowDropdown(true);

      try{
        // 백엔드의 도시 검색 API 엔드포인트 호출
        const response = await apiClient.get(`/api/cities?q=${searchTerm}`)
        setSearchResults(response.data);
      }catch(error){
        console.error("도시 검색 오류:", error);
      }
    }, 300); //300ms 지연

    return () => clearTimeout(timer);
  }, [searchTerm, selectedCity]);

  // 시작일 변경 핸들러
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

  // 폼 제출 및 저장 로직 ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate || !selectedCity) {
      alert("여행지, 제목, 날짜는 필수 입력 항목입니다!");
      return;
    }
    setLoading(true);

    // [데이터 준비] 백엔드의 TripDto.TripRequest와 동일한 구조로 객체 생성
    const tripData = {
      // 기본 정보
      title,
      startDate,
      endDate,
      theme, // Trips 테이블용 '한줄 테마'
      country: selectedCity.country,
      city: selectedCity.city,
      latitude: selectedCity.lat,
      longitude: selectedCity.lng,
      
      // AI 취향 정보
      useAI,
      style: theme || '자유 여행', // Trip_preferences용 'style'. 'theme' 필드와 공유합니다.
      pace,
      accommodation,
      companion,
      budget,
      interests,

      // 비행 시간 정보
      flightOutDept: flightOutDept || null,
      flightOutArr: flightOutArr || null,
      flightInDept: flightInDept || null,
      flightInArr: flightInArr || null,
    };

    // [API 호출] 벡엔드에 데이터 전송
    try {
      await apiClient.post('/api/trips', tripData);

      // 성공 처리
      alert(useAI ? "AI 맞춤 일정 생성을 시작합니다!" : "여행이 성공적으로 생성되었습니다!");
      onSuccess();
      onClose();
    } catch (error: any) {
      // 실패 처리
      console.error('여행 생성 실패:', error);
      const errorMessage = error.response?.data?.message || "알 수 없는 오류가 발생했습니다.";
      alert("여행 생성 중 오류가 발생했습니다: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
    
   return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/70 backdrop-blur-md sm:items-center sm:p-4">
      
      {/* 애니메이션을 위한 외부 래퍼 */}
      <div className={`w-full transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-full'} 
                   sm:w-auto sm:translate-y-0 sm:flex sm:items-center sm:justify-center`}>

        {/* 모달 컨테이너 */}
        <div className="bg-white w-full h-full rounded-t-2xl shadow-2xl shadow-blue-500/10 relative flex flex-col max-h-[95vh]
                     sm:max-w-xl sm:h-auto sm:max-h-[90vh] sm:rounded-2xl">
          
          {/* 헤더 */}
          <div className="flex justify-between items-center p-4 border-b border-slate-200 shrink-0 sm:p-6">
            <h2 className="text-lg font-bold text-slate-800 sm:text-xl">새로운 여행 계획</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* 폼 영역 */}
          <div className="overflow-y-auto p-4 custom-scrollbar sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              
              {/* 기본 정보 */}
              <div className="space-y-4">
                <div className="relative" ref={wrapperRef}>
                  <label className="flex items-center text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                    <MapPin className="w-4 h-4 mr-1 text-blue-500"/> 여행지
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input type="text" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setSelectedCity(null); }}
                      placeholder="도시 검색 (예: Seoul, Tokyo)"
                      className="w-full pl-10 p-3 bg-slate-100 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" required />
                  </div>
                  {showDropdown && searchResults.length > 0 && (
                    <ul className="absolute z-10 w-full bg-white border border-slate-100 rounded-xl shadow-xl mt-2 max-h-60 overflow-y-auto">
                      {searchResults.map((city) => (
                        <li key={city.id} onClick={() => handleSelectCity(city)} className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 flex flex-col">
                          <span className="font-bold text-slate-800">{city.city}</span>
                          <span className="text-xs text-slate-500">{city.country}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">여행 제목</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required 
                    className="w-full p-3 bg-slate-100 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider"><Calendar className="w-4 h-4 mr-1 text-blue-500"/> 시작일</label>
                    <input type="date" value={startDate} onChange={handleStartDateChange} required className="w-full p-3 bg-slate-100 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="flex items-center text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider"><Calendar className="w-4 h-4 mr-1 text-slate-400"/> 종료일</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} disabled={!startDate} required className="w-full p-3 bg-slate-100 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed" />
                  </div>
                </div>
                
                {(startDate && endDate) && <FlightInputSection  outDept={flightOutDept}
                                                                setOutDept={setFlightOutDept}
                                                                outArr={flightOutArr}
                                                                setOutArr={setFlightOutArr}
                                                                inDept={flightInDept}
                                                                setInDept={setFlightInDept}
                                                                inArr={flightInArr}
                                                                setInArr={setFlightInArr}/>}

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">한줄 테마 (선택)</label>
                  <input type="text" value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="예: 힐링과 미식의 조화" className="w-full p-3 bg-slate-100 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* AI 설정 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-500" />
                    <span className="font-bold text-slate-800">AI 맞춤 설정</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={useAI} onChange={e => setUseAI(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>

                {useAI && (
                  <div className="space-y-6 pt-2 animate-slideDown">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">누구와 함께?</label>
                      <div className="flex gap-2 flex-wrap">
                        {['혼자', '연인', '친구', '가족'].map((t) => (
                          <button type="button" key={t} onClick={() => setCompanion(t)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${companion === t ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>{t}</button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">
                          <Hotel className="w-4 h-4 mr-1 text-blue-500"/> 숙소 유형
                        </label>
                        <select value={accommodation} onChange={(e) => setAccommodation(e.target.value)}
                          className="w-full p-3 bg-slate-100 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm">
                          <option>호텔</option>
                          <option>에어비앤비/팬션</option>
                          <option>리조트</option>
                          <option>게스트하우스/호스텔</option>
                        </select>
                      </div>
                      <div>
                        <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">
                          <Wallet className="w-4 h-4 mr-1 text-blue-500"/> 예산 수준
                        </label>
                        <div className="flex gap-1">
                          {['가성비', '보통', '럭셔리'].map((t) => (
                            <button type="button" key={t} onClick={() => setBudget(t)}
                              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${budget === t ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>{t}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">여행 속도</label>
                      <div className="flex gap-2">
                        {['여유롭게', '보통', '빡빡하게'].map((t) => (
                          <button type="button" key={t} onClick={() => setPace(t)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${pace === t ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>{t}</button>
                          ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">관심사</label>
                      <div className="flex flex-wrap gap-2">
                        {INTEREST_TAGS.map((tag) => (
                          <button type="button" key={tag} onClick={() => toggleInterest(tag)}
                            className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${interests.includes(tag) ? 'bg-blue-50 border-blue-300 text-blue-800 font-semibold' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}>{tag}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="pt-4">
                <button type="submit" disabled={loading}
                  className={`w-full py-3 rounded-xl font-bold text-base text-white shadow-lg transition-all duration-300 transform
                    sm:py-4 sm:text-lg 
                    ${loading 
                      ? 'bg-slate-400 cursor-not-allowed' 
                      : 'bg-linear-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/30'
                    }`}>
                  {loading ? "저장 중..." : useAI ? "✨ AI로 여행 만들기" : "기본 여행 생성하기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}