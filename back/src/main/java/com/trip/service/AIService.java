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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
                saveSchedules(aiResult, days, trip);
            }

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("AI 일정 생성 실패: " + e.getMessage());
        }
    }

    // 프롬프트 생성 메서드 (기존 Deno 코드 내용 복사)
    private String createPrompt(Trip trip, TripPreference pref) {
        // 1. null일 수 있는 값들을 안전하게 처리
        String interests = (pref.getInterests() != null && !pref.getInterests().isEmpty()) ? String.join(", ", pref.getInterests()) : "특별한 요청 없음";
        String travelStyle = trip.getTheme() != null ? trip.getTheme() : "자유 여행";

        // 2. 항공편 정보 유무에 따라 flightConstraints 변수 내용 설정
        String flightConstraints;
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
        boolean hasDepartureFlight = trip.getFlightOutDept() != null && trip.getFlightOutArr() != null;
        boolean hasArrivalFlight = trip.getFlightInDept() != null && trip.getFlightInArr() != null;

        if (hasDepartureFlight || hasArrivalFlight) {
            StringBuilder sb = new StringBuilder("\n[확정된 항공편 정보 (이 시간은 반드시 비워둘 것)]\n");
            if (hasDepartureFlight) {
                sb.append(String.format("- 가는 날: %s 출발 ~ %s 도착\n", 
                    trip.getFlightOutDept().toLocalTime().format(timeFormatter),
                    trip.getFlightOutArr().toLocalTime().format(timeFormatter)
                ));
            }
            if (hasArrivalFlight) {
                 sb.append(String.format("- 오는 날: %s 출발 ~ %s 도착\n", 
                    trip.getFlightInDept().toLocalTime().format(timeFormatter),
                    trip.getFlightInArr().toLocalTime().format(timeFormatter)
                ));
            }
            flightConstraints = sb.toString();
        } else {
            flightConstraints = "\n[확정된 항공편 정보]\n- 정보 없음 (공항 일정을 포함하지 말고 자유롭게 일정을 생성해줘.)\n";
        }
       
        // 3. 최종 프롬프트 문자열 생성
        return """
            너는 최고의 여행 플래너야. 아래 정보를 바탕으로 여행객을 위한 완벽한 상세 일정을 JSON 형식으로 생성해줘.
            
            [여행 기본 정보]
            - 도시: %s (%s)
            - 여행 기간: %s 부터 %s 까지
            - 여행 테마: %s
            %s
            [여행자 취향]
            - 동행자: %s
            - 여행 속도: %s
            - 선호 숙소: %s
            - 예산 수준: %s
            - 주요 관심사: %s
            
            [JSON 생성 규칙]
            1. [확정된 항공편 정보]에 시간이 명시되어 있다면, 해당 시간과 겹치지 않게 나머지 활동 시간을 배분해줘.
            2. 항공편 정보가 '정보 없음'이면, 'plane' 카테고리의 일정은 절대 생성하지 마.
            3. 각 활동(activity)의 시간은 "HH:mm" 형식의 문자열로 정확히 표현해줘.
            4. 각 활동의 위도(lat)와 경도(lng)를 최대한 정확하게 찾아줘.
            5. category는 'food', 'cafe', 'tour', 'shopping', 'activity', 'hotel' 중 하나로 지정해줘. ('plane' 제외)
            6. description은 해당 장소에 대한 간단하고 유용한 팁을 1~2 문장으로 작성해줘.
            7. 아래 JSON 반환 형식을 반드시 엄격하게 지켜서, 다른 설명 없이 JSON 코드만 반환해줘.
            
            [JSON 반환 형식]
            {
              "schedule": [
                {
                  "day": 1,
                  "activities": [
                    {
                      "time": "HH:mm",
                      "time_end": "HH:mm",
                      "activity": "장소 이름",
                      "description": "설명",
                      "category": "카테고리",
                      "lat": 12.3456,
                      "lng": 123.4567
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
                travelStyle,
                flightConstraints, // 항공편 제약조건
                pref.getCompanion(),
                pref.getPace(),
                pref.getAccommodation(),
                pref.getBudget(),
                interests
            );
    }

    // 항공편 정보를 보기 좋은 문자열로 포맷팅하는 헬퍼 메소드
    private String formatFlightInfo(LocalDateTime dept, LocalDateTime arr, DateTimeFormatter formatter) {
        // [수정] 두 시간 중 하나라도 없으면 정보 없음으로 반환하여 GPT가 억지로 일정을 짜지 않게 함
        if (dept == null || arr == null) {
            return "정보 없음";
        }
        return "%s 출발 -> %s 도착".formatted(dept.format(formatter), arr.format(formatter));
    }

	// DB 저장 메서드 -> 스케줄 시간순 정렬 및 순서 번호(display) 부여 로직 추가 -> 항공편 정리
    private void saveSchedules(AiDto.AiScheduleResult aiResult, List<Day> days, Trip trip) {
        // --- 1. 항공편과 일반 일정을 분리 ---
        List<Schedule> generalSchedules = new ArrayList<>();
        List<Schedule> departureFlights = new ArrayList<>();
        List<Schedule> arrivalFlights = new ArrayList<>();

        LocalDate startDate = trip.getStartDate();
        LocalDate endDate = trip.getEndDate();

        for (AiDto.AiDailyPlan dayPlan : aiResult.getSchedule()) {
            // 해당 Day 찾기
            Day targetDay = days.stream()
                    .filter(d -> d.getDayNumber() == dayPlan.getDay())
                    .findFirst().orElse(null);

            if (targetDay == null) continue; // 해당 날짜가 없으면 건너뛰기

            for (AiDto.AiActivity act : dayPlan.getActivities()) {
                Schedule schedule = buildSchedule(act, targetDay);
                
                // 항공편인지, 일반 일정인지 카테고리로 구분
                if ("plane".equalsIgnoreCase(act.getCategory())) {
                    // 날짜를 기준으로 출국/입국 항공편 분리
                    if (targetDay.getDate().isEqual(startDate)) {
                        departureFlights.add(schedule);
                    } else if (targetDay.getDate().isEqual(endDate)) {
                        arrivalFlights.add(schedule);
                    } else {
                        // 날짜가 애매한 항공편은 그냥 일반 일정으로 취급
                        generalSchedules.add(schedule);
                    }
                } else {
                    generalSchedules.add(schedule);
                }
            }
        }
        
        // --- 2. 분리된 항공편을 정확한 날짜에 다시 할당 ---
        Day firstDay = days.get(0);
        Day lastDay = days.get(days.size() - 1);
        
        departureFlights.forEach(s -> s.setDay(firstDay));
        arrivalFlights.forEach(s -> s.setDay(lastDay));

        // --- 3. 모든 일정을 다시 하나로 합치기 ---
        List<Schedule> allSchedules = new ArrayList<>();
        allSchedules.addAll(generalSchedules);
        allSchedules.addAll(departureFlights);
        allSchedules.addAll(arrivalFlights);

        // --- 4. 날짜별로 그룹화하여 정렬 및 순서 부여 ---
        Map<Day, List<Schedule>> schedulesByDay = allSchedules.stream()
                .collect(Collectors.groupingBy(Schedule::getDay));
        
        List<Schedule> finalSchedulesToSave = new ArrayList<>();
        
        // DB에 저장된 Day 순서대로(1일차, 2일차...) 정렬하기 위해
        days.sort(Comparator.comparing(Day::getDayNumber)); 
        
        for (Day day : days) {
            List<Schedule> dailySchedules = schedulesByDay.get(day);
            if (dailySchedules != null) {
                // 시간순 정렬
                dailySchedules.sort(Comparator.comparing(Schedule::getTime, Comparator.nullsLast(Comparator.<LocalTime>naturalOrder())));
                
                // 순서 번호 부여
                for (int i = 0; i < dailySchedules.size(); i++) {
                    dailySchedules.get(i).setDisplayOrder(i + 1);
                }
                finalSchedulesToSave.addAll(dailySchedules);
            }
        }
        
        // --- 5. 최종 저장 ---
        scheduleRepository.saveAll(finalSchedulesToSave);
    }

    // [수정] 클래스 레벨로 이동
    private Schedule buildSchedule(AiDto.AiActivity act, Day day) {
        return Schedule.builder()
                .day(day)
                .time(parseTime(act.getTime()))
                .timeEnd(parseTime(act.getTime_end()))
                .activity(act.getActivity())
                .description(act.getDescription())
                .icon(act.getCategory())
                .lat(BigDecimal.valueOf(act.getLat()))
                .lng(BigDecimal.valueOf(act.getLng()))
                .isAiGenerated(true)
                .status(ScheduleStatus.PLANNED)
                .build();
    }

    // [수정] 클래스 레벨로 이동
    private LocalTime parseTime(String timeStr) {
        if (timeStr == null || timeStr.isBlank()) return null;
        try {
            return LocalTime.parse(timeStr, DateTimeFormatter.ofPattern("HH:mm"));
        } catch (Exception e) {
            return null;
        }
    }
}