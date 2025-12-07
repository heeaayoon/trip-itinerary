import React from 'react'; 
import { Plane, Coffee, ShoppingBag, MapPin, Star, Heart, CloudSun, Utensils, Hotel, Car } from 'lucide-react';

// 🔥 style 객체 안에 'card' 속성 추가
export const ICON_CONFIG: Record<string, { 
  label: string, 
  Icon: any, 
  style: { 
    text: string, 
    active: string, 
    hover: string,
    card: { bg: string, border: string } // 👈 이 부분을 추가합니다!
  } 
}> = {
  plane: { 
    label: '이동', Icon: Plane, 
    style: { 
      text: 'text-sky-500',
      active: 'bg-sky-500 text-white shadow-sky-200 ring-sky-100',
      hover: 'hover:bg-sky-50 hover:text-sky-600',
      card: { bg: 'bg-sky-50', border: 'border-sky-200' } // 👈
    } 
  },
  hotel: { 
    label: '숙소', Icon: Hotel, 
    style: { 
      text: 'text-indigo-500',
      active: 'bg-indigo-500 text-white shadow-indigo-200 ring-indigo-100',
      hover: 'hover:bg-indigo-50 hover:text-indigo-600',
      card: { bg: 'bg-indigo-50', border: 'border-indigo-200' } 
    } 
  },
  food: { 
    label: '식사', Icon: Utensils, 
    style: { 
      text: 'text-orange-500',
      active: 'bg-orange-500 text-white shadow-orange-200 ring-orange-100',
      hover: 'hover:bg-orange-50 hover:text-orange-600',
      card: { bg: 'bg-orange-50', border: 'border-orange-200' } 
    } 
  },
  coffee: { 
    label: '카페', Icon: Coffee, 
    style: { 
      text: 'text-amber-500',
      active: 'bg-amber-500 text-white shadow-amber-200 ring-amber-100',
      hover: 'hover:bg-amber-50 hover:text-amber-600',
      card: { bg: 'bg-amber-50', border: 'border-amber-200' } 
    } 
  },
  shopping: { 
    label: '쇼핑', Icon: ShoppingBag, 
    style: { 
      text: 'text-pink-500',
      active: 'bg-pink-500 text-white shadow-pink-200 ring-pink-100',
      hover: 'hover:bg-pink-50 hover:text-pink-600',
      card: { bg: 'bg-pink-50', border: 'border-pink-200' } 
    } 
  },
  nature: { 
    label: '관광', Icon: CloudSun, 
    style: { 
      text: 'text-emerald-500',
      active: 'bg-emerald-500 text-white shadow-emerald-200 ring-emerald-100',
      hover: 'hover:bg-emerald-50 hover:text-emerald-600',
      card: { bg: 'bg-emerald-50', border: 'border-emerald-200' }
    } 
  },
  car: { 
    label: '렌트', Icon: Car, 
    style: { 
      text: 'text-slate-500',
      active: 'bg-slate-500 text-white shadow-slate-200 ring-slate-100',
      hover: 'hover:bg-slate-50 hover:text-slate-600',
      card: { bg: 'bg-slate-50', border: 'border-slate-200' }
    } 
  },
  star: { 
    label: '명소', Icon: Star, 
    style: { 
      text: 'text-yellow-500',
      active: 'bg-yellow-500 text-white shadow-yellow-200 ring-yellow-100',
      hover: 'hover:bg-yellow-50 hover:text-yellow-600',
      card: { bg: 'bg-yellow-50', border: 'border-yellow-200' } // 👈
    } 
  },
  heart: { 
    label: '기타', Icon: Heart, 
    style: { 
      text: 'text-rose-500',
      active: 'bg-rose-500 text-white shadow-rose-200 ring-rose-100',
      hover: 'hover:bg-rose-50 hover:text-rose-600',
      card: { bg: 'bg-rose-50', border: 'border-rose-200' } // 👈
    } 
  },
};

// 2. iconMap 자동 생성 (기존 유지)
export const iconMap: Record<string, React.ReactNode> = {
  ...Object.entries(ICON_CONFIG).reduce((acc, [key, config]) => {
    const Icon = config.Icon;
    // 위에서 정의한 style.text 클래스를 그대로 사용
    acc[key] = <Icon className={`w-5 h-5 ${config.style.text}`} />;
    return acc;
  }, {} as Record<string, React.ReactNode>),
  
  pin: <MapPin className="w-5 h-5 text-gray-500" />,
  default: <MapPin className="w-5 h-5 text-gray-300" />
};

export const getIcon = (iconName: string) => {
  return iconMap[iconName] || iconMap['default'];
};

export const ICON_KEYS = Object.keys(ICON_CONFIG);