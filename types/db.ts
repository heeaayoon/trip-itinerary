// 1. 가장 작은 단위: 스케줄
export interface Schedule {
  id: string;
  time: string;
  activity: string;
  description: string; // DB 컬럼명이 desc가 아니라 description이었는지 확인 필요!
  tips?: string;
  icon: string; // 이제 아이콘은 컴포넌트가 아니라 '문자열(plane)'입니다.
}

// 2. 중간 단위: 일자 (Days)
export interface TripDay {
  id: string;
  day_number: number;
  date: string;
  day_theme: string;
  Schedules: Schedule[]; // 1:N 관계라서 배열로 들어옵니다.
}

// 3. 가장 큰 단위: 여행 (Trip)
export interface Trip {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  theme: string;
  weather_info: string;
  Days: TripDay[]; // 1:N 관계
}