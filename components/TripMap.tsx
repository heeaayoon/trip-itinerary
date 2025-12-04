"use client";

import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import { Polyline } from './Polyline'; 
import { TripSchedule } from '@/types/db';

interface Props {
  schedules: TripSchedule[]; // 해당 날짜의 일정들
}

export default function TripMap({ schedules }: Props) {
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  // 좌표가 있는 일정만 필터링
  const validSchedules = schedules.filter(s => s.lat && s.lng);

  // 지도의 중심점 계산 (첫 번째 일정 기준, 없으면 기본값 도쿄)
  const defaultCenter = validSchedules.length > 0 
    ? { lat: validSchedules[0].lat!, lng: validSchedules[0].lng! }
    : { lat: 35.6895, lng: 139.6917 };

  return (
    <div className="w-full h-[300px] rounded-2xl overflow-hidden shadow-sm border border-gray-100 my-4">
      <APIProvider apiKey={API_KEY}>
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={13}
          gestureHandling={'cooperative'} // 스크롤 방지 (Ctrl+스크롤 해야 줌)
          disableDefaultUI={true} // 깔끔하게 UI 제거
          mapId="DEMO_MAP_ID" // 성능 최적화를 위한 ID (구글 콘솔에서 생성 가능하지만 데모용 문자열도 작동)
        >
          {/* 1. 마커 찍기 */}
          {validSchedules.map((item, index) => (
            <Marker 
              key={item.id} 
              position={{ lat: item.lat!, lng: item.lng! }}
              label={{
                text: (index + 1).toString(), // 순서 번호 표시 (1, 2, 3...)
                color: "white",
                fontWeight: "bold"
              }}
            />
          ))}

          {/* 2. 경로 그리기 (Polyline) */}
          {validSchedules.length > 1 && (
            <Polyline
              path={validSchedules.map(s => ({ lat: s.lat!, lng: s.lng! }))}
              strokeColor={"#FF385C"} // 로즈 컬러
              strokeOpacity={0.8}
              strokeWeight={4}
              geodesic={true}
            />
          )}
        </Map>
      </APIProvider>
    </div>
  );
}