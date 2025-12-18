package com.trip.dto;

import java.math.BigDecimal;
import java.security.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import com.trip.entity.Schedule;
import com.trip.entity.Trip;
import com.trip.entity.TripNote;
import com.trip.entity.TripTip;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

//여행과 관련된 모든 데이터 전송 객체들의 모임
public class TripDto {

	// 1. 요청(Request) DTO: 클라이언트 -> 서버
	//여행작성 요청 DTO
	//여행에 대해 작성시에 사용자로부터 필수적으로 받아오는 정보
	@Getter
	@Setter
	@NoArgsConstructor
	public static class TripRequest{
		//기본 정보(Trips 테이블)
		private String title;
		private LocalDate startDate;
		private LocalDate endDate;
		private String theme;
		private String country;
		private String city;
		private BigDecimal latitude;
		private BigDecimal longitude;
		//비행 정보
		// LocalDateTime -> LocalTime으로 변경
        private LocalTime flightOutDept; 
        private LocalTime flightOutArr; 
        private LocalTime flightInDept;
        private LocalTime flightInArr;
		
		//AI 추천시에 필요한 취향 정보(Trip_preferences 테이블)
		private Boolean useAI; // 프론트엔드의 useAI 상태값 (true/false)
		private String style;
		private String pace;
		private String accommodation; 
		private String companion;
		private String budget;
		private List<String> interests; 
		
	}
	
	// 2. 응답(Response) DTO: 서버 -> 클라이언트
	//여행 목록페이지에 필요한 정보 응답 DTO
	@Setter
	@Getter
	public static class TripResponse{
	    private String id; // 필수 정보: 상세 페이지 이동 등에 사용
	    // 화면 표시에 사용되는 기본 정보들
	    private String title;
	    private java.time.LocalDate startDate;
	    private java.time.LocalDate endDate;
	    private String country;
	    private String city;
	    private String status; // 상태 정보: '계획 중' 뱃지 등을 표시할 때 사용

	    // 생성자: Trip 엔티티에서 필요한 정보만 뽑아서 DTO의 필드값을 채움
	    public TripResponse(Trip trip) {
	        this.id = trip.getId().toString(); // UUID는 문자열로 변환
	        this.title = trip.getTitle();
	        this.startDate = trip.getStartDate();
	        this.endDate = trip.getEndDate();
	        this.country = trip.getCountry();
	        this.city = trip.getCity();
	        this.status = trip.getStatus();
	    }
	}
	
	//여행 상세 페이지에 사용되는 모든 정보
	@Getter
	@Setter
	@NoArgsConstructor
	public static class TripDetailResponse{
		private String tripId;
		private TripHeaderInfo tripHeaderInfo; // 여행 헤더 정보 (제목, 기간 등)
        private List<DailyScheduleData> scheduleData; // 날짜별 상세 일정 목록
        private List<NoteDto> tripNotes; // [추가]
        private List<TipDto> tripTips;   // [추가]
	}

	//상세 페이지의 헤더(TripHeader.tsx)에 필요한 정보
    @Getter
    @Setter
    @NoArgsConstructor
    public static class TripHeaderInfo {
        private String title;
        private String dates;
        private String theme;
        private String city;
    }

    //상세 페이지의 하루치(DailySchedule.tsx) 정보
    @Getter
    @Setter
    @NoArgsConstructor
    public static class DailyScheduleData {
        private int day;            // 여행 N일차 (예: 1)
        private String date;        // 해당 날짜 ("YYYY-MM-DD")
        private WeatherInfo weather;  // 해당 날의 날씨 정보
        private List<ScheduleDto> plans; // 해당 날의 세부 일정 목록
        private String dayId;       // Day 테이블의 고유 ID
    }
    
    //세부 일정 하나(Plan)의 정보를 담는 DTO입니다.
    //Schedule 엔티티와 거의 동일하지만, 프론트엔드가 사용하기 편한 형태로 가공됩니다.
    @Getter
    @Setter
    @NoArgsConstructor
    public static class ScheduleDto {
        private String id;
        private LocalTime time;    // LocalTime은 JSON에서 "HH:mm:ss" 형태의 문자열로 변환됨
        private LocalTime timeEnd;
        private String activity;
        private String description;
        private String icon;
        private String tips;
        private BigDecimal lat;
        private BigDecimal lng;
        private String status;

        // Schedule 엔티티를 이 DTO로 변환
        public ScheduleDto(Schedule entity) {
            this.id = entity.getId().toString();
            this.time = entity.getTime();
            this.timeEnd = entity.getTimeEnd();
            this.activity = entity.getActivity();
            this.description = entity.getDescription();
            this.icon = entity.getIcon();
            this.tips = entity.getTips();
            this.lat = entity.getLat();
            this.lng = entity.getLng();
            this.status = (entity.getStatus() != null) ? entity.getStatus().name() : null; // Enum은 name()으로 문자열 변환
        }
    }

    //외부 날씨 API로부터 받아온 날씨 정보를 담는 DTO
    @Getter
    @Setter
    @NoArgsConstructor
    public static class WeatherInfo {
    	private String icon;
        private String desc;   
        private Double tempMax;
    }
    
    /**
    * NoteDto: 여행 노트 하나의 정보를 담는 DTO입니다.
    * TripNote 엔티티에서 프론트엔드에 필요한 정보만 선별하여 담습니다.
    */
   @Getter
   @Setter
   @NoArgsConstructor
   public static class NoteDto {
       private String id;
       private String title;
       private String content;
       private String authorName; // [포인트!] User 객체 전체 대신, 작성자의 '이름'만 보냅니다.
       private java.sql.Timestamp updatedAt;

       // TripNote 엔티티를 이 DTO로 변환하는 생성자
       public NoteDto(TripNote entity) {
           this.id = entity.getId().toString();
           this.title = entity.getTitle();
           this.content = entity.getContent();
           // User 객체가 null일 수 있는 경우를 대비하여 안전하게 처리합니다.
           this.authorName = (entity.getUser() != null) ? entity.getUser().getName() : "알 수 없음";
           this.updatedAt = entity.getUpdatedAt();
       }
   }

   /**
    * TipDto: 여행 팁 하나의 정보를 담는 DTO입니다.
    * TripTip 엔티티에서 프론트엔드에 필요한 정보만 선별하여 담습니다.
    */
   @Getter
   @Setter
   @NoArgsConstructor
   public static class TipDto {
       private String id;
       private String text;
       private String description;
       private String authorName; // 작성자 이름

       // TripTip 엔티티를 이 DTO로 변환하는 생성자
       public TipDto(TripTip entity) {
           this.id = entity.getId().toString();
           this.text = entity.getText();
           this.description = entity.getDescription();
           this.authorName = (entity.getUser() != null) ? entity.getUser().getName() : "알 수 없음";
       }
   }
}