"use client";

import { useState, useEffect, useRef } from 'react';
//import { supabase } from '@/lib/supabase';
import apiClient from '@/lib/api';
import { X, Sparkles, MapPin, Calendar, Search, Wallet, Hotel, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react'; // 아이콘 활용
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

// 상수 데이터
const INTEREST_TAGS = ['맛집탐방', '카페투어', '자연/풍경', '쇼핑', '예술/박물관', '액티비티', '호캉스', '야경'];
const COMPANIONS = ['혼자', '연인', '친구', '가족'];
const ACCOMMODATIONS = ['호텔', '에어비앤비/팬션', '리조트', '게스트하우스/호스텔'];
const BUDGETS = ['가성비', '보통', '럭셔리'];
const PACES = ['여유롭게', '보통', '빡빡하게'];

export default function AddTripModal({ isOpen, onClose, onSuccess }: Props) {
  // UI 상태
  const [step, setStep] = useState(1); // 1: 기본정보, 2: AI설정
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // 저장 성공 여부
  
  // 기본 여행 정보
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [theme, setTheme] = useState(''); // 기본 테마 (한줄 요약용)

  // 도시 검색 관련
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<CityData[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityData | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // AI 추천 관련 상태
  const [useAI, setUseAI] = useState(true); // 기본값: AI 사용
  const [style, setStyle] = useState(''); // travelStyle -> style (사용자가 입력하는 '한줄 테마'와 공유 가능)
  const [pace, setPace] = useState('보통');           // pace_preference
  const [accommodation, setAccommodation] = useState('호텔'); // accommodation_type (NEW)
  const [companion, setCompanion] = useState('친구');
  const [budget, setBudget] = useState('보통');      
  const [interests, setInterests] = useState<string[]>([]);

  // 태그 토글 함수
  const toggleInterest = (tag: string) => {
    setInterests(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  // 4가지 비행 시간 상태(FlightInputSection 연동)
  const [flightOutDept, setFlightOutDept] = useState('');
  const [flightOutArr, setFlightOutArr] = useState('');
  const [flightInDept, setFlightInDept] = useState('');
  const [flightInArr, setFlightInArr] = useState('');

  // 모달이 닫힐 때 모든 상태를 초기화
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
          setStep(1);
          setLoading(false);
          setIsSuccess(false);
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
      }, 300); // 애니메이션 후 초기화
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

  // 도시 검색 API 호출(Debounce)
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

  // 다음 단계로 이동
  const handleNextStep = () => {
    if (!selectedCity) { alert("여행할 도시를 검색해서 선택해주세요."); return; }
    if (!title.trim()) { alert("여행 제목을 입력해주세요."); return; }
    if (!startDate || !endDate) { alert("여행 날짜를 모두 선택해주세요."); return; }
    setStep(2);
  };

  // 폼 제출 및 저장 로직 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!selectedCity) return;
    setLoading(true);

    // [데이터 준비] 백엔드의 TripDto.TripRequest와 동일한 구조로 객체 생성
    const tripData = {
      // 기본 정보
      title,
      startDate,
      endDate,
      theme,
      country: selectedCity.country,
      city: selectedCity.city,
      latitude: selectedCity.lat,
      longitude: selectedCity.lng,
      
      // AI 취향 정보
      useAI,
      style: theme || '자유 여행', // Trip_preferences용 'style'. 'theme' 필드와 공유
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

    try {
      // API 호출 : 벡엔드에 데이터 전송
      await apiClient.post('/api/trips', tripData);

      // 성공 처리
      setLoading(false);   // 로딩 끝
      setIsSuccess(true);  // 성공 화면 보여주기!

      // 1.5초 뒤에 모달 닫기 (사용자가 성공 화면을 볼 시간을 줌)
      setTimeout(() => {
        onSuccess(); // 목록 새로고침
        onClose();   // 모달 닫기
      }, 1500);

    } catch (error: any) {
      console.error('생성 실패:', error);
      alert("오류 발생: " + (error.response?.data?.message || "알 수 없는 오류"));
      setLoading(false); // 에러나면 다시 폼으로 돌아감
    }
  };

  if (!isOpen) return null;
    
     return (
    // 배경 어둡게 오버레이
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/70 backdrop-blur-sm sm:items-center sm:p-4 transition-all">
      
      {/* 모달이 아래에서 위로 올라오도록 애니메이션 래퍼 */}
      <div className={`w-full transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-full'} sm:w-auto sm:translate-y-0 sm:flex sm:items-center sm:justify-center`}>
        
        {/* 모달 컨테이너 */}
        <div className="bg-white w-full h-[90vh] rounded-t-2xl shadow-2xl relative flex flex-col sm:w-[550px] sm:h-auto sm:max-h-[85vh] sm:rounded-2xl">
          
          {/* 로딩 중이거나 성공상태면 -> 로딩 관련 화면 표시
             else -> 입력 폼 표시 */}
          
          {(loading || isSuccess) ? (
            <div className="flex flex-col items-center justify-center h-full animate-in fade-in zoom-in-95 duration-300 p-8 text-center">
              {/* 로딩 중일 때 */}
              {loading && (
                <>
                  <div className="relative">
                    {/* 바깥쪽 회색 원 */}
                    <div className="w-20 h-20 border-4 border-slate-100 rounded-full"></div>
                    {/* 빙글빙글 도는 파란색 원 */}
                    <div className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                    {/* 가운데 반짝이는 아이콘 */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-blue-500 animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mt-6">
                    {useAI ? "AI가 여행 계획을 생성 중입니다..." : "여행을 저장하고 있습니다..."}
                  </h3>
                  <p className="text-slate-500 mt-2">
                    {useAI ? "취향을 분석하고 최적의 경로를 찾고 있어요." : "잠시만 기다려주세요."}
                  </p>
                </>
              )}

              {/* 성공했을 때 */}
              {isSuccess && (
                <>
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">등록 완료!</h3>
                  <p className="text-slate-500 mt-2">즐거운 여행 되세요! ✈️</p>
                </>
              )}
            </div>

          ) : (
            // 일반 입력 폼 UI (헤더 + 본문 + 푸터)
            <>
              {/* 헤더 : 단계 표시 및 닫기 버튼 */}
              <div className="shrink-0 border-b border-slate-100">
                <div className="flex justify-between items-center p-5 pb-2">
                  <h2 className="text-xl font-bold text-slate-800">
                    {step === 1 ? "기본 정보 입력" : "AI 맞춤 설정"}
                  </h2>
                  <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                {/* 진행 상태 바*/}
                <div className="w-full h-1 bg-slate-100 mt-3">
                  <div className="h-full bg-blue-600 transition-all duration-500 ease-out" 
                       style={{ width: step === 1 ? '50%' : '100%' }} />
                </div>
              </div>

              {/* 스크롤 가능한 입력 영역 */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar">
                {/* STEP 1: 기본 정보 & 항공 시간 정보 */}
                {step === 1 && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    {/* 도시 검색 */}
                    <div className="relative" ref={wrapperRef}>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">
                        <MapPin className="inline w-4 h-4 mr-1 text-blue-500 mb-0.5"/>여행지
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input type="text" 
                               value={searchTerm} 
                               onChange={(e) => { setSearchTerm(e.target.value); setSelectedCity(null); }}
                               placeholder="도시 검색 (예: Seoul, Paris)"
                               className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"/>
                      </div>
                      {/* 도시 검색 결과 드롭다운 */}
                      {showDropdown && searchResults.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white border border-slate-100 rounded-xl shadow-xl mt-2 max-h-48 overflow-y-auto">
                          {searchResults.map((city) => (
                            <li key={city.id} 
                                onClick={() => handleSelectCity(city)} 
                                className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0">
                              <div className="font-bold text-slate-800">{city.city}</div>
                              <div className="text-xs text-slate-500">{city.country}</div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* 여행 제목 */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">여행 제목</label>
                      <input type="text" value={title} 
                             onChange={(e) => setTitle(e.target.value)} 
                             className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"/>
                    </div>

                    {/* 날짜 선택 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">
                          <Calendar className="inline w-4 h-4 mr-1 text-slate-400 mb-0.5"/>시작일
                        </label>
                        <input type="date" value={startDate} onChange={handleStartDateChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">
                          <Calendar className="inline w-4 h-4 mr-1 text-slate-400 mb-0.5"/>종료일
                        </label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} disabled={!startDate} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 disabled:opacity-50" />
                      </div>
                    </div>

                    {/* 항공 정보 (날짜 선택 시에만 표시) */}
                    {(startDate && endDate) && (
                      <div className="pt-2 border-t border-slate-100">
                        <FlightInputSection 
                          outDept={flightOutDept} setOutDept={setFlightOutDept}
                          outArr={flightOutArr} setOutArr={setFlightOutArr}
                          inDept={flightInDept} setInDept={setFlightInDept}
                          inArr={flightInArr} setInArr={setFlightInArr}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 2: AI 추천*/}
                {step === 2 && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    
                    {/* 모드 선택 스위치 (AI / 일반) */}
                    <div 
                      className={`flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                        useAI 
                          ? 'bg-blue-50 border-blue-200 shadow-blue-100' 
                          : 'bg-slate-50 border-slate-200'
                      }`}
                      onClick={() => setUseAI(!useAI)}>
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full transition-colors ${useAI ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                          {useAI ? <Sparkles className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
                        </div>
                        <div>
                          <div className={`font-bold text-lg ${useAI ? 'text-blue-800' : 'text-slate-700'}`}>
                            {useAI ? "AI 맞춤 추천 받기" : "직접 계획하기"}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {useAI ? "취향을 분석해 초안을 생성해요" : "빈 일정표만 생성합니다"}
                          </div>
                        </div>
                      </div>
                      {/* 스위치 버튼 애니메이션 */}
                      <div className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${useAI ? 'bg-blue-600' : 'bg-slate-300'}`}>
                        <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${useAI ? 'translate-x-6' : 'translate-x-0'}`} />
                      </div>
                    </div>

                    {/* 내용 영역 (AI 사용 여부에 따라 분기) */}
                    {useAI ? (
                      /* AI 켜짐: 상세 옵션 폼 */
                      <div className="space-y-5 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* 한줄 테마 */}
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">여행 테마 (키워드)</label>
                          <input type="text" value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="예: 힐링, 맛집 투어" className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none" />
                        </div>
                        {/* 동행 */}
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">누구와 함께?</label>
                          <div className="flex flex-wrap gap-2">
                            {COMPANIONS.map((t) => (
                              <button key={t} onClick={() => setCompanion(t)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${companion === t ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{t}</button>
                            ))}
                          </div>
                        </div>
                        {/* 숙소 & 예산 & Pace */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">숙소 유형</label>
                            <select value={accommodation} onChange={(e) => setAccommodation(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none">
                              {ACCOMMODATIONS.map(opt => 
                                                    <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">예산</label>
                            <div className="flex bg-slate-100 rounded-lg p-1">
                              {BUDGETS.map((t) => (
                                <button key={t} 
                                        type="button" // form 제출 방지
                                        onClick={() => setBudget(t)} 
                                        className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${budget === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">여행 속도</label>
                            <div className="flex bg-slate-100 rounded-lg p-1">
                              {PACES.map((t) => (
                                <button key={t} 
                                        type="button" // form 제출 방지
                                        onClick={() => setPace(t)} 
                                        className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${pace === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        {/* 관심사 태그 */}
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">관심사</label>
                          <div className="flex flex-wrap gap-2">
                            {INTEREST_TAGS.map((tag) => (
                              <button key={tag} 
                                      type="button" // form 제출 방지
                                      onClick={() => toggleInterest(tag)} 
                                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${interests.includes(tag) ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-600'}`}>
                                {tag}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /*  AI 꺼짐: 심플 안내 메시지 */
                      <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                          <Calendar className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">심플하게 시작할까요?</h3>
                        <p className="text-sm text-slate-500 mt-2 max-w-[250px]">
                          복잡한 설정 없이, 날짜와 도시가 설정된<br/>
                          <strong>빈 일정표</strong>를 생성합니다.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 푸터 */}
              <div className="p-4 sm:p-5 border-t border-slate-100 bg-white rounded-b-2xl shrink-0">
                {step === 1 ? (
                  // 1단계일 때: [다음] 버튼
                  <button onClick={handleNextStep}
                          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2">
                    다음 단계로 <ArrowRight className="w-5 h-5"/>
                  </button>
                ) : (
                  // 2단계일 때: [이전] + [완료] 버튼
                  <div className="flex gap-3">
                    <button onClick={() => setStep(1)}
                            className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors flex items-center gap-2">
                      <ArrowLeft className="w-5 h-5"/> 이전
                    </button>
                    <button onClick={handleSubmit} 
                            disabled={loading}
                            className="flex-1 py-3.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {loading ? "생성 중..." : (useAI ? "✨ AI 일정 생성하기" : "여행 등록 완료")}
                    </button>
                  </div>
                )}
              </div>
            </>
          )} 
        </div>
      </div>
    </div>
  );
}