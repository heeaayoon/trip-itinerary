package com.trip.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trip.dto.AiDto;
import com.trip.entity.*;
import com.trip.repository.ScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class AIService {

    @Value("${openai.api.key}") // application.properties에 키 저장 필요
    private String openAiKey;

    private final ScheduleRepository scheduleRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    public AIService(ScheduleRepository scheduleRepository) {
        this.scheduleRepository = scheduleRepository;
    }

    public void createAiSchedule(Trip trip, List<Day> days, TripPreference pref) {
        try {
            // 1. 프롬프트 작성 (Java String Block 사용)
            String prompt = createPrompt(trip, pref);

            // 2. OpenAI 호출
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(openAiKey);

            AiDto.ChatRequest request = new AiDto.ChatRequest("gpt-4o", prompt); // 모델명 확인
            HttpEntity<AiDto.ChatRequest> entity = new HttpEntity<>(request, headers);

            AiDto.ChatResponse response = restTemplate.postForObject(
                    "https://api.openai.com/v1/chat/completions", entity, AiDto.ChatResponse.class);

            // 3. 응답 파싱
            if (response != null && !response.getChoices().isEmpty()) {
                String content = response.getChoices().get(0).getMessage().getContent();
                content = content.replace("```json", "").replace("```", "").trim();
                AiDto.AiScheduleResult aiResult = objectMapper.readValue(content, AiDto.AiScheduleResult.class);

                // 4. DB 저장 (Entity 변환)
                saveSchedules(aiResult, days);
            }

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("AI 일정 생성 실패: " + e.getMessage());
        }
    }

    // 프롬프트 생성 메서드 (기존 Deno 코드 내용 복사)
    private String createPrompt(Trip trip, TripPreference pref) {
    	// null일 수 있는 값들을 안전하게 처리하기 위한 헬퍼 메소드
        String interests = (pref.getInterests() != null && !pref.getInterests().isEmpty()) ? String.join(", ", pref.getInterests()) : "특별한 요청 없음";
        DateTimeFormatter flightFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        
        // 항공편 정보를 trip 객체에서 가져오고, null일 경우를 대비하여 처리합니다.
        String flightOutInfo = formatFlightInfo(trip.getFlightOutDept(), trip.getFlightOutArr(), flightFormatter);
        String flightInInfo = formatFlightInfo(trip.getFlightInDept(), trip.getFlightInArr(), flightFormatter);
        
        // travel_style 대신 trip.getTheme()을 사용합니다.
        String travelStyle = trip.getTheme() != null ? trip.getTheme() : "자유 여행";

        return """
            너는 최고의 여행 플래너야. 아래 정보를 바탕으로 여행객을 위한 완벽한 상세 일정을 JSON 형식으로 생성해줘.
            
            [여행 기본 정보]
            - 도시: %s (%s)
            - 여행 기간: %s 부터 %s 까지
            - 여행 테마: %s
            
            [여행자 취향]
            - 동행자: %s
            - 여행 속도: %s
            - 선호 숙소: %s
            - 예산 수준: %s
            - 주요 관심사: %s
            
            [항공편 정보]
            - 가는 날: %s
            - 오는 날: %s
            
            [JSON 생성 규칙]
            1. 항공편 정보가 있다면, 반드시 '공항 출발'과 '공항 도착' 일정을 포함하고 category를 'plane'으로 설정해줘.
            2. 각 활동(activity)의 시간은 "HH:mm" 형식의 문자열로 정확히 표현해줘.
            3. 각 활동의 위도(lat)와 경도(lng)를 최대한 정확하게 찾아줘.
            4. category는 'food', 'cafe', 'tour', 'shopping', 'activity', 'hotel', 'plane' 중 하나로 지정해줘.
            5. description은 해당 장소에 대한 간단하고 유용한 팁을 1~2 문장으로 작성해줘.
            6. 아래 JSON 반환 형식을 반드시 엄격하게 지켜서, 다른 설명 없이 JSON 코드만 반환해줘.
            
            [JSON 반환 형식]
            {
              "schedule": [
                {
                  "day": 1,
                  "activities": [
                    {
                      "time": "HH:MM",
                      "time_end": "HH:MM",
                      "activity": "장소 또는 활동 이름",
                      "description": "장소에 대한 설명 및 팁",
                      "category": "아이콘으로 사용할 카테고리",
                      "lat": 12.345678,
                      "lng": 123.456789
                    }
                  ]
                }
              ]
            }
            """.formatted(
                trip.getCity(),
                trip.getCountry(),
                trip.getStartDate().toString(),
                trip.getEndDate().toString(),
                trip.getTheme(),
                pref.getCompanion(), // [수정] DTO 필드명에 맞게 companionType -> companion
                pref.getPace(),      // [수정] DTO 필드명에 맞게 pacePreference -> pace
                pref.getAccommodation(),
                pref.getBudget(),
                interests,
                flightOutInfo,   // [수정] trip 객체에서 가져온 정보 사용
                flightInInfo     // [수정] trip 객체에서 가져온 정보 사용
            );
    }

    // 항공편 정보를 보기 좋은 문자열로 포맷팅하는 헬퍼 메소드
    private String formatFlightInfo(LocalDateTime dept, LocalDateTime arr, DateTimeFormatter formatter) {
        if (dept == null || arr == null) {
            return "정보 없음";
        }
        return "%s -> %s".formatted(dept.format(formatter), arr.format(formatter));
    }

	// DB 저장 메서드
    private void saveSchedules(AiDto.AiScheduleResult aiResult, List<Day> days) {
        List<Schedule> schedulesToSave = new ArrayList<>();

        for (AiDto.AiDailyPlan dayPlan : aiResult.getSchedule()) {
            // 해당 Day 찾기 (dayNumber로 매칭)
            Day targetDay = days.stream()
                    .filter(d -> d.getDayNumber() == dayPlan.getDay())
                    .findFirst().orElse(null);

            if (targetDay != null) {
                for (AiDto.AiActivity act : dayPlan.getActivities()) {
                    schedulesToSave.add(Schedule.builder()
                            .day(targetDay)
                            .time(parseTime(act.getTime()))
                            .timeEnd(parseTime(act.getTime_end()))
                            .activity(act.getActivity())
                            .description(act.getDescription())
                            .icon(act.getCategory())
                            .lat(BigDecimal.valueOf(act.getLat()))
                            .lng(BigDecimal.valueOf(act.getLng()))
                            .isAiGenerated(true)
                            .status(ScheduleStatus.PLANNED)
                            .build());
                }
            }
        }
        scheduleRepository.saveAll(schedulesToSave);
    }

    private LocalTime parseTime(String timeStr) {
        try {
            return LocalTime.parse(timeStr, DateTimeFormatter.ofPattern("HH:mm"));
        } catch (Exception e) {
            return null;
        }
    }
}