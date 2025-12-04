//supabase에서 데이터 패치하는 함수 모음
import { supabase } from './supabase';
import { TripForList, Trip } from '@/types/db';

//모든 여행 데이터를 가져오는 함수
export async function getAllTrips(): Promise<TripForList[]> {
  const { data, error } = await supabase
    .from('Trips')
    .select('id, title, start_date, end_date, theme') // 목록에서는 간단한 정보만 가져옵니다.
    .order('start_date', { ascending: false }); // 최신 여행 순으로 정렬

  if (error) {
    console.error('DB 에러 (모든 여행):', error);
    return []; // 에러 시 빈 배열 반환
  }

  // data가 null일 경우를 대비해 빈 배열을 반환합니다.
  return data || [];
}

//url의 id를 받아서 해당하는 데이터만 가져오는 함수
export async function getTripById(id: string) {
  const { data, error } = await supabase
    .from('Trips')
    .select(`
      *,
      Days (
        *,
        Schedules (*)
      ),
      "Trip_Notes" (*),
      "Trip_Tips" (*)
    `)
    .eq('id', id) // URL에서 받은 id와 일치하는 데이터만 선택
    .order('day_number', { foreignTable: 'Days', ascending: true }) //Days 테이블의 day_number열 순서대로 정렬
    .order('time', { foreignTable: 'Days.Schedules', ascending: true }) //Schedules 테이블의 time 순서대로 정렬 
    // ▼▼▼ [추가] 노트와 팁도 생성된 시간 순서대로 정렬하면 좋습니다. ▼▼▼
    .order('created_at', { foreignTable: '"Trip_Notes"', ascending: true })
    .order('created_at', { foreignTable: '"Trip_Tips"', ascending: true })
    .single(); // id는 고유하므로 하나의 데이터만 가져옴

  if (error) {
    console.error(`DB 에러 (ID: ${id}):`, error);
    return null;
  }

  // ▼▼▼ [수정] 반환되는 데이터의 타입이 바뀌었으므로, Trip 타입을 확장해야 합니다. ▼▼▼
  // (아래 2단계에서 Trip 타입 정의를 수정할 것입니다.)
  return data; // as Trip; -> 일단 타입 단언을 제거하거나 any로 처리
}