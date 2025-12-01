import React from 'react'; 
import { Plane, Coffee, ShoppingBag, MapPin, Star, Heart, CloudSun, Utensils, Hotel, Car } from 'lucide-react';

// 1. DB에 저장된 문자열(key) : 실제 컴포넌트(value)
export const iconMap: Record<string, React.ReactNode> = {
  plane: <Plane className="w-5 h-5 text-blue-500" />,
  hotel: <Hotel className="w-5 h-5 text-indigo-500" />,
  food: <Utensils className="w-5 h-5 text-orange-500" />,
  shopping: <ShoppingBag className="w-5 h-5 text-pink-500" />,
  star: <Star className="w-5 h-5 text-yellow-500" />,
  coffee: <Coffee className="w-5 h-5 text-brown-500" />,
  nature: <CloudSun className="w-5 h-5 text-green-500" />,
  car: <Car className="w-5 h-5 text-gray-500" />,
  heart: <Heart className="w-5 h-5 text-rose-500" />,
  // 'pin'은 일반 마커 용도로 추가
  pin: <MapPin className="w-5 h-5 text-gray-500" />,
  
  // 'default'는 getIcon 함수에서 에러 방지용으로만 사용 (선택 목록에는 안 뜸)
  default: <MapPin className="w-5 h-5 text-gray-300" />
};

// 2. 아이콘 가져오는 함수 (화면 표시용)
// 사용법: getIcon('plane') -> 비행기 아이콘 리턴
export const getIcon = (iconName: string) => {
  return iconMap[iconName] || iconMap['default'];
};

// 3. 아이콘 키 목록 (IconSelector에서 반복문 돌릴 때 사용)
// 'default' 키는 선택창에 나오면 이상하니까 제외하고 내보냅니다.
export const ICON_KEYS = Object.keys(iconMap).filter(key => key !== 'default');