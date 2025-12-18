"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import type { TripHeaderInfo, DailyScheduleData, TripNote, TripTip } from '@/types/db';
import TripMainView from '@/components/Details/TripMainView';

interface TripDetailDataFromApi {
  tripHeaderInfo: TripHeaderInfo;
  scheduleData: DailyScheduleData[];
  tripId: string;
  tripNotes: TripNote[];
  tripTips: TripTip[];
}

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;
  
  // 상태의 타입은 API로부터 받은 데이터 타입으로 지정합니다.
  const [tripData, setTripData] = useState<TripDetailDataFromApi | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tripId) return;
    
    const fetchTripDetail = async () => {
      try {
        setLoading(true);
        // 백엔드 API를 호출
        const response = await apiClient.get(`/api/trips/${tripId}`);
        const data: TripDetailDataFromApi = response.data;
        console.log("여행 상세 정보 응답:", data);

        // 데이터를 화면에 그리기 전에 다시 정렬
        // DB에 저장된 순서가 꼬여 있을 수 있기 때문
        if (data.scheduleData) {
          data.scheduleData.forEach((day) => {
            if (day.plans) {
              day.plans.sort((a: any, b: any) => {
                // 1순위: displayOrder (순서 번호) 오름차순
                const orderA = a.displayOrder ?? 999; // 없으면 맨 뒤로
                const orderB = b.displayOrder ?? 999;
                
                if (orderA !== orderB) {
                  return orderA - orderB;
                }

                // 2순위 (번호가 같으면): 시작 시간(time) 오름차순
                // 시간이 없으면(null) 맨 뒤로 보냄
                const timeA = a.time || '23:59';
                const timeB = b.time || '23:59';
                return timeA.localeCompare(timeB);
              });
            }
          });
        }
        setTripData(data);
      } catch (error: any) {
        console.error("여행 상세 정보 로드 실패:", error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          alert("이 여행을 볼 권한이 없습니다. 다시 로그인해주세요.");
          router.push('/login');
        } else {
          alert("여행 정보를 불러오는 데 실패했습니다.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchTripDetail();
  }, [tripId, router]);

  // 로딩 및 에러 UI 처리
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!tripData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>해당 여행 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  // 데이터 로딩이 성공하면, TripMainView를 렌더링하고,
  // API로부터 받은 tripData 객체를 'data' prop에 통째로 넘겨줍니다.
  // rawDays는 TripService에서 따로 만들어주지 않았으므로, 임시로 빈 배열을 넘겨줍니다.
  return (
    <main className="container mx-auto p-4">
      <TripMainView data={{ ...tripData, rawDays: [] }} />
    </main>
  );
}