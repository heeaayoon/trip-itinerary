import { Plane, Coffee, ShoppingBag, MapPin, Star, Heart, CloudSun, Utensils, Hotel, Car } from 'lucide-react';
import { TripInfo, ItineraryDay, Consideration } from '@/types/itinerary';

export const tripInfo: TripInfo = {
    title: "30년지기 우정 여행: 구마모토",
    dates: "2025년 2월 6일(목) - 2월 8일(토)",
    theme: "걷기 싫은 친구를 위한 쇼핑 & 미식 힐링 투어",
    weather: "2월 구마모토는 한국보다 따뜻하지만 쌀쌀함 (평균 5~12도). 가벼운 패딩이나 코트 추천."
  };

export const itinerary: ItineraryDay[] = [
    {
      day: "1일차",
      date: "2월 6일 (목)",
      theme: "설레는 도착 & 아케이드 탐방",
      schedule: [
        {
          time: "13:30",
          activity: "구마모토 공항 도착",
          desc: "입국 수속 후 택시 탑승 (4명이라 택시가 짐 이동에 훨씬 유리합니다)",
          icon: <Plane className="w-5 h-5 text-blue-500" />,
          tips: "시내까지 택시로 약 40~50분 소요 (약 5~6천엔 예상)"
        },
        {
          time: "15:00",
          activity: "호텔 체크인 & 짐 풀기",
          desc: "추천 숙소: 시내 중심가(토리초스지) 근처 호텔",
          icon: <Hotel className="w-5 h-5 text-indigo-500" />,
          tips: "짐만 맡기고 가볍게 나옵니다."
        },
        {
          time: "15:30",
          activity: "늦은 점심: 구마모토 라멘 or 카츠",
          desc: "고쿠테이 라멘 또는 카츠레츠 테이 (현지 맛집)",
          icon: <Utensils className="w-5 h-5 text-orange-500" />,
          tips: "줄 서기 싫다면 애매한 시간대가 기회!"
        },
        {
          time: "17:00",
          activity: "시모토리 & 가미토리 아케이드 쇼핑",
          desc: "지붕이 있어 날씨 영향 없고 평지인 최적의 쇼핑 장소.",
          icon: <ShoppingBag className="w-5 h-5 text-pink-500" />,
          tips: "드럭스토어, 잡화점 구경. 걷기 힘든 친구는 중간 카페에서 휴식."
        },
        {
          time: "19:00",
          activity: "저녁: 향토 요리와 사케",
          desc: "개별실이 있는 이자카야에서 오붓하게 회포 풀기.",
          icon: <Star className="w-5 h-5 text-yellow-500" />,
          tips: "말고기 회(바사시)가 부담스럽다면 해산물 위주로."
        }
      ]
    },
    {
      day: "2일차",
      date: "2월 7일 (금)",
      theme: "우아한 정원 산책 & 백화점 쇼핑",
      schedule: [
        {
          time: "10:00",
          activity: "느긋한 조식 후 택시 이동",
          desc: "오전 서두르지 않고 컨디션 조절",
          icon: <Coffee className="w-5 h-5 text-brown-500" />,
          tips: "호텔 로비에서 택시 호출"
        },
        {
          time: "11:00",
          activity: "스이젠지 조주엔 (정원)",
          desc: "평지로 된 아름다운 정원. 많이 걷지 않고 '고킨덴주' 찻집에서 말차 한잔하며 풍경 감상.",
          icon: <CloudSun className="w-5 h-5 text-green-500" />,
          tips: "걷기 싫은 친구는 찻집에 앉아만 있어도 힐링 되는 뷰."
        },
        {
          time: "13:00",
          activity: "점심: 아카우시(붉은 소) 스테이크 덮밥",
          desc: "구마모토 명물 소고기 요리. 부드러워서 부모님 세대도 좋아함.",
          icon: <Utensils className="w-5 h-5 text-red-500" />,
          tips: "유명한 식당은 웨이팅이 있으니 예약 추천."
        },
        {
          time: "14:30",
          activity: "츠루야 백화점 쇼핑",
          desc: "구마모토 최고의 백화점. 구마몬 스퀘어도 안에 있음.",
          icon: <ShoppingBag className="w-5 h-5 text-purple-500" />,
          tips: "손수건, 양산, 화장품 등 50대 취향 저격 아이템 다수. 다리가 아프면 각 층 소파 이용."
        },
        {
          time: "17:00",
          activity: "카페 디저트 타임",
          desc: "백화점 내 혹은 근처의 고급 찻집에서 휴식.",
          icon: <Coffee className="w-5 h-5 text-amber-600" />,
          tips: "저녁 식사 전 체력 보충."
        },
        {
          time: "19:00",
          activity: "저녁: 샤브샤브 or 스키야키",
          desc: "따뜻한 국물 요리로 몸 녹이기.",
          icon: <Heart className="w-5 h-5 text-rose-500" />,
          tips: "무한리필보다는 퀄리티 좋은 코스 요리 추천."
        }
      ]
    },
    {
      day: "3일차",
      date: "2월 8일 (토)",
      theme: "마지막 기념품 & 편안한 귀국",
      schedule: [
        {
          time: "10:00",
          activity: "체크아웃 & 택시로 구마모토역 이동",
          desc: "호텔 -> 구마모토역 (약 15분 소요)",
          icon: <Car className="w-5 h-5 text-gray-500" />,
          tips: "짐은 구마모토역 코인락커에 보관하거나 역 쇼핑몰 카트에 싣기."
        },
        {
          time: "10:30",
          activity: "아뮤플라자 구마모토 (역사 내 쇼핑몰)",
          desc: "최신 쇼핑몰. 동선이 깔끔하고 엘리베이터가 잘 되어 있어 걷기 편함.",
          icon: <ShoppingBag className="w-5 h-5 text-blue-400" />,
          tips: "마지막 선물(과자, 사케 등) 구매 최적지. 7층 정원 뷰도 좋음."
        },
        {
          time: "12:00",
          activity: "점심: 역 내 식당가",
          desc: "이동 없이 한 건물에서 해결. 스시, 우동 등 선택지 다양.",
          icon: <Utensils className="w-5 h-5 text-green-600" />,
          tips: ""
        },
        {
          time: "12:50",
          activity: "공항 리무진 버스 or 택시",
          desc: "구마모토역 앞에서 공항행 리무진 탑승 (약 1시간 소요)",
          icon: <Plane className="w-5 h-5 text-sky-500" />,
          tips: "14:30 비행기이므로 12:30~13:00 사이에는 출발해야 안전."
        }
      ]
    }
  ];

export const considerations: Consideration[] = [
    { text: "이동 최소화", desc: "4인 기준 택시비 N분의 1 하면 부담스럽지 않습니다. 다리 아픈 친구를 위해 적극적으로 택시를 타세요." },
    { text: "쇼핑 스팟", desc: "시모토리 아케이드(로드샵 느낌), 츠루야 백화점(고급), 아뮤플라자(쾌적함) 세 곳이면 충분합니다." },
    { text: "음식", desc: "50대 여성분들께 인기 많은 '아카우시(소고기)', '두부 요리', '장어' 등을 추천합니다." },
    { text: "준비물", desc: "편한 신발은 필수지만, 멋도 포기할 수 없다면 굽 낮은 부츠 추천. 2월 바람이 차니 스카프 꼭 챙기세요." }
  ];