"use server";

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// 🔥 1. 여행 하루 연장하기 (Add Day)
export async function extendTripOneDay(tripId: string, currentEndDate: string) {
  const supabase = await createClient();

  // 1) 새로운 날짜 계산 (종료일 + 1)
  const date = new Date(currentEndDate);
  date.setDate(date.getDate() + 1);
  const newDateStr = date.toISOString().split('T')[0];

  // 2) Trips 테이블 업데이트 (end_date 변경)
  const { error: tripError } = await supabase
    .from('Trips')
    .update({ end_date: newDateStr })
    .eq('id', tripId);

  if (tripError) {
    console.error("여행 날짜 업데이트 실패:", tripError);
    throw new Error("여행 날짜 업데이트 실패");
  }

  // 3) 🔥 [핵심] Days 테이블에 새로운 날짜 Row 추가!
  // 현재 Day가 몇 개인지 세어서 다음 번호(day_number)를 구함
  const { count } = await supabase
    .from('Days')
    .select('*', { count: 'exact', head: true })
    .eq('trip_id', tripId);

  const nextDayNumber = (count || 0) + 1;

  const { error: dayError } = await supabase
    .from('Days')
    .insert({
      trip_id: tripId,
      date: newDateStr,
      day_number: nextDayNumber,
      day_theme: '' // 테마는 비워둠
    });

  if (dayError) {
    console.error("Day 데이터 생성 실패:", dayError);
    throw new Error("Day 데이터 생성 실패");
  }

  // 4) 페이지 새로고침
  revalidatePath(`/trip/${tripId}`);
}


// 🔥 2. 여행 하루 단축하기 (Delete Day)
export async function shortenTripOneDay(tripId: string, currentEndDate: string) {
  const supabase = await createClient();

  // 1) 새로운 종료일 계산 (현재 종료일 - 1)
  const date = new Date(currentEndDate);
  date.setDate(date.getDate() - 1);
  const newEndDateStr = date.toISOString().split('T')[0];

  // 2) 🔥 [핵심] 지워질 날짜(현재 종료일)의 Days 데이터 삭제
  // Cascade 설정이 되어 있다면 생략 가능하지만, 명시적으로 지우는 것이 안전함
  const { error: dayError } = await supabase
    .from('Days')
    .delete()
    .eq('trip_id', tripId)
    .eq('date', currentEndDate); // 마지막 날짜와 일치하는 Day 삭제

  if (dayError) {
    console.error("Day 데이터 삭제 실패:", dayError);
    throw new Error("Day 데이터 삭제 실패");
  }

  // 3) Trips 테이블 업데이트
  const { error: tripError } = await supabase
    .from('Trips')
    .update({ end_date: newEndDateStr })
    .eq('id', tripId);

  if (tripError) {
    console.error("여행 날짜 단축 실패:", tripError);
    throw new Error("여행 날짜 단축 실패");
  }

  // 4) 페이지 새로고침
  revalidatePath(`/trip/${tripId}`);
}


// 🔥 3. 여행 전체 삭제 (기존 코드 유지)
export async function deleteTrip(tripId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('Trips')
    .delete()
    .eq('id', tripId);

  if (error) {
    console.error("여행 삭제 실패:", error);
    throw new Error("여행 삭제 실패");
  }

  revalidatePath('/');
}