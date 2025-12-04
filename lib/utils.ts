export function getDatesInRange(startDateStr: string, endDateStr: string): string[] {
  const dates = [];
  const currentDate = new Date(startDateStr);
  const lastDate = new Date(endDateStr);

  while (currentDate <= lastDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}

// Visual Crossing API (Timeline) 호출
export async function getTripWeather(lat: number, lon: number, startDate: string, endDate: string) {
  const API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
  if (!API_KEY) return null;

  try {
    const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lon}/${startDate}/${endDate}?unitGroup=metric&include=days&key=${API_KEY}&contentType=json`;

    // 1시간(3600초) 캐싱 적용
    const res = await fetch(url, { next: { revalidate: 3600 } });
    
    if (!res.ok) return null;

    const data = await res.json();
    
    const weatherMap: Record<string, any> = {};
    data.days.forEach((day: any) => {
      weatherMap[day.datetime] = {
        tempMax: Math.round(day.tempmax),
        tempMin: Math.round(day.tempmin),
        icon: day.icon,
        desc: day.conditions
      };
    });

    return weatherMap;

  } catch (e) {
    console.error("Weather API Error:", e);
    return null;
  }
}