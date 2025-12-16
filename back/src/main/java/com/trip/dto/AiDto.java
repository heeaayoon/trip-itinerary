package com.trip.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;

public class AiDto {
	// OpenAI에게 보낼 요청
    @Data
    public static class ChatRequest {
        private String model;
        private List<Message> messages;
        private ResponseFormat response_format;

        public ChatRequest(String model, String prompt) {
            this.model = model;
            this.messages = List.of(
                new Message("system", "You are a helpful travel assistant. Output JSON only."),
                new Message("user", prompt)
            );
            this.response_format = new ResponseFormat("json_object");
        }
    }

    @Data
    @AllArgsConstructor
    public static class Message {
        private String role;
        private String content;
    }

    @Data
    @AllArgsConstructor
    public static class ResponseFormat {
        private String type;
    }

    // OpenAI로부터 받을 응답
    @Data
    public static class ChatResponse {
        private List<Choice> choices;
    }

    @Data
    public static class Choice {
        private Message message;
    }

    // AI가 뱉어낸 JSON 문자열을 파싱할 객체 (스케줄 구조)
    @Data
    public static class AiScheduleResult {
        private List<AiDailyPlan> schedule;
    }

    @Data
    public static class AiDailyPlan {
        private int day;
        private List<AiActivity> activities;
    }
	@Data
    public static class AiActivity {
        private String time;
        private String time_end;
        private String activity;
        private String description;
        private String category; // icon -> category로 변경
        private Double lat;
        private Double lng;
    }

}
