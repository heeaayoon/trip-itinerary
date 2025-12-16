// DB에서 가져온 날것의 데이터를(Repository), 
// 비즈니스 로직에 맞춰 가공한 뒤(Service), 
// 페이지(Controller/View)에 전달하는 역할
// 상세페이지를 위해서 가공된 모든 데이터들
import { getTripById } from '@/lib/supabaseData';
import { getDatesInRange, getTripWeather } from '@/lib/utils';
import { Trip, TripHeaderInfo, DailyScheduleData } from '@/types/db';

// 날짜 포매팅
function formatDate(dateStr: string) {
  return dateStr.replace(/-/g, '.');
}

export async function getTripFullData(id: string) {
  // 1. DB에서 '재료'를 가져옵니다 (반환 타입: Trip | null)
  const trip: Trip | null = await getTripById(id);
  if (!trip) return null;

  // 2. 날짜 리스트 생성
  const dateList = getDatesInRange(trip.start_date, trip.end_date);

  // 3. 날씨 데이터 가져오기
  let weatherData = null;
  if (trip.latitude && trip.longitude) {
    weatherData = await getTripWeather(trip.latitude, trip.longitude, trip.start_date, trip.end_date);
  }

  // 4-1. TripHeader가 사용할 최종 데이터 형태로 가공 (TripHeaderInfo 타입)
  const tripHeaderInfo: TripHeaderInfo = {
    title: trip.title,
    dates: `${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}`,
    theme: trip.theme,
    location: trip.location
  };
  
  // 4-2. DailySchedule가 사용할 최종 데이터 형태로 가공 (DailyScheduleData[] 타입)
  const scheduleData: DailyScheduleData[] = dateList.map((date, index) => {
    const matchingDay = trip.Days?.find((d) => d.date === date);
    return {
      day: index + 1,
      date: date,
      weather: weatherData ? weatherData[date] : null,
      plans: matchingDay?.Schedules || [],
      dayId: matchingDay?.id 
    };
  });

  //UI 컴포넌트(View)가 바로 사용할 수 있도록 가공된 최종 데이터 반환
  return {
    tripHeaderInfo: tripHeaderInfo, 
    scheduleData: scheduleData,
    tripId: trip.id,
    rawDays: trip.Days || [],
    tripNotes: trip.Trip_Notes || [],
    tripTips: trip.Trip_Tips || [],
  };
}