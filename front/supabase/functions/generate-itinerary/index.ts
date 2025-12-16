import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Configuration, OpenAIApi } from 'https://esm.sh/openai'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS 처리 (브라우저에서 직접 호출 시 필요)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { trip_id } = await req.json()
    
    // 1. Supabase Client 설정
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. 여행 정보 + 취향 정보 + 날짜 정보(Days) 가져오기
    // (Days는 day_id를 알아야 스케줄을 넣을 수 있어서 미리 가져옵니다)
    const { data: trip, error: tripError } = await supabaseClient
      .from('Trips')
      .select(`
        *,
        Trip_preferences(*),
        Days(id, day_number, date)
      `)
      .eq('id', trip_id)
      .single()

    if (tripError || !trip) throw new Error('여행 정보를 찾을 수 없습니다.')

    const pref = trip.Trip_preferences?.[0] || {} // 취향 정보가 없을 수도 있음 대비

    // 3. AI 프롬프트 작성 (가장 중요! 🧠)
    const prompt = `
      너는 전문 여행 플래너야. 아래 여행 정보를 바탕으로 상세 일정을 JSON 형식으로 짜줘.
      
      [여행 정보]
      - 도시: ${trip.location} (${trip.country})
      - 기간: ${trip.start_date} ~ ${trip.end_date}
      - 테마: ${trip.theme || '자유 여행'}

      [비행기 스케줄 정보 (매우 중요)]
      1. 가는 날 (Day 1): 
         - ${pref.flight_out_dept ? `출발: ${pref.flight_out_dept} (출발지)` : ''}
         - ${pref.flight_out_arr ? `도착: ${pref.flight_out_arr} (${trip.location} 공항)` : ''}
      2. 오는 날 (Last Day):
         - ${pref.flight_in_dept ? `출발: ${pref.flight_in_dept} (${trip.location} 공항)` : ''}
         - ${pref.flight_in_arr ? `도착: ${pref.flight_in_arr} (도착지)` : ''}
      
      [여행자 취향]
      - 동행: ${pref.companion_type || '정보 없음'}
      - 스타일: ${pref.pace_preference || '정보 없음'}
      - 숙소유형: ${pref.accommodation_type || '정보 없음'}
      - 관심사: ${pref.interests ? pref.interests.join(', ') : '전반적인 관광'}

      [요청 사항]
      1. **만약 비행기 시간이 있다면, 반드시 해당 시간에 'plane' 로 time과 time_end를 모두 채워서 스케줄에 포함시켜줘.**
         - 예: Day 1, time: "10:00", time_end: "14:00", "제주 국제공항 도착", icon: "plane"
      2. 비행기 도착 시간 이전에는 일정을 잡지 마.
      3. 비행기 출발 시간 이후에는 일정을 잡지 마.
      4. 각 날짜(Day 1, Day 2...)별로 아침, 점심, 오후, 저녁 일정을 구체적인 장소명으로 짜줘.
      5. 동선이 효율적이어야 해.
      6. 장소의 위도(lat), 경도(lng)는 대략적으로라도 꼭 넣어줘.
      7. category은 'food', 'coffee', 'hotel', 'shopping', 'nature', 'car','star','heart' 중에서 골라줘.
      8. 응답은 반드시 아래 JSON 포맷을 엄격하게 지켜줘. (Markdown code block 쓰지 말고 순수 JSON만 반환해)

      [JSON 반환 형식]
      {
        "schedule": [
          {
            "day": 1,
            "activities": [
              {
                "time": "HH:MM",
                "time_end": "HH:MM", 
                "activity": "장소 이름 (한글)",
                "description": "무엇을 하는지 간단 설명",
                "category": "coffee",
                "lat": 35.xxxx,
                "lng": 139.xxxx
              }
            ]
          }
        ]
      }
    `

    // 4. OpenAI 호출
    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // 혹은 'gpt-3.5-turbo-0125' (JSON 모드 지원 모델 권장)
        messages: [
          { role: 'system', content: 'You are a helpful travel assistant. Output JSON only.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" } // JSON 강제 모드
      }),
    })

    const aiData = await response.json()
    const generatedPlan = JSON.parse(aiData.choices[0].message.content)

    // 5. DB에 저장하기 (Schedules 테이블)
    const schedulesToInsert = []

    // AI가 준 데이터 루프 돌면서 DB 구조로 변환
    for (const dayPlan of generatedPlan.schedule) {
      // DB에 있는 해당 날짜의 day_id 찾기
      const targetDay = trip.Days.find((d: any) => d.day_number === dayPlan.day)
      
      if (targetDay) {
        for (const act of dayPlan.activities) {
          schedulesToInsert.push({
            day_id: targetDay.id, // ⭐️ DB의 day_id 연결
            time: act.time,
            time_end: act.time_end, // 👈 [추가] AI가 준 도착 시간을 저장
            activity: act.activity,
            description: act.description,
            icon: act.category,
            lat: act.lat,
            lng: act.lng,
            is_ai_generated: true, // AI가 만듦 표시
            status: 'PLANNED'
          })
        }
      }
    }

    // 한꺼번에 Insert
    if (schedulesToInsert.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('Schedules')
        .insert(schedulesToInsert)
      
      if (insertError) throw insertError
    }

    return new Response(
      JSON.stringify({ message: '일정 생성 완료!', count: schedulesToInsert.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error(error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})