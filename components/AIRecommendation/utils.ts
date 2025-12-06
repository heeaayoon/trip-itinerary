//각종 계산 로직
import { ICON_CONFIG } from "@/utils/iconMap";


// 1. 아이콘 결정 로직 (유저 의도 + 구글 데이터)
export const determineIcon = (userType: string) => {
    // UI에서 선택한 한글(userType)을 -> ICON_CONFIG의 영어 키(Key)로 변환
  const map: Record<string, string> = {
    '식사': 'food',
    '카페': 'coffee',
    '술집': 'food', // ⚠️ ICON_CONFIG에 'beer'가 없으므로 'food'로 연결 (혹은 'heart' 등)
    '명소': 'star', // ICON_CONFIG에서 'star'의 라벨이 '명소'임
  };

  // 매핑된 게 있으면 그걸 쓰고, 혹시라도 없으면 기본값 'food'
  return map[userType] || 'food';
};

// 2. 다음 시간 자동 계산 로직 수정
export const calculateNextTime = (schedules: any[]) => {
    // 기존 일정이 없으면 오전 10시 시작
    if (schedules.length === 0) return "10:00";

    // 마지막 일정 가져오기
    const lastSchedule = schedules[schedules.length - 1];
    const lastTimeStr = lastSchedule.time || "10:00"; 

    try {
        // 시간 포맷이 "HH:MM:SS"일 수도 있고 "HH:MM"일 수도 있음
        // 앞의 2개(시, 분)만 잘라서 사용
        const [hourStr, minuteStr] = lastTimeStr.split(':');
        let hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10); // 분은 그대로 유지
        hour += 2; // 2시간 추가
        if (hour >= 24) hour = 23; // 24시 넘어가면 23시로 고정 (당일치기 기준)

        // "09:05" 형태로 포맷팅
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    } catch (e) {
        console.error("시간 계산 에러:", e);
        return "12:00"; // 에러 시 기본값
        }
    };

// 3. 대분류에 따른 소분류 옵션 반환
export const getSubtypes = (type:string) => {
    switch (type) {
      case '식사': return ['한식', '양식', '일식', '중식', '아시안', '로컬맛집'];
      case '술집': return ['이자카야', '와인', '칵테일', '맥주'];
      case '명소': return ['공원', '박물관', '쇼핑', '야경'];
      default: return [];
    }
  };


// 4. 구글 데이터 -> 내부 데이터 변환 (매핑)
export const formatGooglePlace = (p: any) => {
    let priceNum: number | undefined = undefined;
          
    const priceMap: Record<string, number> = {
    'FREE': 0,
    'INEXPENSIVE': 1,      // ₩
    'MODERATE': 2,         // ₩₩
    'EXPENSIVE': 3,        // ₩₩₩
    'VERY_EXPENSIVE': 4    // ₩₩₩₩
    };


    if (p.priceLevel && typeof p.priceLevel === 'string') {
        priceNum = priceMap[p.priceLevel]; 
    } else if (typeof p.priceLevel === 'number') {
        priceNum = p.priceLevel;
    }

    return {
    place_id: p.id,
    name: p.displayName,
    vicinity: p.formattedAddress,
    rating: p.rating,
    user_ratings_total: p.userRatingCount,
    photos: p.photos,
    geometry: { location: p.location },
    types: p.types,
    isOpen: p.regularOpeningHours?.openNow,
    price_level: priceNum // 변환된 숫자 전달
    };
};