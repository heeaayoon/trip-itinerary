package com.trip.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.trip.dto.TripDto;
import com.trip.entity.Day;
import com.trip.entity.Trip;
import com.trip.entity.TripParticipant;
import com.trip.entity.TripParticipantId;
import com.trip.entity.TripPreference;
import com.trip.entity.User;
import com.trip.repository.*;

//날짜루프를 돌려서 Day 데이터 생성
//AI옵션이 켜진 경우 -> tripPreference 저장
@Service
public class TripService {
    private final TripRepository tripRepository;
    private final TripPreferenceRepository preferenceRepository;
    private final DayRepository dayRepository;
    private final UserRepository userRepository;
    private final TripParticipantRepository tripParticipantRepository; // 인터페이스 타입으로 주입
    private final AIService aiService;
    // 외부 API와 통신하기 위한 HTTP 클라이언트. Spring이 자동으로 Bean을 주입해줍니다.
    private final RestTemplate restTemplate;
    
    @Value("${weather.api.key}")
    private String weatherApiKey;
    
    @Autowired
    public TripService(TripRepository tripRepository,
                       TripPreferenceRepository preferenceRepository,
                       DayRepository dayRepository,
                       UserRepository userRepository,
                       TripParticipantRepository tripParticipantRepository, // 수정된 레포지토리 주입
                       AIService aiService,
                       RestTemplate restTemplate) {
        this.tripRepository = tripRepository;
        this.preferenceRepository = preferenceRepository;
        this.dayRepository = dayRepository;
        this.userRepository = userRepository;
        this.tripParticipantRepository = tripParticipantRepository; // 수정된 레포지토리 주입
        this.aiService = aiService;
        this.restTemplate = restTemplate;}
    
    /**
     * Visual Crossing API를 호출하여 특정 날짜의 날씨 정보를 가져와 Day 엔티티에 저장합니다.
     * 이 정보는 나중에 실시간 API 실패 시의 백업 데이터로 사용됩니다.
     */
    private void setDayWeatherFromApi(Day day, Double lat, Double lon, LocalDate date) {
        try {
            // 특정 날짜 한정 API URL 생성 (시작일과 종료일을 동일하게 설정)
            String weatherApiUrl = String.format(
                "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/%s,%s/%s/%s?unitGroup=metric&include=days&key=%s&contentType=json",
                lat, lon, date.toString(), date.toString(), weatherApiKey
            );
            
            // API 호출
            ResponseEntity<JsonNode> response = restTemplate.getForEntity(weatherApiUrl, JsonNode.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode weatherData = response.getBody();
                // days 배열의 첫 번째 요소가 해당 날짜의 날씨 정보입니다.
                JsonNode dayWeather = weatherData.path("days").get(0); 
                
                if (dayWeather != null) {
                    // Day 엔티티에 날씨 정보 저장 (DB 컬럼에 매핑)
                    // Day 엔티티에 setWeatherForecast(String), setWeatherTemp(Double) 등의 setter가 있다고 가정합니다.
                    day.setWeatherForecast(dayWeather.path("conditions").asText()); // 예: 'Partially cloudy'
                    Double tempMaxDouble = dayWeather.path("tempmax").asDouble();;     // 예: 25.5
                }
            }
        } catch (Exception e) {
            // API 호출 중 오류가 나도 여행 생성이 실패하면 안 되므로 예외를 잡아 로그만 남깁니다.
            System.err.println("Day (" + date + ") 날씨 API 호출 및 저장 실패: " + e.getMessage());
        }
    }
	    
	    //여행 생성 -> DB 저장 전체 로직
	    @Transactional //하나라도 실패하면 전체 롤백
	    public TripDto.TripResponse createTrip(TripDto.TripRequest request, String email){
	    	//1.토큰 이메일로 현재 로그인한 유저 찾기
	    	User user = userRepository.findByEmail(email)
	    			.orElseThrow(()->new RuntimeException("사용자를 찾을 수 없습니다."));
	    	//2.기본 여행 정보 저장(Trips 테이블)
	    	Trip trip = Trip.builder()
	    			.title(request.getTitle())
	    			.startDate(request.getStartDate())
	    			.endDate(request.getEndDate())
	    			.theme(request.getTheme() != null ? request.getTheme() : "자유 여행")
	    			.country(request.getCountry())
	    			.city(request.getCity())
	    			.latitude(request.getLatitude())
	    			.longitude(request.getLongitude())
	    			.status("PLANNING")
	    			.creator(user) //User연결
	    			.flightOutDept(request.getFlightOutDept())
                    .flightOutArr(request.getFlightOutArr())
                    .flightInDept(request.getFlightInDept())
                    .flightInArr(request.getFlightInArr())
	    			.build();
	    	Trip savedTrip = tripRepository.save(trip); //먼저 저장해야 trip id가 생성됨
	    	
	    	//트립 저장 후, 여행을 생성한 user를 첫번째 참여자로 테이블에 넣기
	    	TripParticipant participant = new TripParticipant();
	    	participant.setId(new TripParticipantId(savedTrip.getId(), user.getId())); // 복합키 설정 <- TripParticipantId.java 이용
	    	participant.setTrip(savedTrip);
	    	participant.setUser(user);
	    	participant.setRole("ADMIN"); // 생성자는 관리자(ADMIN) 역할을 부여

	    	tripParticipantRepository.save(participant); // 참여자 정보 저장
	    	
	    	//3.날짜 차이만큼 반복문 돌려서 Day 데이터 생성(Days 테이블)
	    	List<Day> savedDays = new ArrayList<>();
	    	LocalDate current = request.getStartDate();
	    	LocalDate end = request.getEndDate();
	    	int dayCount = 1;
	    	
	    	// Day 생성 시 날씨 저장을 위해 DTO의 좌표를 Double로 변환
	    	Double latDouble = request.getLatitude() != null ? request.getLatitude().doubleValue() : null;
	    	Double lonDouble = request.getLongitude() != null ? request.getLongitude().doubleValue() : null;
	    	boolean hasCoordinates = latDouble != null && lonDouble != null;
	    	
	    	//시작일부터 종료일까지 데이터 생성 후, 한번에 저장
	    	while(!current.isAfter(end)) {
	    		Day day = Day.builder()
	    				.trip(savedTrip) //앞서 저장한 Trip과 연결
	    				.dayNumber(dayCount++)
	    				.date(current)
	    				.dayTheme("")
	    				.build();
	    		
	    		// Day 엔티티 생성 시점에 날씨 정보 API 호출 후 DB에 백업
	    		if (hasCoordinates) {
	    			setDayWeatherFromApi(day, latDouble, lonDouble, current);
	    		}
	    		savedDays.add(day);
	    		current = current.plusDays(1);
	    	}
	    	dayRepository.saveAll(savedDays); // 날씨 정보가 포함된 Day 엔티티를 모두 저장
	    
	    	//4.AI 사용시에만, 사용자 취향 데이터 저장(Trip_preferences 테이블)
	    	if (Boolean.TRUE.equals(request.getUseAI())) {
	            TripPreference savedPref = TripPreference.builder()
	                    .trip(savedTrip) //앞서 저장한 Trip과 연결
	                    .pace(request.getPace())
	                    .accommodation(request.getAccommodation())
	                    .companion(request.getCompanion())
	                    .budget(request.getBudget())
	                    .interests(request.getInterests()) 
	                    .build();
	            
	            preferenceRepository.save(savedPref);
	            
	            aiService.createAiSchedule(savedTrip, savedDays, savedPref);//AI 서비스 호출
	    	}
	    	return new TripDto.TripResponse(savedTrip);
	    }
	    
	    //여행 목록을 조회하는 로직
	    public List<Trip> findTripsByUser(User user) {
	        // 이전에 만들어둔 Repository 메소드를 호출합니다.
	        return tripRepository.findAllByCreator(user);
	    }
	    
	    //여행 상세페이지를 조회하는 로직 -> TripDetailResponse DTO 형태로 가공하여 반환
	    @Transactional(readOnly = true) //순수 조회 작업이므로, readOnly=true 옵션으로 DB 성능을 최적화
	    public TripDto.TripDetailResponse getTripDetail(UUID tripId) {
	        
	    	//@EntityGraph 이용해서 N+1 문제 해결했음(tripRepository) 참조
	    	//이 코드에서 DB안의 Trip, Days, Schedules 테이블을 모두 가져왔음
	        Trip trip = tripRepository.findById(tripId)
	                .orElseThrow(() -> new RuntimeException("ID에 해당하는 여행을 찾을 수 없습니다: " + tripId));

	        //프론트엔드로 보낼 DTO들을 가공
	        
	        //1.Header 정보 만들기
	        TripDto.TripHeaderInfo headerInfo = new TripDto.TripHeaderInfo();
	        headerInfo.setTitle(trip.getTitle());
	        headerInfo.setCity(trip.getCity());
	        headerInfo.setTheme(trip.getTheme());
	        // 날짜 포맷팅
	        //LocalDate 객체("2025-12-11")를 -> "2025.12.11" 형식의 문자열로 변환
	        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy.MM.dd");
	        String formattedDates = trip.getStartDate().format(formatter) + " - " + trip.getEndDate().format(formatter);
	        headerInfo.setDates(formattedDates);
	        
	        //2. 외부 날씨 정보 가져오기(실시간 API) -> 나중에 프론트로 이동시키기
	        JsonNode weatherData = null; // 날씨 API 응답 전체를 담을 변수
	        if (trip.getLatitude() != null && trip.getLongitude() != null) {
	            try {
	                // Visual Crossing API URL 생성
	                String weatherApiUrl = String.format(
	                    "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/%s,%s/%s/%s?unitGroup=metric&include=days&key=%s&contentType=json",
	                    trip.getLatitude(), trip.getLongitude(), trip.getStartDate(), trip.getEndDate(), weatherApiKey
	                );
	                
	                // RestTemplate을 사용하여 외부 API에 GET 요청을 보내고, 응답을 JsonNode(JSON 트리) 형태로 받습니다.
	                ResponseEntity<JsonNode> response = restTemplate.getForEntity(weatherApiUrl, JsonNode.class);
	                
	                if (response.getStatusCode().is2xxSuccessful()) {
	                    weatherData = response.getBody();
	                }
	            } catch (Exception e) {
	            	// 실시간 API 호출 실패. weatherData = null 상태를 유지하여 Fallback 로직으로 연결
	                System.err.println("실시간 날씨 API 호출 실패: DB 백업 데이터 사용을 시도합니다. " + e.getMessage());
	            }
	        }
	        
	        //3.날짜별 스케줄 리스트 만들기
	        List<TripDto.DailyScheduleData> scheduleDataList = new ArrayList<>();
	        
	        //여행 시작일부터 종료일까지의 모든 날짜 리스트 생성
	        // 시작일 12/11, 종료일 12/12 -> dateList: [2025-12-11, 2025-12-12]
	        List<LocalDate> dateList = trip.getStartDate().datesUntil(trip.getEndDate().plusDays(1))
	                .collect(Collectors.toList());

	        int dayCount = 1;
	        //생성된 날짜 리스트를 순회하면서 각 날짜에 해당하는 DailyScheduleData DTO 생성
	        //왜? 날짜별로 다른 정보를 담고 있기 때문
	        for (LocalDate currentDate : dateList) {
	            Day matchingDay = trip.getDays().stream() //SELECT * FROM days WHERE trip_id = ? 이 여기서 실행되지 XX -> 앞에서 이미 다 가져왔음
	                    								  //trip.getDays()로 Days 엔티티를 가져옴(DB에서 가져오는거 아님)
	            		.filter(day -> day.getDate() != null && day.getDate().equals(currentDate)) //days 테이블에서 현재의 currentDate와 같은 값을 가져옴
	                    .findFirst()
	                    .orElse(null); //일치하는 날짜가 없으면 null (이 날짜에는 DB에 일정이 없음)

	            TripDto.DailyScheduleData dailyData = new TripDto.DailyScheduleData();
	            dailyData.setDay(dayCount++); // 1일차, 2일차 순서 부여
	            dailyData.setDate(currentDate.toString()); // 'YYYY-MM-DD' 형식의 문자열 날짜 설정
	            
	            TripDto.WeatherInfo weatherInfo = new TripDto.WeatherInfo();
	            boolean weatherDataFound = false;
	            
	            //4.날씨 데이터 가공 및 설정 (실시간 API 우선)
	            if (weatherData != null) {
	                //전체 날씨 데이터('days' 배열)를 순회하면서
	                for (JsonNode dayWeather : weatherData.path("days")) {
	                	//현재 날짜와 일치하는 날씨 정보를 찾기
	                    if (dayWeather.path("datetime").asText().equals(currentDate.toString())) {
	                    	//실시간 API 응답에서 추출된 값을 각 DTO에 저장
	                    	weatherInfo.setIcon(dayWeather.path("icon").asText());
	                        weatherInfo.setDesc(dayWeather.path("conditions").asText());
	                        weatherInfo.setTempMax(dayWeather.path("tempmax").asDouble());      
	                        weatherDataFound = true;
	                        break; // 해당 날짜의 날씨를 찾았으므로 루프 중단
	                    }
	                }
	            }
	            //실시간 API 실패 시 DB 백업 데이터 사용
	            if (!weatherDataFound && matchingDay != null && matchingDay.getWeatherForecast() != null) {
	                // DB에 저장된 백업 데이터로 DTO 채우기
	                weatherInfo.setDesc(matchingDay.getWeatherForecast());
	                if (matchingDay.getWeatherTemp() != null) {
	                    weatherInfo.setTempMax(matchingDay.getWeatherTemp().doubleValue());
	                }
	                // Icon 필드는 Day 엔티티에 없으므로 DTO에 설정하지 않음 (null 유지)
	                weatherDataFound = true;
	            }
	            
	            // 날씨 정보가 찾아졌다면 (API 또는 DB에서) DTO에 설정
	            if (weatherDataFound) {
	                dailyData.setWeather(weatherInfo);
	            }
	            
	            // 5. DB 일정 정보(Day, Schedule)를 DTO로 변환
	            //위에서 day, date,weather 저장 완료  
	            if (matchingDay != null) {
	                dailyData.setDayId(matchingDay.getId().toString()); //dayId 저장
	                List<TripDto.ScheduleDto> plans = matchingDay.getSchedules().stream() //SELECT * FROM schedules WHERE day_id = ? 이 여기서 실행되지 XX -> 앞에서 이미 다 가져왔음
							  															  //matchingDay.getSchedules()로 schedules 엔티티를 가져옴(DB에서 가져오는거 아님)
	                        .map(TripDto.ScheduleDto::new) //각 Schedule 엔티티를 프론트엔드용 Schedule DTO 객체로 변환
	                        .collect(Collectors.toList());
	                dailyData.setPlans(plans); //하루의 모든 스케줄(plans)을 저장
	            } else {
	            	//.orElse(null)에 걸린 경우 = currentDate에 해당하는 Day 엔티티(DB 일정)가 없는 경우
	                // 빈 리스트를 설정해 프론트에서 처리할 수 있도록 함
	                dailyData.setPlans(new ArrayList<>());
	            }
	         // 최종적으로 완성된 하루치 데이터(날짜, 날씨, 일정)를 전체 리스트에 추가
	            scheduleDataList.add(dailyData);
	        }
	        
	        // 여행에 속한 TripNote 엔티티 목록을 -> NoteDto 목록으로 변환
	        List<TripDto.NoteDto> noteDtos = trip.getTripNotes().stream()
	                .map(TripDto.NoteDto::new) // NoteDto의 변환 생성자 사용
	                .collect(Collectors.toList());

	        // 여행에 속한 TripTip 엔티티 목록을 -> TipDto 목록으로 변환
	        List<TripDto.TipDto> tipDtos = trip.getTripTips().stream()
	                .map(TripDto.TipDto::new) // TipDto의 변환 생성자 사용
	                .collect(Collectors.toList());

	        //TripDetailResponse DTO에 담아서 전달
	        TripDto.TripDetailResponse finalResponse = new TripDto.TripDetailResponse();
	        finalResponse.setTripId(trip.getId().toString());
	        finalResponse.setTripHeaderInfo(headerInfo);
	        finalResponse.setScheduleData(scheduleDataList);
	        finalResponse.setTripNotes(noteDtos); // DTO에 추가 필요
	        finalResponse.setTripTips(tipDtos);   // DTO에 추가 필요
	        
	        return finalResponse;
	    }
	}