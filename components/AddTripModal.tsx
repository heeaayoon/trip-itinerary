"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

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
  city_ascii: string;
  admin_name: string;
  country: string;
  lat: number;
  lng: number;
}

export default function AddTripModal({ isOpen, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  
  // 폼 입력값
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [theme, setTheme] = useState('');
  
  // 검색 관련 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<CityData[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityData | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 1. 초기화
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSearchResults([]);
      setSelectedCity(null);
      setTitle('');
      setStartDate('');
      setEndDate('');
      setTheme('');
    }
  }, [isOpen]);

  // 2. 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. 검색 로직 (Debounce)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }
      if (selectedCity && searchTerm === selectedCity.city) return;

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

  if (!isOpen) return null;

  // 🔥 [NEW] 시작일 변경 핸들러
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);

    // 만약 종료일이 이미 선택되어 있는데, 새로운 시작일보다 과거라면 종료일을 초기화
    if (endDate && newStartDate > endDate) {
      setEndDate('');
    }
  };

  // 🔥 [핵심 수정] 저장 로직 (Trips 생성 후 Days 자동 생성)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate || !selectedCity) {
      alert("모든 정보를 입력해주세요!");
      return;
    }

    setLoading(true);

    try {
      // 1. Trips 테이블에 여행 생성하고 ID 받아오기
      const { data: tripData, error: tripError } = await supabase
        .from('Trips')
        .insert({ 
          title, 
          start_date: startDate, 
          end_date: endDate, 
          theme,
          location: selectedCity.city,
          country: selectedCity.country,
          admin_name: selectedCity.admin_name,
          latitude: selectedCity.lat,
          longitude: selectedCity.lng
        })
        .select()
        .single();

      if (tripError || !tripData) throw tripError;

      // 2. 생성된 여행 기간만큼 'Days' 데이터 생성하기
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

      // 3. Days 테이블에 한꺼번에 넣기
      const { error: daysError } = await supabase
        .from('Days')
        .insert(daysToInsert);

      if (daysError) throw daysError;

      alert("여행이 생성되었습니다! ✈️");
      onSuccess();
      onClose();

    } catch (error) {
      console.error('생성 실패:', error);
      alert("여행 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 [누락되었던 부분 복구] 도시 선택 핸들러
  const handleSelectCity = (city: CityData) => {
    setSelectedCity(city);
    setSearchTerm(`${city.city}, ${city.country}`);
    setShowDropdown(false);
  };
  

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-xl p-8 shadow-2xl relative overflow-visible">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">&times;</button>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">새로운 여행 추가</h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">여행 제목</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} 
                required placeholder="예: 즐거운 유럽 여행"
                className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
          </div>

          {/* 여행지 검색 */}
          <div className="relative" ref={wrapperRef}>
            <label className="block text-sm font-medium text-gray-700">여행지 검색 (영문)</label>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setSelectedCity(null); }}
              placeholder="예: Seoul, Paris, New York..."
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              required
            />
            {showDropdown && searchResults.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                {searchResults.map((city) => (
                  <li key={city.id} onClick={() => handleSelectCity(city)} className="p-3 hover:bg-sky-50 cursor-pointer border-b last:border-b-0 flex flex-col">
                    <span className="font-bold text-gray-800">{city.city}</span>
                    <span className="text-xs text-gray-500">{city.admin_name ? `${city.admin_name}, ` : ''}{city.country}</span>
                  </li>
                ))}
              </ul>
            )}
             {/* 검색 결과 없음 표시 */}
             {showDropdown && searchResults.length === 0 && searchTerm.length >= 2 && !selectedCity && (
              <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 p-3 text-sm text-gray-500">
                검색 결과가 없습니다.
              </div>
            )}
          </div>

          {/* 🔥 [수정] 날짜 입력 부분 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">시작일</label>
              {/* handleStartDateChange 사용 */}
              <input 
                type="date" 
                value={startDate} 
                onChange={handleStartDateChange} 
                required 
                className="mt-1 block w-full border border-gray-300 rounded-md p-2" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">종료일</label>
              {/* min 속성에 startDate 연결 */}
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                min={startDate}       // 🔥 시작일 이전 날짜는 선택 불가
                disabled={!startDate}  // 🔥 시작일 없으면 입력 불가
                required 
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 disabled:bg-gray-100 disabled:text-gray-400" 
              />
            </div>
          </div>
          
          {/* 테마 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">여행 테마 (선택)</label>
            <input type="text" value={theme} onChange={(e) => setTheme(e.target.value)} 
                    placeholder="예: 힐링, 맛집 탐방"
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
          </div>

          <div className="text-right pt-4">
            <button type="submit" disabled={loading} className="px-6 py-2 font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 disabled:bg-gray-400">
              {loading ? "저장 중..." : "저장하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}