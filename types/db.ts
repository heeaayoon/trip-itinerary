// src/types/db.ts (또는 src/types/index.ts)

// =================================================================
// 1. 데이터베이스 모델 (DB 테이블과 1:1로 대응하는 '재료')
// =================================================================
//가장 큰 단위: 여행 (Trip)
export interface Trip {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  theme?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  Days?: TripDay[]; 
  Trip_Notes?: TripNote[];
  Trip_Tips?: TripTip[];
}

// 중간 단위: 날짜 (Days)
export interface TripDay {
  id: string;
  trip_id: string;
  day_number: number;
  date: string;
  Schedules?: TripSchedule[]; 
}

//가장 작은 단위: 일정 (Schedules)
export interface TripSchedule {
  id: string;
  day_id: string;
  time: string;
  activity: string;
  description?: string;
  icon: string;
  tips?: string;
  lat?: number;
  lng?: number;
}

export interface TripNote {
  id: string;
  trip_id: string;
  user_id: string;
  title: string;
  content?: string;
}

export interface TripTip {
  id: string;
  trip_id: string;
  user_id?: string;
  text: string;
  description?: string;
}

// =================================================================
// 2. 뷰 모델 (UI 컴포넌트가 사용할 예쁘게 가공된 '요리')
// =================================================================

// TripHeader.tsx가 사용할 데이터 모양
export interface TripHeaderInfo {
  title: string;
  dates: string;
  theme?: string;
  location?: string;
}

// DailySchedule.tsx가 사용할 하루치 데이터 모양
export interface DailyScheduleData {
    day: number;
    date: string;
    weather: { desc: string; tempMax: number; } | null;
    plans: TripSchedule[];
    dayId?: string;
}

// 목록 보기용 간소화된 타입
export interface TripForList {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  theme?: string;
  location?: string; // 목록에도 지역이 나오면 좋으니 추가
}