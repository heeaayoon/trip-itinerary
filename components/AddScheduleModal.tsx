"use client";

import { useState, useEffect } from 'react';
import { X, MapPin, Clock, Calendar as CalendarIcon, StickyNote, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import IconSelector from './IconSelector';
import { TripDay, TripSchedule } from '@/types/db'; //TripSchedule은 수정을 위한 타입
// ▼▼▼ [수정] Schedule 타입을 import 해야 합니다. (경로는 실제 파일 위치에 맞게 조정하세요) ▼▼▼


// 🔥 구글 맵 관련 라이브러리
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps'; // useMapsLibrary 추가

interface Props {
  days: TripDay[];
  initialDayId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  scheduleToEdit: TripSchedule | null; // 수정할 스케줄 데이터(없으면 null)
}

// 🔥 [중요] libraries 배열은 반드시 컴포넌트 밖에서 상수로 선언해야 합니다.
// (안 그러면 렌더링될 때마다 리로딩되어서 에러남)
const LIBRARIES: ("places")[] = ["places"];

// 🔥 장소 검색 컴포넌트 (수정됨)
function PlaceSearchInput({ 
  defaultValue, 
  onTitleChange, 
  onLocationSelect,
  inputStyle 
}: { 
  defaultValue: string;
  onTitleChange: (val: string) => void;
  onLocationSelect: (lat: number | null, lng: number | null) => void;
  inputStyle: string;
}) {
  // 1. @vis.gl 훅을 사용해 'places' 라이브러리가 로드되었는지 감시
  const placesLib = useMapsLibrary('places');

  // ▼▼▼ [수정 1] 추천 목록 노출 여부를 제어하는 상태 추가 ▼▼▼
  const [showSuggestions, setShowSuggestions] = useState(true);

  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
    init, // 🔥 수동 초기화 함수
  } = usePlacesAutocomplete({
    requestOptions: { /* types: ['establishment'] */ },
    debounce: 300,
    defaultValue: defaultValue,
    initOnMount: false, // 🔥 [핵심] 라이브러리 로드 전까지 자동 실행 방지
  });

  // 2. places 라이브러리가 로드되면 그때 초기화(init) 실행
  useEffect(() => {
    if (placesLib) {
      init();
    }
  }, [placesLib, init]);

  // defaultValue가 바뀌면 검색창 값 업데이트
    useEffect(() => {
    // defaultValue가 외부에서 변경될 때 입력창 값을 업데이트합니다.
    // 단, false 옵션을 주어 이 변경으로 인해 새로운 검색이 실행되는 것을 방지합니다.
    setValue(defaultValue, false);
  }, [defaultValue, setValue]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue(val);
    onTitleChange(val); 
    onLocationSelect(null, null); 
    // ▼▼▼ [수정 2] 사용자가 다시 타이핑하면 목록을 보여주도록 설정 ▼▼▼
    setShowSuggestions(true);
  };

  const handleSelect = async (mainText: string, fullAddress: string) => {
    // ▼▼▼ [수정 3] 클릭 즉시 목록을 숨겨서 리렌더링으로 다시 나타나는 것을 방지 ▼▼▼
    setShowSuggestions(false); 
    setValue(fullAddress, false); // 입력창에는 전체 주소를 보여줍니다.
    onTitleChange(mainText);      // 부모 컴포넌트의 title 상태는 장소 이름으로 설정합니다.
    clearSuggestions();

    try {
      // 위도/경도 검색은 전체 주소로 해야 정확합니다.
      const results = await getGeocode({ address: fullAddress });
      const { lat, lng } = await getLatLng(results[0]);
      onLocationSelect(lat, lng);
    } catch (error) {
      console.error("Error: ", error);
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          value={value}
          onChange={handleInput}
          disabled={!ready} // 라이브러리 로드 전엔 입력 불가
          placeholder="장소 검색 또는 일정 제목 입력"
          className={`${inputStyle} pr-12 font-bold text-lg`}
          autoFocus
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
           <MapPin className="w-5 h-5" />
        </div>
      </div>

      {/* ▼▼▼ [수정 4] status가 "OK"이고, showSuggestions가 true일 때만 목록을 렌더링 ▼▼▼ */}
      {status === "OK" && showSuggestions && (
        <ul className="absolute z-50 w-full bg-white border border-gray-100 rounded-xl mt-2 shadow-xl max-h-48 overflow-y-auto overflow-x-hidden">
          {data.map(({ place_id, description, structured_formatting }) => (
            <li
              key={place_id}
              onClick={() => handleSelect(structured_formatting.main_text, description)}
              className="p-3 hover:bg-sky-50 cursor-pointer text-sm border-b last:border-0 transition-colors flex flex-col"
            >
              <span className="font-bold text-gray-800">
                {structured_formatting.main_text}
              </span>
              <span className="text-xs text-gray-500 truncate">
                {structured_formatting.secondary_text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AddScheduleModal({ days, initialDayId, isOpen, onClose, onSuccess, scheduleToEdit }: Props) {
  // ▼▼▼ [수정] isEditMode 변수를 만들어 추가/수정 모드를 쉽게 구분 ▼▼▼
  const isEditMode = !!scheduleToEdit;
  const [selectedDayId, setSelectedDayId] = useState(initialDayId);
  const [loading, setLoading] = useState(false);
  
  const [icon, setIcon] = useState('plane');
  const [time, setTime] = useState('12:00');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tips, setTips] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  // 아이콘별 힌트
  const getPlaceholders = (iconType: string) => {
    switch(iconType) {
      case 'food': return { desc: '추천 메뉴, 예약 정보 등' };
      case 'hotel': return { desc: '체크인 안내, 룸 타입 등' };
      case 'transport': return { desc: '출발지 -> 도착지, 소요시간 등' };
      case 'shopping': return { desc: '사야 할 물건 리스트' };
      default: return { desc: '상세 내용 메모' };
    }
  };

  const placeholders = getPlaceholders(icon);

   useEffect(() => {
    // 모달이 열릴 때만 실행
    if (isOpen) {
      // "수정 모드"일 경우, 전달받은 스케줄 데이터로 폼을 채움
      if (isEditMode && scheduleToEdit) {
        setSelectedDayId(scheduleToEdit.day_id);
        setIcon(scheduleToEdit.icon || 'plane');
        setTime(scheduleToEdit.time || '12:00');
        setTitle(scheduleToEdit.activity || '');
        setDescription(scheduleToEdit.description || '');
        setTips(scheduleToEdit.tips || '');
        setLat(scheduleToEdit.lat|| null);
        setLng(scheduleToEdit.lng|| null);
      } else {
        // "추가 모드"일 경우, 폼을 깨끗하게 비움
        setSelectedDayId(initialDayId);
        setIcon('plane');
        setTime('12:00');
        setTitle('');
        setDescription('');
        setTips('');
        setLat(null);
        setLng(null);
      }
    }
  }, [isOpen, scheduleToEdit, isEditMode, initialDayId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return alert("제목을 입력해주세요!");

    setLoading(true);

    const scheduleData = {
      day_id: selectedDayId,
      time,
      activity: title,
      description,
      tips,
      icon,
      lat,
      lng
    };

    let error;

    if (isEditMode) {
      // "수정 모드"일 경우 update 실행
      const { error: updateError } = await supabase
        .from('Schedules')
        .update(scheduleData)
        .eq('id', scheduleToEdit.id); // 어떤 스케줄을 수정할지 id로 지정
      error = updateError;
    } else {
      // "추가 모드"일 경우 insert 실행
      const { error: insertError } = await supabase
        .from('Schedules')
        .insert(scheduleData);
      error = insertError;
    }

    setLoading(false);

    if (error) {
      alert("오류가 발생했습니다.");
    } else {
      onSuccess();
      onClose();
    }
  };

  function formatDate(dateStr: string) {
    return dateStr.replace(/-/g, '.');
  }

  const inputStyle = "w-full bg-gray-50 hover:bg-gray-100 focus:bg-white border-none rounded-2xl px-4 py-3.5 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-sky-100 transition-all duration-200 outline-none";
  const labelStyle = "text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1";

  return (
    // 🔥 [수정] libraries={LIBRARIES} 추가 (필수)
    <APIProvider 
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
      libraries={LIBRARIES}
    >
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-lg rounded-4xl shadow-2xl relative max-h-[90vh] overflow-y-auto flex flex-col">
          
          <button 
            onClick={onClose} 
            className="absolute top-5 right-5 z-10 p-2 bg-white/50 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="pt-8 pb-6 px-6 bg-linear-to-b from-sky-50/50 to-white flex flex-col items-center">
            <span className="text-xs font-semibold text-sky-600 mb-3 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
              일정 카테고리 선택
            </span>
            <IconSelector selectedIcon={icon} onSelect={setIcon} />
          </div>

          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}><CalendarIcon className="w-3 h-3 inline mr-1 mb-0.5"/>DATE</label>
                <div className="relative">
                  <select
                    value={selectedDayId}
                    onChange={(e) => setSelectedDayId(e.target.value)}
                    className={`${inputStyle} appearance-none cursor-pointer`}
                  >
                    {days.map((day) => (
                      <option key={day.id} value={day.id}>
                        Day {day.day_number} ({formatDate(day.date)})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                </div>
              </div>
              <div>
                <label className={labelStyle}><Clock className="w-3 h-3 inline mr-1 mb-0.5"/>TIME</label>
                <input 
                  type="time" 
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className={`${inputStyle} text-center font-medium`}
                />
              </div>
            </div>

            <div>
              <label className={labelStyle}>TITLE & PLACE</label>
              {/* PlaceSearchInput 내부에서 useMapsLibrary로 로딩 체크함 */}
              <PlaceSearchInput 
                defaultValue={title}
                onTitleChange={(val) => setTitle(val)} 
                onLocationSelect={(latitude, longitude) => { 
                  setLat(latitude);
                  setLng(longitude);
                }}
                inputStyle={inputStyle}
              />
              {lat && lng && (
                <p className="text-[10px] text-sky-600 mt-1.5 ml-1 flex items-center font-medium animate-in fade-in slide-in-from-top-1">
                  <MapPin className="w-3 h-3 mr-1" /> 지도 위치가 설정되었습니다.
                </p>
              )}
            </div>

            <div>
              <label className={labelStyle}><StickyNote className="w-3 h-3 inline mr-1 mb-0.5"/>MEMO</label>
              <textarea 
                placeholder={placeholders.desc}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`${inputStyle} h-24 resize-none`}
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-amber-500 uppercase tracking-wider mb-1.5 ml-1">
                <Sparkles className="w-3 h-3 inline mr-1 mb-0.5"/>HONEY TIP
              </label>
              <input 
                type="text" 
                placeholder="메모하기"
                value={tips}
                onChange={(e) => setTips(e.target.value)}
                className="w-full bg-amber-50 hover:bg-amber-100/50 focus:bg-white border-none rounded-2xl px-4 py-3.5 text-gray-800 placeholder-amber-400/70 focus:ring-2 focus:ring-amber-200 transition-all duration-200 outline-none"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white text-lg font-bold py-4 rounded-2xl transition-all active:scale-[0.98] mt-4 shadow-xl shadow-gray-200"
            >
              {loading 
                ? "저장 중..." 
                : isEditMode ? "일정 수정" : "일정 등록"}
            </button>
            
          </form>
        </div>
      </div>
    </APIProvider>
  );
}